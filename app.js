const fs = require('fs')
const express = require('express')
const morgan = require('morgan') // 3rdParty middleware

const app = express()

/* *****************************************
 ******** 1) MIDDLEWARES
 ******************************************** */
app.use(morgan('dev')) // GET /api/v1/tours 200 8.129 ms - 8656
// app.use(morgan('tiny')) // GET /api/v1/tours 200 8656 - 7.153 ms (ovo 200 nije obojeno i drugi redosled)

app.use(express.json()) // middleware je u sustini f-ja koja moze da modifikuje podatke koji nam stizu na server, dakle stoji in the middle of the req i res. Ako ovo zakomentarisemo body je undefined, odn nemamo ga vise

app.use((req, res, next) => {
	// sva ova tri parametra mozemo zapravo ovde nazvati kako hocemo, ali drzimo se konvencija. Ovaj middleware se odnosi na svaku route
	console.log('Hello from the middleware 👋')
	next()
})
app.use((req, res, next) => {
	req.requestTime = new Date().toISOString()
	next() // ne smemo zaboraviti da pozovemo ovu f-ju
})

// podatke ne citamo u app.get u callback fji (EventLoop-u), znamo da to opterecuje thread, nema potrebe
const tours = JSON.parse(
	fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, 'utf-8')
)

const getAllTours = (req, res) => {
	console.log(req.requestTime)

	res.status(200).json({
		status: 'success',
		requestedAt: req.requestTime,
		data: { result: tours.length, tours },
	})
}
const getTour = (req, res) => {
	console.log(req.params)

	const id = +req.params.id
	const tour = tours.find((el) => el.id === id) // ako proveravamo sa if (id > tours.length) , onda ova linija kode ide posle tog if, zbog resursa. zasto uopste da trazimo sa find ako ne postoji taj id

	// if (id > tours.length) {
	if (!tour) {
		return res.status(404).json({
			status: 'fail',
			message: 'Invalid ID',
		})
	}

	res.status(200).json({
		status: 'success',
		data: { tour },
	})
}
const createTour = (req, res) => {
	// console.log(req.body) // bez middlerware ovo bi bilo undefined

	const newID = tours[tours.length - 1].id + 1
	const newTour = Object.assign({ id: newID }, req.body) // Object.assign nam omogucava da napravimo novi objekt na osnovu datog. Mogli smo umesto ovog sa req.body.id ali ne zelimo da mutiramo original body object, wtf

	tours.push(newTour)

	// U EventLoopu (recimo u ovom slucaju to je ova cb f-ja u kojoj smo) ne treba da blockiramo event loop, dakle necemo koristiti writeFileSync, vec writeFile
	fs.writeFile(
		`${__dirname}/dev-data/data/tours-simple.json`,
		JSON.stringify(tours),
		(err) => {
			// 201 znaci da je kreiran
			res.status(201).json({
				status: 'success',
				data: { tour: newTour },
			})
		}
	)
	// res.send('Done') //! ne smemo dva res da saljemo, i ovaj send i ovaj sa json-om
}
const updateTour = (req, res) => {
	// req.params.id * 1 ovako se takodje pretvara String u Number
	if (req.params.id * 1 > tours.length) {
		return res.status(404).json({
			status: 'fail',
			message: 'Invalid ID',
		})
	}

	// ovo je fejk, ne za real world jer nismo zaprravo nista editovali, samo za learning purpose
	res.status(200).json({
		status: 'success',
		data: {
			tour: '<Updated tour here...>',
		},
	})
}
const deleteTour = (req, res) => {
	if (req.params.id * 1 > tours.length) {
		return res.status(404).json({
			status: 'fail',
			message: 'Invalid ID',
		})
	}

	// Inace 204 znaci no content, a to je jer smo ga obrisal
	res.status(204).json({
		status: 'success',
		data: null,
	})
}
/* *****************************************
 ******** 2) ROUTE HANDLES
 OVO JE NACIN 1
 ******************************************** */
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

/* *************************************************************
 ******** 3) ROUTES
 	OVO JE NACIN 2 sa app route koji omogucava chain-ovanje http method-a koji imaju isti http path
 ************************************************************* */
app.route('/api/v1/tours').get(getAllTours).post(createTour)

/* 
Redosled je jako bian u expressu. Ako smo ovaj ovde middleware stavili tu, on se nece okinuti na ovaj iznad get req jer u getAllTours() cb f-ji json() deo oznacava kraj rikvesta, i uopste se ovaj app.use() middleware ne okine.

Dok prilikom ovih ispod get/patch/delete ka /api/v1/tours/:id   path se ofc okine middleware jer je pre tog.

Inace, mozemo dodati koliko hocemo middlerware f-ja

app.use((req, res, next) => {
	console.log('Hello from the middleware 👋')
	next()
})
*/

app.route('/api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour)

/* *****************************************
 ******** 4) START THE SERVER
 ******************************************** */
const port = 3000
app.listen(port, () => console.log(`Listening on port ${port}`))
