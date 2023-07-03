// const fs = require('fs')
const Tour = require('../models/tourModel')
const APIFeatures = require('../utils/apiFeatures')

/*
	// podatke ne citamo u app.get u callback fji (EventLoop-u), znamo da to opterecuje thread, nema potrebe
	// btw, __dirname je sad controllers, moramo jedan napolje tj ..

	const tours = JSON.parse(
		fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8')
	)
*/

/*
// router.param mw koju pozivamo u tourRoutes.js
exports.checkID = (req, res, next, val) => {
	console.log('Tour id is: ' + val)

	if (req.params.id * 1 > tours.length) {
		// takodje je jako bitan ovaj return, da ga nema onda bi express tako poslao response, ali bi takodje nastravio da obavlja kod u ovoj checkID f-ji, dakle ovo next() isve van if blocka
		return res.status(404).json({
			status: 'fail',
			message: 'Invalid ID',
		})
	}

	next() // NE ZABORAVI - da nismo pozvali ovo next() request response cycle bi zaglavio ovde u ovoj mw f-ji i nece moci da nastavi ka drugom mw-u u stacku
}
*/

/*
// Create a checkBody mw - check if the body contains the name and price property, if not return 400 (bad request from he client) status code. Add it to the post handler stack 
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
*/

exports.aliasTopTours = (req, res, next) => {
	req.query.limit = '5'
	req.query.sort = '-ratingsAverage,price'
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty'

	next()
}

exports.getAllTours = async (req, res) => {
	// console.log(req.requestTime)

	try {
		//@ BUILD QUERY
		//? 1a) Filtering
		// const queryObj = { ...req.query } // shallow copy of req object. Moramo shallow copy jer ako obrisemo nesto iz queryObj obrisacemo i iz req.query object, a to ne smemo. Zato pravimo shallow copy od req.query sa {...}

		// // console.log(req.query, queryObj)

		// const excludedFields = ['page', 'sort', 'limit', 'fields']
		// excludedFields.forEach((el) => delete queryObj[el]) // zelimo da obrisemo queryObj sa imenom ovog trenutnog elementa

		//? 1b) Advanced Filtering
		// /*
		// Ovako manuelno pisemo filter Object za query u mongodb shellu:
		// ```		{ difficulty: 'easy', duration: { $gte: 5} }

		// U url za req za sever ga pisemo ovako:
		// ```		/api/v1/tours?duration[gte]=5&difficulty=easy&price[lt]=1500
		// ``` 	/api/v1/tours?duration[gte]=5&difficulty=easy
		// i u konzoli na serveru kad logujemo req.query za ovu drugu url dobijamo:
		// ``` 	{ difficulty: 'easy', duration: { gte: '5'} }
		// dakle jedina razlika je gt bezz $, i sto je '5' string

		// zelimo da gte, gt, lte, lt zamenimo sa $gte, $gt, $lte, $lt  i to cemo odraditi sa regex */
		// let queryStr = JSON.stringify(queryObj)

		// /*
		// ovo \b (before) znaci exactly ta rec, dakle aako imamo lting, necemo lting, vec samo gde ima lt. a \g znaci da replejsuje all of them, dakle ne samo prvi x kad naidje na neki od njig, vec svugde.
		// replace(_regex, _cb) za drugi argument prihvata cb f-ju, koja ima za prvi argument matched word/string, i ono sto vracamo iz te cb f-je je novi string koji riplejsuje stariji. Dakle mi zelimo da dodamo $ */
		// queryStr = queryStr.replace(
		// 	/\b(gte|gt|lte|lt)\b/g,
		// 	(match) => `$${match}`
		// )
		// // console.log(JSON.parse(queryStr))

		// let query = Tour.find(JSON.parse(queryStr))
		// // const query = Tour.find(queryObj)

		//? 2) Sorting
		// /*
		// ``` /api/v1/tours?sort=price   - ascending order
		// ``` /api/v1/tours?sort=-price  - descending order */
		// if (req.query.sort) {
		// 	// ako ovaj sort property postoji to znaci da zelimo da sortiramo

		// 	/*
		// 	sort('price ratingsAverage')  - mongoose
		// 	``` /api/v1/tours?sort=-price,ratingsAverage
		// 	``` /api/v1/tours?sort=-price,-ratingsAverage */
		// 	const sortBy = req.query.sort.split(',').join(' ')
		// 	// console.log(sortBy)
		// 	// query = query.sort(req.query.sort)
		// 	query = query.sort(sortBy)

		// 	/*
		// 	default. za slucaj da user ne navede neki sort, mi cemo kreirati difoltni u ovom else. I mi cemo sortirati po datumu kreiranja, od novijeg ka starijem, da oni noviji budu prikazani prvo */
		// } else {
		// 	query = query.sort('-createdAt')
		// }

		//? 3) Field limitating
		// //``` /api/v1/tours?fileds=name,duration,difficulty,price

		// // console.log(req.query.fields) // name,duration,difficulty,price

		// if (req.query.fields) {
		// 	const fields = req.query.fields.split(',').join(' ') // 'name duration price'
		// 	query = query.select(fields)

		// 	// ako nemamo nista od fields zadato onda ovo else
		// } else {
		// 	query = query.select('-__v') // excludujemo --v, dakle imamo sve iz query-a osim __v
		// }

		//? 4) Pagination
		// //``` /api/v1/tours?page=2&limit=10
		// /* query = query.skip(2).limit(10)

		// 10 itema po stranici je ovo limit, a skip je kolicina rezultata koja treba da bude skipovana pre nego sto se i query-ju podaci

		// page=2&limit=10  |  query = query.skip(10).limit(10)
		// page=3&limit=10  |  query = query.skip(20).limit(10)
		// page=4&limit=10  |  query = query.skip(30).limit(10)

		// 	1-10, page 1
		// 	11-20, page 2
		// 	21-30, page 3
		// 	...
		// dakle ako smo na prvoj stranici, moramo da preskocimo 10 resultata (itema) da bismo stigli na stranicu 2

		// (req.query.page - 1) * +req.query.limit) */

		// const page = +req.query.page || 1
		// const limit = +req.query.limit || 100
		// const skip = (page - 1) * limit

		// query = query.skip(skip).limit(limit)

		// if (req.query.page) {
		// 	const numTours = await Tour.countDocuments() // vraca broj dokumentata
		// 	if (skip >= numTours) throw new Error('This page does not exist') // ovde kad y ovom try{} bloku throwujemo erorr, momentalno ode u catch{} block
		// }

		//@ EXECUTE QUERY
		// query object kreiramo sa Tour.find(), a query string je req.query
		const features = new APIFeatures(Tour.find(), req.query)
			.filter()
			.sort()
			.limitFields()
			.paginate()

		const tours = await features.query

		// const tours = await query
		// query.sort().select().skip().limit()  -- ovako bi trebalo da izgleda nas query

		/* 
		// const tours = await Tour.find() // kada u find() ne prosledimo neki parametar, vratice sve documents
		// const tours = await Tour.find(req.query)
		// const tours = await Tour.find(queryObj)

		? I - ovako se pisu queries in Mongoose
		const tours = await Tour.find({
			duration: 5,
			difficulty: 'easy',
		})

		? II - ovako se pisu queries in Mongoose sa njegovim special methods. ovo sto je equals moze biti lt, gt, lte, gte
		const query = Tour.find()
			.where('duration')
			.equals(5)
			.where('difficulty')
			.equals('easy ')
		*/

		//@ SEND RESPONSE
		res.status(200).json({
			status: 'success',
			results: tours.length,
			// requestedAt: req.requestTime,
			data: { tours },
		})
	} catch (error) {
		res.status(404).json({
			status: 'fail',
			message: error,
		})
	}
}
exports.getTour = async (req, res) => {
	/* 
	// console.log(req.params)

	const id = +req.params.id
	const tour = tours.find((el) => el.id === id) // ako proveravamo sa if (id > tours.length) , onda ova linija kode ide posle tog if, zbog resursa. zasto uopste da trazimo sa find ako ne postoji taj id

	// if (id > tours.length) {
	// sada imamo checkID mw umesto ovog
	if (!tour) {
		return res.status(404).json({
			status: 'fail',
			message: 'Invalid ID',
		})
	}
	*/

	try {
		/* 
		ovo Tour.findById(req.params.id) je isto kao i Tour.findOne({ _id: req.params.id })  */
		const tour = await Tour.findById(req.params.id)

		res.status(200).json({
			status: 'success',
			data: { tour },
		})
	} catch (error) {
		res.status(404).json({
			status: 'fail',
			message: error,
		})
	}
}
exports.createTour = async (req, res) => {
	try {
		/*
		const newTour = new Tour({})
		newTour.save() */

		/* 
		isto kao ovo iznad. Jedina razlika je sto ovde pozivamo method na Tour model direktno, dok iznad pozivamo method na novi document (newTour.save()). req.body su podaci koji dolaze sa post requestom. Dakle u Tour model prosledjujemo podatke koje zelimo da prosledimo bazi podataka, i ti podaci dolaze iz post req. */
		const newTour = await Tour.create(req.body)

		res.status(201).json({
			status: 'success',
			// data: { tour: req.body },
			data: { tour: newTour },
		})
	} catch (error) {
		/*
		postoji validation (taj validation smo radili u tourModel.js za name i price, ono gde je required) error koji ako se desi, ovde ce se catchovati. 400 je bad request */
		res.status(400).json({
			status: 'fail',
			message: error,
			// message: 'Invalid data sent',
		})
	}

	/*
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
	*/
}
exports.updateTour = async (req, res) => {
	/* 
	req.params.id * 1 ovako se takodje pretvara String u Number

	sada imamo checkID mw umesto ovog
	if (req.params.id * 1 > tours.length) {
		return res.status(404).json({
			status: 'fail',
			message: 'Invalid ID',
		})
	}
	*/

	// ovo je fejk, ne za real world jer nismo zaprravo nista editovali, samo za learning purpose
	try {
		const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
			new: true, // new document je taj koji ce se vratiti, ovim kazemo da zelimo da se taj document vrati clientu
			runValidators: true, // samo zbog ovog ce se validatori pokrenuti ne samo prvi put kad kreiramo nesto vec i kad apdejtujemo neki podatak
		})

		res.status(200).json({
			status: 'success',
			data: { tour },
		})
	} catch (error) {
		res.status(400).json({
			status: 'fail',
			message: 'Invalid data sent',
		})
	}
}
exports.deleteTour = async (req, res) => {
	/*
	// ovo premestamo u mw f-ju jer se ponavlja u svakoj ovoj f-ji
	if (req.params.id * 1 > tours.length) {
		return res.status(404).json({
			status: 'fail',
			message: 'Invalid ID',
		})
	}
	*/

	try {
		await Tour.findByIdAndDelete(req.params.id)

		// Inace 204 znaci no content, a to je jer smo ga obrisal
		res.status(204).json({
			status: 'success',
			data: null,
		})
	} catch (error) {
		res.status(400).json({
			status: 'fail',
			message: error,
		})
	}
}

// ? Pipeline
exports.getTourStats = async (req, res) => {
	try {
		// aggregation pipeline, kao neki regular query, samo sto ovde mozemo da manipulisemo podacima u vise koraka. Te korake definisemo u aggr array, i oni se nazivaju stages
		const stats = await Tour.aggregate([
			{
				$match: { ratingsAverage: { $gte: 4.5 } },
			},
			{
				$group: {
					//_id: null, // kako zelimo da grupisemo. Za sad necemo da navodimo nista, jer zelimo da sve bude u jednoj grupi da mozemo da kalkulisemo statiskiku za sve tours zajedno, a ne odvojene grupama
					// _id: '$ratingsAverage',
					_id: { $toUpper: '$difficulty' },
					numTours: { $sum: 1 }, // dodajemo 1 za svaki document da bismo izracunali koliko ukupno ima tour documenta
					numRatings: { $sum: '$ratingsQuantity' },
					avgRating: { $avg: '$ratingsAverage' },
					avgPrice: { $avg: '$price' },
					minPrice: { $min: '$price' },
					maxPrice: { $max: '$price' },
				},
			},
			{
				$sort: { avgPrice: 1 },
			},
			// {
			// 	$match: { _id: { $ne: 'EASY' } }, // selectujemo sve documente koji nisu EASY
			// },
		])

		console.log(stats)

		res.status(200).json({
			status: 'success',
			data: { stats },
		})
	} catch (error) {
		res.status(400).json({
			status: 'fail',
			message: error,
		})
	}
}

// @ Realword Bizz Problem - treba da dobijemo koji mesec je sa kojim tours najzauzetinji u toku godine
exports.getMonthlyPlan = async (req, res) => {
	try {
		const year = +req.params.year // 2021

		const plan = await Tour.aggregate([
			{
				/* 
				Svaki tours doc ima niz datuma u "startsDates", dakle datumi kad je koji tour poceo.
				Zelimo da countujemo koliko je tour-a bilo za svaki mesec u datoj godini. Dakle, za pocetak cemo se fokusirati na mesece, njih cemo "cupati". Tipa, jedna tour je bila u maju, i neka tamo treva tour je isto bilo, i sl. Najlaksi nacin da ihb dodamo sve zaj jeste da imamo jedan tour za svaki od ovig datuma -- WTF. A to kao mozemo da radimo sa aggregation pipeline. Postoji stage za to, i zove se $unwind - deconstract an array fields from the input documents, and then output one document for each element of the array */
				$unwind: '$startDates',
			},
			{
				$match: {
					/* select the documents by qyert
					zelimo da date bude veci od 1. Januar trenutne godine, recimo 2021, i manje od 1. Januar 2022 */
					startDates: {
						$gte: new Date(`${year}-01-01`),
						$lte: new Date(`${year}-12-31`),
					},
				},
			},
			{
				$group: {
					_id: { $month: '$startDates' }, // extractujemo month iz datuma. $startDates je ime field-a iz kog hocemo da extractujemo month. ovo _id znaci da grupisemo by the month

					numTourStarts: { $sum: 1 }, // sad ono sto je nama je potrebno sve vreme je da odredimo koliko tours-a pocinje u tom i tom mesecu. I za to cemo samo da countujemo amount of tours that have certain month

					tours: { $push: '$name' }, // a ono najbitnije je ne samo koliko tours, nego i KOJE tours
				},
			},
			{
				$addFields: { month: '$_id' },
			},
			{
				$project: {
					// svakom polju dodajemo 1 ili 0. 0 znaci da vise ne prikazujemo to ,a 1 da prikazujemo. Dakle vrednost _id smo prvo premestili u month sa addFields, i sad ga uklanjamo sa _id: 0
					_id: 0,
				},
			},
			{
				$sort: { numTourStarts: -1 }, // -1 znaci descending, dakle pocinjemo sa najvecim brojem
			},
			// {
			// 	$limit: 6, // da prikaze samo 6 documents recimo. Ali to u ovom slucaju nije korisno, samo je Jonas hteo da pokaze da i to moze
			// },
		])

		/* ``` OUTPUT
		"plan": [
			{
				numTourStarts: 3,
				tours: ['The Sports Lover', 'The Forest Hiker', 'The Sea Explorer'],
				month: 7,
			},
			{
				numTourStarts: 2,
				tours: ['The Park Camper', 'The Sea Explorer'],
				month: 8,
			},
			{
				numTourStarts: 2,
				tours: ['The Sports Lover', 'The Wine Taster'],
				month: 9,
			},
			{
				numTourStarts: 2,
				tours: ['The City Wanderer', 'The Sea Explorer'],
				month: 6,
			},
			{
				numTourStarts: 2,
				tours: ['The City Wanderer', 'The Star Gazer'],
				month: 3,
			},
			{
				numTourStarts: 2,
				tours: ['The Wine Taster', 'The Forest Hiker'],
				month: 4,
			},
			{
				numTourStarts: 2,
				tours: ['The Forest Hiker', 'The Star Gazer'],
				month: 10,
			},
			{
				numTourStarts: 1,
				tours: ['The Northern Lights'],
				month: 12,
			},
			{
				numTourStarts: 1,
				tours: ['The City Wanderer'],
				month: 5,
			},
			{
				numTourStarts: 1,
				tours: ['The Wine Taster'],
				month: 2,
			},
		]
	*/
		res.status(200).json({
			status: 'success',
			data: { plan },
		})
	} catch (error) {
		res.status(400).json({
			status: 'fail',
			message: error,
		})
	}
}

/* i posto ovde ne exportujemo samo jednu stvar, ne mozemo koristriti module.exports = sta_exportujemo, vec umesto const stavljamo exports i dodajemo . pa ime promenljive. I onda idemo u routes/tourRoutes.js i importujemo ih */
