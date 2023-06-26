const mongoose = require('mongoose')

const tourSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'A tour must have a name'], // validator, cekira da li je name tu
		unique: true,
	},
	rating: {
		type: Number,
		default: 4.5,
	},
	price: {
		type: Number,
		required: [true, 'A tour must have a price'],
	},
})

const Tour = mongoose.model('Tour', tourSchema) // obicaj je da se koristi uppercase, prvi argument je ime modela, a drugi je shema

// const testTour = new Tour({
// 	// ovo je testTour document, i on je instanca Tour modela
// 	name: 'The Park Camper',
// 	// rating: 4.7,
// 	price: 997,
// })
// // ovde u ovom then() imamo pristup documentu koji smo upravo sacuvali u db
// testTour
// 	.save()
// 	.then((doc) => {
// 		console.log(doc)
// 	})
// 	.catch((err) => {
// 		console.log('ERROR 💥: ' + err)
// 	})

module.exports = Tour
/* 
a gde nam je potreban ovaj Tour? Tj gde cemo ga koristiti odn gde treba da kreiramo, query-mo, update-mo i obrisemo the tour? To cemo uraditi u controllers/tourController.js */
