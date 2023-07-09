const mongoose = require('mongoose')
const validator = require('validator')

// name, email, photo, password, passwordConfirm
const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please tell us ur name'],
		trim: true,
	},
	email: {
		type: String,
		required: [true, 'Please provide ur email'],
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, 'Please provide a valid email'],
	},
	photo: String,
	password: {
		type: String,
		required: [true, 'Provide a password'],
		minlength: [8, 'Password must be at least 8 characters'],
	},
	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm your password'],
	},
})

const User = mongoose.model('User', userSchema)

module.exports = User
