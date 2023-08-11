const mongoose = require('mongoose')
const slugify = require('slugify')
// const validator = require('validator')

const tourSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'A tour must have a name'],
			unique: true,
			trim: true, // samo radi na stringovima, uklanja sve whitespaces
			maxlength: [
				// validator samo za strings
				40,
				'A tour name must have less or equal then 40 characters',
			],
			minlength: [
				// validator samo za strings
				10,
				'A tour name must have more or equal then 10 characters',
			],
			// validate: [
			// 	validator.isAlpha,
			// 	'Tour name must only contain characters',
			// ],
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
			enum: {
				// enum je builtin validator samo za strings
				values: ['easy', 'medium', 'difficult'],
				message: 'Difficulty is either: easy, medium, difficult',
			},
		},
		ratingsAverage: {
			type: Number,
			default: 4.5,
			min: [1, 'Rating must be above 1.0'],
			max: [5, 'Rating must be below 5.0'],
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
			// nas custom validation
			validate: {
				validator: function (val) {
					//@ this only points to current doc on NEW document creation. OVO NECE DAKLE RADITI NA .updateTour, SAMO PRILIKOM KREACIJE DOCUMENTA RADI, ALI NE PRILIKO APDEJTA
					return val < this.price // ako je 100 < 200, 100 je manje od 200, dakle vrati se true, priceDiscount uvek treba da bude manje. A ako jer 250<200, 250 je manje od 200, i to je false, a ako je false onda ce se trigerovati validation error
				},
				message:
					'Discount price ({VALUE}) should be below regular price', // ovo {VALUE} je Mongoose, i on ce imati vrednost ovog val
			},
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
		secretTour: {
			type: Boolean,
			default: false,
		},
		startLocation: {
			// GeoJSON
			type: {
				// svaki ovaj ima svoj schemes
				type: String,
				default: 'Point', // za start position je vrlo bitno da bude Point
				enum: ['Point'],
				// required: true,
			},
			coordinates: [Number], // ocekujemo array of numbers, tipa longitute i latitude
			address: String,
			description: String,
		},
		//! Embeded documents, mora ovaj array u locations! Specifirajuci Niz Objekata, ovo ce rekreirati brand new document unutar parent documenta sto je u ovom slucaju Tour. locations je niz koji sadrzi objekat za svaku lokaciju (svaki obj ima svoj id)
		locations: [
			{
				type: {
					type: String,
					default: 'Point',
					enum: ['Point'], // enum je jednako: cannot be anything but ... U ovom slucaju Point
				},
				coordinates: [Number],
				address: String,
				description: String,
				day: Number,
			},
		],
	},

	//? SCHEMA OPTIONS
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
)

/* ? VIRTUALS
* durationWeeks - ime virtuelnog propertija. I onda definisegemo get method,a to je jer se ovaj virtual property kreira svaki x kada dohvatimo neke podatke iz db. get() prima za argument cb f-ju, i to NE ARROW vec KLASICNU jer ona ima svoj this keyword, a to nam je ovde potrebno jer ce ovde this ukazivati na trenutni document.
! Ovaj durationWeeks virtaul propety ne mozemo koristiti u query-ima, jer on tehnicki nije deo db-a. Tipa NE MOZEMO da sacuvamo:
``` let query = Tour.find().where('durationWeeks').equals(1)
I posto je ovo vise deo biznis logike, a ne app, ovo radimo u tourModel.js, a ne tourController.js */
tourSchema.virtual('durationWeeks').get(function () {
	return this.duration / 7
})

/* ? DOCUMENT MIDDLEWARE, runs before .save() and .create(), ali ne i kad vrsimo .insertMany()
Postoje 4 vrste middleware u mongoose:
	1. Documents
	2. Query
	3. Aggregate
	4. Model

Document Middleware utice na trenutnog procesuiranog documenta.
pre() mw se pokrene PRE eventa koji navedemo u zagradi, u ovom slucaju ce to biti 'save' event. Drugi parametar je cb f-ja koja ce se pozvati pre nego se document sacuva u db.
! Ovaj mw ce se izvrsiti samo y .save() i ,create(), u .insertMany() nece */
tourSchema.pre('save', function (next) {
	// svaki middleware ima pristup next-u
	// console.log(this) // this upucuje na trenutni procesuirani doc
	/* 
	Jesmo mi ovde definisali slug, tj pokusavamo da ga setujemo, ali posto on trenutno ne postoji y Schemi, nece se nista dogoditi. Moramo dakle da ga definisemo u Schemi gore */
	this.slug = slugify(this.name, { lower: true })

	next() // i to poziva next mw u stack-u
})

// neko zove mw neko zove HOOK
tourSchema.pre('save', function (next) {
	// this.find({ secretTour: { $ne: true } })
	console.log('Will save document...')
	next()
})

/* post() mw ima pristup ne samo next-u, vec i documentu koji je upravo sacuvan u db. post() mw fn se izvrsava NAKON STO SU SVE pre() mw f-je izvrsene */
tourSchema.post('save', function (doc, next) {
	console.log(doc)
	next()
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
