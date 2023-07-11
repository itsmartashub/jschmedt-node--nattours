const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

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
		validate: {
			// This only works on CREATE and SAVE!!!
			validator: function (el) {
				// validator fn vraca true ili false, true znaci da nema error, false da ima
				return el === this.password
			},
			message: 'Passwords are not the same',
		},
	},
})

/* 
Razlog zasto ovo ce se enkripcija desiti pre nego sto primimo user podatke i uupisemo ih u bazu. Ovde zelimo da enkriptujemo password samo ako je password field apdejtovano tj kada je password tek kreiran ili apdejtovvan postojeci */
userSchema.pre('save', async function (next) {
	// ? Only run this fn if password was actuaally modified
	if (!this.isModified('password')) return next()

	/*
	this.password je current password u db.
	Ovaj drugi argument u hash() metodul je koliko jaku enkripciju kor, kor smo nekada 8, pa 10, a sad mozemo 12 jer su danas kompovi jaci, veci broj vise CPU-a vuce, ali je i password jaci */
	// ? Hash the password with cost of 10
	this.password = await bcrypt.hash(this.password, 12)

	// ? Delete passwordConfirm field
	this.passwordConfirm = undefined // brisemo confirm password, jer nam on treba samo za validaciju, dakle ne treba nigde u bazi posle de ga cuvamo, to sto je required znaci da je required prilikom inputa, a ne u db-u

	next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
