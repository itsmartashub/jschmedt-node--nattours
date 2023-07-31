const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

const filterObj = (obj, ...allowedFields) => {
	// allowedFields je array sa argumentima u pozvanoj filterObj f-niji: ['name', 'email']
	const newObj = {}

	Object.keys(obj).forEach((el) => {
		if (allowedFields.includes(el)) newObj[el] = obj[el]
	})

	return newObj
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
	// res.status(200).json({
	// 	status: 'error',
	// 	message: 'This route isnt yet defined!',
	// })

	const users = await User.find()

	// SEND RESPONSE
	res.status(200).json({
		status: 'success',
		results: users.length,
		data: { users },
	})
})

/* Apdejtuje trenutno autentifikovanog korisnika. Inace se apdejtuju user data na drugacijoj ruti od one gde se apdejtuje user password, msm tako je inace u svakoj app odradjeno. Dakle na jednom mestu se apdejtuje password, a na drugom podaci o korisniku ili sam nalog */
exports.updateMe = catchAsync(async (req, res, next) => {
	//? 1) Create error if user POSTs password data (kreiramo error ako user krene da kreira password)
	if (req.body.password || req.body.passwordConfirm) {
		return next(
			new AppError(
				'This route is not for password updates. Please use /updateMyPassword',
				400
			)
		)
	}
	/* const user = await User.findById(req.user.id)
	user.name = 'Jonas'
	await user.save() */
	//? 2) Filtered out unwanted fields names that are not allowed to be updated - bitno da recimo ako malicius user zeli da apdejtuje role u admin, da mu se to onemoguci tako sto cemo filtrirati samo name i email
	const filteredBody = filterObj(req.body, 'name', 'email')

	//? 3) Update user document
	const updatedUser = await User.findByIdAndUpdate(
		req.user.id,
		filteredBody,
		{
			new: true,
			runValidators: true,
		}
	)

	res.status(200).json({
		status: 'success',
		data: { user: updatedUser },
	})
})

exports.getUser = (req, res) => {
	res.status(200).json({
		status: 'error',
		message: 'This route isnt yet defined!',
	})
}
exports.createUser = (req, res) => {
	res.status(200).json({
		status: 'error',
		message: 'This route isnt yet defined!',
	})
}
exports.updateUser = (req, res) => {
	res.status(200).json({
		status: 'error',
		message: 'This route isnt yet defined!',
	})
}
exports.deleteUser = (req, res) => {
	res.status(200).json({
		status: 'error',
		message: 'This route isnt yet defined!',
	})
}
