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

/*
sad cemo da napisemo middleware koji ce da se okine samo kada je ovaj dole :id prisutan u url-u. Param mw ima 4 parametara. Elem, ovaj mw se obvio nece pozvati kada se polsaje req ka /api/v1/users/:id, je je ova mwf-ja specificirana/namenjena samo za tour router. Jonas je dao analogiju da je koriscenje svaki ruter kao neka mini sub aplikacija, jedna za svaki resource */
router.param('id', tourController.checkID)

/*
Create a checkBody mw - check if the body contains the name and price property, if not return 400 (bad request from he client) status code. Add it to the post handler stack */
router
	.route('/')
	.get(tourController.getAllTours)
	.post(tourController.checkBody, tourController.createTour)

// sad cemo da napisemo middleware koji ce da se okine samo kada je ovaj dole id prisutan u url-u
router
	.route('/:id')
	.get(tourController.getTour)
	.patch(tourController.updateTour)
	.delete(tourController.deleteTour)

// ovako exportujemo kad je samo jedna stvar u pitanju
module.exports = router
