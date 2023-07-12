const { promisify } = require('util') // node built-in for promisify method
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

	// console.log(user)
	// console.log(await user.correctPassword(password, user.password))

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

exports.protect = catchAsync(async (req, res, next) => {
	//? 1) Getting token and check of it's there

	let token

	// ako header Authorization postoji i ako vrednost Authorization headera pocinje sa Bearer
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1] // authorization: 'Bearer hjkfhgsdjkfhdsjbfiheuf', [0] je 'Bearer', [1] je 'hjkfhgsdjkfhdsjbfiheuf'
	}

	console.log(token)

	if (!token) {
		return next(
			new AppError(
				'You are not logged in! Please log in to get access.',
				401
			) // kod 401 znaci unauthorized, to znaci da su podaci koje saljemo u req tacni, ali nisu dovoljni za pristup resourcu koji trazimo
		)
	}

	//? 2) Token verification
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

	console.log(decoded) // { id: '64adbbafe3dccd105f97648b', iat: 1689161134, exp: 1696937134 }

	/* idemo u errorController.js da kreiramo error handle za error akda pokusava da se izmanipulisa token i koristi fejk, tu bude onda error sa name JsonWebTokenError koji ce da se okida samo u productionu, dakle testiracemo sa npm run start:prod
	
	Elem, kada nam istekne token i pokusamo da pristupimo sajtu, takodje ce se pojaviti greska. Ali posto za sad nemamo hendler za nju, bice ona kalsicna greska "something went wrong" koja se desi kada nismo specifirali tacno name errora. A name za istekao token je TokenExpiredError, pa idemo u errorController.js da dodamo i if za nju. Btw simuliracemo istek tokena tako sto idemo u config.env i za JWT_EXPIRES_IN stavimo 5s */

	//? 3) Check if user still exists

	//? 4) Check if user changed password after the token was issued

	next()
})
