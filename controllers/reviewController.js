const Review = require('./../models/reviewModel')
const catchAsync = require('./../utils/catchAsync')

// znamo da je async fn jer cemo da radimo sa db ovde
exports.getAllReviews = catchAsync(async (req, res, next) => {
	const reviews = await Review.find()
	// const reviews = await Review.find({ tour: req.params.tourId })

	res.status(200).json({
		status: 'success',
		results: reviews.length,
		data: {
			reviews,
		},
	})
})

exports.createReview = catchAsync(async (req, res, next) => {
	const newReview = await Review.create(req.body) // citav body prosledjujemo. Ako budu neka polja u body-u koja ne postoje u Schemi, ona ce jednostavno biti izignorisana

	// 201 je za CREATED
	res.status(201).json({
		status: 'success',
		data: {
			review: newReview,
		},
	})
})
