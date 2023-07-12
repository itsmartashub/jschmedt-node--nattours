const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
	return jwt.sign({ id: id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	})
}

exports.signup = catchAsync(async (req, res, next) => {
	// const newUser = await User.create(req.body) //! BIG SECURITY FLOW, nikako ovako ne sme da se kreira korisnik

	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
	})

	// premesteno gore u fn signToken
	// const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
	// 	expiresIn: process.env.JWT_EXPIRES_IN,
	// })

	const token = signToken(newUser._id)

	res.status(201).json({ status: 'success', token, data: { user: newUser } })
})

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body

	// ? 1) Check if email and password exist
	if (!email || !password) {
		return next(new AppError('Please provide email and password!', 400))
	}

	// ? 2) Check if user exist && password is correct
	const user = await User.findOne({ email }).select('+password') // posto smo stavili za password u schemi da je false, i u findOne () ga takodje ne pozivamo vec samo email, moramo posebno select() za password kada se logujemo, i obavezno plus (+password) jer ga inlcudujemo

	console.log(user)
	console.log(await user.correctPassword(password, user.password))

	/* ! Mogli smo ovde posebno da cekiramo user i posebno isCorrect (tj sada await user.correctPassword(password, user.password)) ali tako bismo potencijalnom hakeru dali informacije sta je tacno, a sta nije */
	if (!user || !(await user.correctPassword(password, user.password))) {
		return next(new AppError('Incorrect email or password', 401))
	}

	// ? 3) If everything ok, send token to client
	const token = signToken(user._id)

	res.status(200).json({
		status: 'success',
		token,
	})
})
