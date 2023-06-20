const fs = require('fs')
const express = require('express')

const router = express.Router()

// podatke ne citamo u app.get u callback fji (EventLoop-u), znamo da to opterecuje thread, nema potrebe
// btw, __dirname je sad routes, moramo jedan napolje tj ..
const tours = JSON.parse(
	fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8')
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

router.route('/').get(getAllTours).post(createTour)
router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour)

// ovako exportujemo kad je samo jedna stvar u pitanju
module.exports = router
