const express = require('express')
const tourController = require('./../controllers/tourController')
// const {
// 	getAllTours,
// 	getTour,
// 	createTour,
// 	updateTour,
// 	deleteTour,
// } = require('./../controllers/tourController')

const router = express.Router()

router
	.route('/')
	.get(tourController.getAllTours)
	.post(tourController.createTour)

router
	.route('/:id')
	.get(tourController.getTour)
	.patch(tourController.updateTour)
	.delete(tourController.deleteTour)

// ovako exportujemo kad je samo jedna stvar u pitanju
module.exports = router
