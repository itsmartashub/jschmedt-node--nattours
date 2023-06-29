const mongoose = require('mongoose')

const tourSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'A tour must have a name'],
		unique: true,
		trim: true, // samo radi na stringovima, uklanja sve whitespaces
		// maxlength: [
		// 	40,
		// 	'A tour name must have less or equal then 40 characters',
		// ],
		// minlength: [
		// 	10,
		// 	'A tour name must have more or equal then 10 characters',
		// ],
		// validate: [validator.isAlpha, 'Tour name must only contain characters']
	},
	slug: String,
	duration: {
		type: Number,
		required: [true, 'A tour must have a duration'],
	},
	maxGroupSize: {
		type: Number,
		required: [true, 'A tour must have a group size'],
	},
	difficulty: {
		type: String,
		required: [true, 'A tour must have a difficulty'],
		// enum: {
		// 	values: ['easy', 'medium', 'difficult'],
		// 	message: 'Difficulty is either: easy, medium, difficult',
		// },
	},
	ratingsAverage: {
		type: Number,
		default: 4.5,
		// min: [1, 'Rating must be above 1.0'],
		// max: [5, 'Rating must be below 5.0'],
	},
	ratingsQuantity: {
		type: Number,
		default: 0,
	},
	price: {
		type: Number,
		required: [true, 'A tour must have a price'],
	},
	priceDiscount: {
		type: Number,
		// validate: {
		// 	validator: function (val) {
		// 		// this only points to current doc on NEW document creation
		// 		return val < this.price
		// 	},
		// 	message: 'Discount price ({VALUE}) should be below regular price',
		// },
	},
	summary: {
		type: String,
		trim: true,
		required: [true, 'A tour must have a description'],
	},
	description: {
		type: String,
		trim: true,
	},
	imageCover: {
		type: String, // ime slike. dakle ne ucitvamo sliku u db, jer je to losa praksa, slike budu negde u filesystem, pa ucitavamo odatle, a u db cuvamo samo ime slike
		required: [true, 'A tour must have a cover image'],
	},
	images: [String], // po type je ovo niz stringova, dakle niz u kom su stringovi/nazivi slika
	createdAt: {
		type: Date,
		default: Date.now(),
		select: false, //! da excludujemo field, recimo ovo je bitno za passworde, njih nikad necemo da includujemo klijentu
	},
	startDates: [Date],
	// secretTour: {
	// 	type: Boolean,
	// 	default: false,
	// },
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
