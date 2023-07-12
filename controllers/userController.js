const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')

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
