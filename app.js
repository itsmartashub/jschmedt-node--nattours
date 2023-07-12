const express = require('express')
const morgan = require('morgan') // 3rdParty middleware

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')

const app = express()

/* ///////////////////////////////////////////
	@ 1) MIDDLEWARES
/////////////////////////////////////////// */
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev')) //``` GET /api/v1/tours 200 8.129 ms - 8656
	// app.use(morgan('tiny')) //``` GET /api/v1/tours 200 8656 - 7.153 ms (ovo 200 nije obojeno i drugi redosled)
}

app.use(express.json()) // middleware je u sustini f-ja koja moze da modifikuje podatke koji nam stizu na server, dakle stoji in the middle of the req i res. Ako ovo zakomentarisemo body je undefined, odn nemamo ga vise

app.use(express.static(`${__dirname}/public`)) // kada idemo na http://localhost:3000/overview.html recimo, otvorice se taj html file, dakle ne http://localhost:3000/public/overview.html vec bez public, jer public je jednako root folder.
// takodje, kada ukucamo recimo u browseru u url http://localhost:3000/img/pin.png i otvorice se ta slika, ali NE MOZEMO http://localhost:3000/img/ jer to nije file, to izgleda kao regularna route, a express dakle pokusava da nadje route handler za /img/ sto ne moze jer nismo nista definisali. Dakle ovo radi samo za STATIC FILES

/* app.use((req, res, next) => {
	// sva ova tri parametra mozemo zapravo ovde nazvati kako hocemo, ali drzimo se konvencija. Ovaj middleware se odnosi na svaku route
	console.log('Hello from the middleware 👋')
	next()
}) */
app.use((req, res, next) => {
	req.requestTime = new Date().toISOString()

	console.log(req.headers)

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
