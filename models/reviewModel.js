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

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review
