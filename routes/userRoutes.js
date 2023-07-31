const express = require('express')
const userController = require('../controllers/userController')
const authController = require('../controllers/authController')

const router = express.Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)

router.post('/forgotPassword', authController.forgotPassword) // forgotPassword prima samo email
router.patch('/resetPassword/:token', authController.resetPassword) // resetPassword prima token i novi password

router.patch(
	'/updateMyPassword',
	authController.protect,
	authController.updatePassword
)

router.patch('/updateMe', authController.protect, userController.updateMe) // koristimo authController.protect, jer samo trenutno auth korisnik moze da apdejtuje password trenutno ulogovanog korisnika. Sve ce ovo biti vrlo secure jer ID korisnika koji ce biti apdejtovan dolazi iz req.user sto je setovano ovim authController.protect middleware koji dobija ID iz JWT-a, a niko ne moze da promeni ID iz JWT-a bez da zna Secret pa zbog toga znamo da je ID safe

router.delete('/deleteMe', authController.protect, userController.deleteMe)

router
	.route('/')
	.get(userController.getAllUsers)
	.post(userController.createUser)
router
	.route('/:id')
	.get(userController.getUser)
	.patch(userController.updateUser)
	.delete(userController.deleteUser)

module.exports = router
