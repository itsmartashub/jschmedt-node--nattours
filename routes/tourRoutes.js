const express = require('express')
const tourController = require('../controllers/tourController')
const authController = require('../controllers/authController')

// const {
// 	getAllTours,
// 	getTour,
// 	createTour,
// 	updateTour,
// 	deleteTour,
// } = require('./../controllers/tourController')

const router = express.Router()

/* 
! tourController.aliasTopTours je mw kojim cemo da dohvatimo 5 najeftinijih itema. naime pre nego sto pozovemo ovaj getAllTours route handler, dodacemo neke fields u query stringu, jer string treba da nam izgleda ovako:
``` /api/v1/tours?limit=5&sort=ratingAverage,price
sad ce url da izgleda ovako:
``` /api/v1/tours/top-5-cheap
al ce da se ponasa kao da je /api/v1/tours?limit=5&sort=ratingAverage,price, jer cemo u ovom aliasTopTours mw to da setujemo.
dakle mw koristimo strateski zavisi kako treba da izmenimo req object pre nego sto dodje do servera bas */
router
	.route('/top-5-cheap')
	.get(tourController.aliasTopTours, tourController.getAllTours)

/*
sad cemo da napisemo middleware koji ce da se okine samo kada je ovaj dole :id prisutan u url-u. Param mw ima 4 parametara. Elem, ovaj mw se obvio nece pozvati kada se polsaje req ka /api/v1/users/:id, je je ova mwf-ja specificirana/namenjena samo za tour router. Jonas je dao analogiju da je koriscenje svaki ruter kao neka mini sub aplikacija, jedna za svaki resource */
// router.param('id', tourController.checkID)

router.route('/tour-stats').get(tourController.getTourStats)
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)

/*
Create a checkBody mw - check if the body contains the name and price property, if not return 400 (bad request from he client) status code. Add it to the post handler stack.

.get(authController.protect, tourController.getAllTours)
ovo authController.protect se krece prvo, ako korisnik nije authenticated, bice error i onda se sledeci mw (tourController.getAllTours) nece okinuti. I to ce zastiti pristup ovoj ruti od korisnika koji nisu ulogovani */
router
	.route('/')
	.get(authController.protect, tourController.getAllTours)
	// .get(tourController.getAllTours)
	// .post(tourController.checkBody, tourController.createTour)
	.post(tourController.createTour)

// sad cemo da napisemo middleware koji ce da se okine samo kada je ovaj dole id prisutan u url-u
router
	.route('/:id')
	.get(tourController.getTour)
	.patch(tourController.updateTour)
	.delete(
		authController.protect, // cekiramo da li je korisnik ulogovan
		authController.restrictTo('admin', 'lead-guide'), //? Authorization. Samo Autentifikacija nije dovoljna. Dakle idemo da autorizujemo samo odredjene korisnike za odredjene akcije (recimo admine. Autorizacija je verifikacija da li odredjeni korisnik ima privilegije za odredjene akcije iako je vec ulogovan). Idemo u userModel.js u Schemu da kreiramo role. Samo admin i lead-guide mogu da obrisu tour
		tourController.deleteTour
	)

// ovako exportujemo kad je samo jedna stvar u pitanju
module.exports = router
