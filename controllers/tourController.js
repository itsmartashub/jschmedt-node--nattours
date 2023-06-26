// const fs = require('fs')

// podatke ne citamo u app.get u callback fji (EventLoop-u), znamo da to opterecuje thread, nema potrebe
// btw, __dirname je sad routes, moramo jedan napolje tj ..

// podatke ne citamo u app.get u callback fji (EventLoop-u), znamo da to opterecuje thread, nema potrebe
// btw, __dirname je sad controllers, moramo jedan napolje tj ..
/*
const tours = JSON.parse(
	fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8')
) */

// // router.param mw koju pozivamo u tourRoutes.js
// exports.checkID = (req, res, next, val) => {
// 	console.log('Tour id is: ' + val)

// 	if (req.params.id * 1 > tours.length) {
// 		// takodje je jako bitan ovaj return, da ga nema onda bi express tako poslao response, ali bi takodje nastravio da obavlja kod u ovoj checkID f-ji, dakle ovo next() isve van if blocka
// 		return res.status(404).json({
// 			status: 'fail',
// 			message: 'Invalid ID',
// 		})
// 	}

// 	next() // NE ZABORAVI - da nismo pozvali ovo next() request response cycle bi zaglavio ovde u ovoj mw f-ji i nece moci da nastavi ka drugom mw-u u stacku
// }

/*
Create a checkBody mw - check if the body contains the name and price property, if not return 400 (bad request from he client) status code. Add it to the post handler stack */
exports.checkBody = (req, res, next) => {
	// console.log(req.body)

	if (!req.body.name || !req.body.price) {
		return res.status(400).json({
			status: 'fail',
			message: 'Please add a name or the price',
		})
	}
	next() // a sledeci mw je createTour
}

exports.getAllTours = (req, res) => {
	// console.log(req.requestTime)

	res.status(200).json({
		status: 'success',
		requestedAt: req.requestTime,
		// data: { result: tours.length, tours },
	})
}
exports.getTour = (req, res) => {
	// // console.log(req.params)

	// const id = +req.params.id
	// const tour = tours.find((el) => el.id === id) // ako proveravamo sa if (id > tours.length) , onda ova linija kode ide posle tog if, zbog resursa. zasto uopste da trazimo sa find ako ne postoji taj id

	// // if (id > tours.length) {
	// // sada imamo checkID mw umesto ovog
	// // if (!tour) {
	// // 	return res.status(404).json({
	// // 		status: 'fail',
	// // 		message: 'Invalid ID',
	// // 	})
	// // }

	res.status(200).json({
		status: 'success',
		// data: { tour },
	})
}
exports.createTour = (req, res) => {
	res.status(201).json({
		status: 'success',
		// data: { tour: req.body },
	})
	// // console.log(req.body) // bez middlerware ovo bi bilo undefined

	// const newID = tours[tours.length - 1].id + 1
	// const newTour = Object.assign({ id: newID }, req.body) // Object.assign nam omogucava da napravimo novi objekt na osnovu datog. Mogli smo umesto ovog sa req.body.id ali ne zelimo da mutiramo original body object, wtf

	// tours.push(newTour)

	// // U EventLoopu (recimo u ovom slucaju to je ova cb f-ja u kojoj smo) ne treba da blockiramo event loop, dakle necemo koristiti writeFileSync, vec writeFile
	// fs.writeFile(
	// 	`${__dirname}/dev-data/data/tours-simple.json`,
	// 	JSON.stringify(tours),
	// 	(err) => {
	// 		// 201 znaci da je kreiran
	// 		res.status(201).json({
	// 			status: 'success',
	// 			data: { tour: newTour },
	// 		})
	// 	}
	// )
	// // res.send('Done') //! ne smemo dva res da saljemo, i ovaj send i ovaj sa json-om
}
exports.updateTour = (req, res) => {
	// req.params.id * 1 ovako se takodje pretvara String u Number

	// sada imamo checkID mw umesto ovog
	// if (req.params.id * 1 > tours.length) {
	// 	return res.status(404).json({
	// 		status: 'fail',
	// 		message: 'Invalid ID',
	// 	})
	// }

	// ovo je fejk, ne za real world jer nismo zaprravo nista editovali, samo za learning purpose
	res.status(200).json({
		status: 'success',
		data: {
			tour: '<Updated tour here...>',
		},
	})
}
exports.deleteTour = (req, res) => {
	// ovo premestamo u mw f-ju jer se ponavlja u svakoj ovoj f-ji
	// if (req.params.id * 1 > tours.length) {
	// 	return res.status(404).json({
	// 		status: 'fail',
	// 		message: 'Invalid ID',
	// 	})
	// }

	// Inace 204 znaci no content, a to je jer smo ga obrisal
	res.status(204).json({
		status: 'success',
		data: null,
	})
}

// i posto ovde ne exportujemo samo jednu stvar, ne mozemo koristriti module.exports = sta_exportujemo, vec umesto const stavljamo exports i dodajemo . pa ime promenljive. I onda idemo u routes/tourRoutes.js i importujemo ih
