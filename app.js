const express = require('express')
const morgan = require('morgan') // 3rdParty middleware
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp') // http parameters pollution

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')

const app = express()

/* ///////////////////////////////////////////
	@ 1) GLOBAL MIDDLEWARES
/////////////////////////////////////////// */
//? SET SECURITY HTTP HEADERS
app.use(helmet()) // bitno je da je stavljen pre ostalih mw ili medju prvima

//? DEVELOPMENT LOGGING
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev')) //``` GET /api/v1/tours 200 8.129 ms - 8656
	// app.use(morgan('tiny')) //``` GET /api/v1/tours 200 8656 - 7.153 ms (ovo 200 nije obojeno i drugi redosled)
}

//? LIMIT REQUESTS FROM SAME IP
// ovaj limiter je bejzikli middleware fn
const limiter = rateLimit({
	/* How many requests per ip we will allowed per hour
	100 rikvestova sa iste IP adrese u jednom satu.
	! Naravno, vrlo je bitno da se nadje balans u zavisnosti od aplikacije koju pravimo. Ako recimo pravimo neki API, naravno zelimo da dozvolimo vise od 100 requestova per IP */
	// max: 3,
	max: 100,
	windowMs: 60 * 60 * 1000, // 1 hour
	message: 'Too many requests from this IP, please try again in an hour!',
})
// app.use(limiter)
app.use('/api', limiter) // limit access to our /api route, dkale limitirace se sve rute koje pocinju sa /api
/* i sada recimo idemo da okinemo request /api/v1/tours i vidimo u Headers:
```	x-ratelimit-limit: 100
```	x-ratelimit-remaining: 99
``` x-ratelimit-reset: 1690839320
Odnosno koliko ukupno imamo req (100), i koliko nam je preostalo (99) i timestamp kad se resetovao 1690839320, onaj 1h windowMs sto smo naveli.
Inace, ako restartujemo app, namerno nili ako app crashuje, resetovace se i rateLimit, tj bice ponovo 100, a ne koliko je preostalo.
Elem, posto hocemo da vidimo da l inmasa err message radi, stavljamo max: 3, pa cemo da istrosimo ova 3 requesta i da vidimo message error. I dobijamo nasu poruku i kod 429 Too Many Requests koja je by rateLimit */

//? BODY PARSER, READING DATA FROM body INTO req.body
app.use(express.json({ limit: '10kb' })) // middleware je u sustini f-ja koja moze da modifikuje podatke koji nam stizu na server, dakle stoji in the middle of the req i res. Ako ovo zakomentarisemo body je undefined, odn nemamo ga vise
// ovaj limit: '10kb' znaci da limitramo body na 10kb, i ako je on veci, necem biti prihvacen

//? DATA SANATIZATION AGAINST NoSQL QUERY INJECTION
/*
@ KOLIKO JE LAKO ODRADITI NoSQL QUERY INJECTION ako recimo znamo password ali ne i email

Idemo u recimo login request, i za body json stavimo:

``` {
```		"email": { "$qt": "" },
```		"password": "pwd_koji_znamo"
``` }

I ovo radi jer ce { "$qt": "" } uvek biti true. I recimo idemo u Compass MOngo DB, odemo u nasy users db, i u filter input napisemo query: {"email": { "$qt": "" }} i vidimo da vraca sve korisnike jer je to uvek true.
Idemo da instaliramo: npm i express-mongo-sanitize
I takodje instaliramo: npm i xss
*/
app.use(mongoSanitize()) // ovaj mw gleda req.body, req.query string i req.params i filtrira sve $ i tacke (dollar sings i dots), jer su tako mongo db operatori pisani

//? DATA SANATIZATION AGAINST XSS
app.use(xss()) // cisti bilo koji input od zlonamernog HTML koda
/* 
	Recimo ako se signupujemo sa body jsonom:
```		{
```			"name": "<div id='bad-code'>Name</div>",
```			"email": "xss_tester@test.io",
```			"password": "pass1234",
```			"passwordConfirm": "pass1234"
```		}

sa ukljucenim xss mw, signupovace se ali ali sa name-om:
```		 "name": "&lt;div id='bad-code'>Name&lt;/div>"
*/

//? PREVENT PARAMETER POLLUTION - i on treba da je na kraju jer clearup-uje query string
/* 
pogledaj utils/apiFeatures.js u sort() fn gde opisujem zasto hpp - dva ista parametar field-a u requestu itd
recimo pogledaj req /api/v1/tours?duration=5&duration=9 sa aktivnim hpp() bez whitelista - dohvata 2 toursa, i kad ga zakomentarisemo, ili stavimo whitelist - dohvata 4 toursa */
app.use(
	hpp({
		whitelist: [
			'duration',
			'ratingsQuantity',
			'ratingsAverage',
			'maxGroupSize',
			'difficulty',
			'price',
		], // whitelist je niz propertija cije duplikovanje dozvoljavamo u req.query stringu
	})
)

//? SERVING STATIC FILES
app.use(express.static(`${__dirname}/public`)) // kada idemo na http://localhost:3000/overview.html recimo, otvorice se taj html file, dakle ne http://localhost:3000/public/overview.html vec bez public, jer public je jednako root folder.
// takodje, kada ukucamo recimo u browseru u url http://localhost:3000/img/pin.png i otvorice se ta slika, ali NE MOZEMO http://localhost:3000/img/ jer to nije file, to izgleda kao regularna route, a express dakle pokusava da nadje route handler za /img/ sto ne moze jer nismo nista definisali. Dakle ovo radi samo za STATIC FILES

//? TEST MIDDLEWARE
/* app.use((req, res, next) => {
	// sva ova tri parametra mozemo zapravo ovde nazvati kako hocemo, ali drzimo se konvencija. Ovaj middleware se odnosi na svaku route
	console.log('Hello from the middleware 👋')
	next()
}) */
app.use((req, res, next) => {
	req.requestTime = new Date().toISOString()

	// console.log(req.headers)

	next() // ne smemo zaboraviti da pozovemo ovu f-ju
})

/* ////////////////////////////////////////////
	@ 2) ROUTE HANDLES
 	OVO JE NACIN 1
//////////////////////////////////////////// */
/* 
app.get('/api/v1/tours', getAllTours)


// ovo :id moze biti sta god, :var, :x, :p, :c, sta god :D

// takodje moze biti i chain tih promenljivih tipa:
//     /api/v1/tours/:id/:name/:level/:c
//
// Vazno, ukoliko client salje req na ovaj path:
//     /api/v1/tours/:id/:name/:level/:c
// on mora isto toliko params da stavi, znaci ne moze:
//     /api/v1/tours/2/nikola
// bude error 404
// 
// Ali mozemo za taj parametar da stavimo da je optional, samo dodamo ?
//     /api/v1/tours/:id/:name/:level?/:c?      
// app.get('/api/v1/tours/:id', getTour)

// da bismo dohvatili body podatke u express-u moramo koristiti middleware, to je ono kad napisemo app.use(express.json())
app.post('/api/v1/tours', createTour)

// Imamo dva HTTPS methoda kojima apdejtujemo podatke: sa PUT ocekujemo da se menja citav objekat, a sa PATCH ocekujemo da se promena vrsi samo nad property-em u tom objektu
app.patch('/api/v1/tours/:id', updateTour)

app.delete('/api/v1/tours/:id', deleteTour)
*/

/* ///////////////////////////////////////////
 	@ 3) ROUTES
 	OVO JE NACIN 2 sa app route koji omogucava chain-ovanje http method-a koji imaju isti http path
/////////////////////////////////////////// */

//? PRE KORISCENJA ROUTER MIDDLEWARE
/* 
app.route('/api/v1/tours').get(getAllTours).post(createTour)


Redosled je jako bian u expressu. Ako smo ovaj ovde middleware stavili tu, on se nece okinuti na ovaj iznad get req jer u getAllTours() cb f-ji json() deo oznacava kraj rikvesta, i uopste se ovaj app.use() middleware ne okine.

Dok prilikom ovih ispod get/patch/delete ka /api/v1/tours/:id   path se ofc okine middleware jer je pre tog.

Inace, mozemo dodati koliko hocemo middlerware f-ja

// app.use((req, res, next) => {
// 	console.log('Hello from the middleware 👋')
// 	next()
// })

app.route('/api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour)

app.route('/api/v1/users').get(getAllUsers).post(createUser)
app.route('/api/v1/users/:id').get(getUser).patch(updateUser).delete(deleteUser) 

app.route('/api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour)

app.route('/api/v1/users').get(getAllUsers).post(createUser)
app.route('/api/v1/users/:id').get(getUser).patch(updateUser).delete(deleteUser) */

//? ROUTER MIDDLEWARE
/* 
const tourRouter = express.Router()
const userRouter = express.Router()

tourRouter.route('/').get(getAllTours).post(createTour)
tourRouter.route('/:id').get(getTour).patch(updateTour).delete(deleteTour)
userRouter.route('/').get(getAllUsers).post(createUser)
userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser) */

// ovo se zove MOUNT of ROUTES. Zapamti da su ovo middlewari za rute, zato mozmeo koristiti app.use(). Dok su oni gore middlewari za citavu app
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)

//? HANDLING UNHANDLED ROUTES MW
/* svaki naredni mw posle ova dva iznad (tourRouter i userRouter), ako se okine, znaci da ta dva iznad nisu mogla da se hendluju, tj nisu se catchovala. all predtavlja mw za svaki od rikvestova. a * znaci za bilo koju "nepostojecu" rutu.
! DAKLE JAKO JE BITNO GDE SMO NAPISALI OVAJ MW */
app.all('*', (req, res, next) => {
	/*
	//? Pre err handling mw
	// res.status(404).json({
	// 	status: 'fail',
	// 	message: `Can't find ${req.originalUrl} on this server!`,
	// })

	//? Sa err handling mw
	const err = new Error(`Can't find ${req.originalUrl} on this server!`) // ovaj String u new Error() ce biti err.message property
	err.status = 'fail'
	err.statusCode = 404

	next(err) //! ako next() f-ja primi neki argument, nebitno sta je, Express ce automatski znati da je doslo do errora. I skipovace sve nase ostale mw u stacku i poslace  ovaj error koji smo prosledili u nas global error handling mw koiji ce se potom izvrsiti. I ovako cemo da prepravimo svaki error u nasim f-jama.
	*/

	//? SA APPERROR CLASSOM
	next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

//? GLOBAL ERROR HANDLING MW
app.use(globalErrorHandler)

module.exports = app
