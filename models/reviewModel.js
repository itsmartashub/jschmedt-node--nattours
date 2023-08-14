const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema(
	{
		review: {
			type: String,
			required: [true, 'Review can not be empty!'],
		},
		rating: {
			type: Number,
			min: 1,
			max: 10,
		},
		createdAt: {
			type: Date,
			default: Date.now(),
		},
		// for which tour is this review
		tour: {
			type: mongoose.Schema.ObjectId,
			ref: 'Tour',
			required: [true, 'Review must belong to a tour.'],
		},
		// who wrote this review
		user: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: [true, 'Review must belong to a user.'],
		},
	},
	//? virtuals nam koriste kada imamo virtual property tj field koji se ne cuva u db vec se preracunava koristeci neke druge vrednosti
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
)

//! Kada zelimo da populate-mo recimo 2 polja, moramo pozvati 2 populate(), dakle za svako polje jedan populate
reviewSchema.pre(/^find/, function (next) {
	//! imaj na umu da ce ovo dodati extra queries, jer u pozadini mongoose salje plus 2 query-a, 1 za tour i 1 za user ne bi li pronasao matching document. Dakle i vremena ce trebati vise!!
	this.populate({
		path: 'tour',
		select: 'name', // zelimo samo tour name i nista vise
	}).populate({
		path: 'user',
		select: 'name photo', // zelimo user name i user photo. ne zelimo da leakujemo sve podatke o useru ako recimo on ostavi review, tipa email, itd, vec zelimo da svaki review ima samo ime i sliku korisnika koji je ostavio review
	})
	next()
})
const Review = mongoose.model('Review', reviewSchema)

module.exports = Review
