/* eslint-disable arrow-body-style */
const crypto = require('crypto')
const { promisify } = require('util') // node built-in for promisify method
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const sendEmail = require('../utils/email')

// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
	return jwt.sign({ id: id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	})
}

const createSendToken = (user, statusCode, res) => {
	const token = signToken(user._id)

	res.status(statusCode).json({ status: 'success', token, data: { user } })
}

exports.signup = catchAsync(async (req, res, next) => {
	// const newUser = await User.create(req.body) //! BIG SECURITY FLOW, nikako ovako ne sme da se kreira korisnik

	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
		// passwordChangedAt: req.body.passwordChangedAt, // on ovo nema ovde navedeno, a radi mu
		// role: req.body.role, // on ovo nema ovde navedeno, a radi mu
	})

	// premesteno gore u fn signToken
	// const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
	// 	expiresIn: process.env.JWT_EXPIRES_IN,
	// })

	createSendToken(newUser, 201, res) // ovo je umesto ovog dole koda, i sad svugde gre kor to menjamo sa ovom fn

	/* const token = signToken(newUser._id)
	res.status(201).json({ status: 'success', token, data: { user: newUser } })*/
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
	createSendToken(user, 200, res)
	/*
	const token = signToken(user._id)
	res.status(200).json({
		status: 'success',
		token,
	})
	*/
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

	// console.log(token)

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

	// console.log(decoded) // { id: '64adbbafe3dccd105f97648b', iat: 1689161134, exp: 1696937134 }

	/* @ ERROR HANDLING
	Idemo u errorController.js da kreiramo error handle za error akda pokusava da se izmanipulisa token i koristi fejk, tu bude onda error sa name JsonWebTokenError koji ce da se okida samo u productionu, dakle testiracemo sa npm run start:prod
	
	Elem, kada nam istekne token i pokusamo da pristupimo sajtu, takodje ce se pojaviti greska. Ali posto za sad nemamo hendler za nju, bice ona kalsicna greska "something went wrong" koja se desi kada nismo specifirali tacno name errora. A name za istekao token je TokenExpiredError, pa idemo u errorController.js da dodamo i if za nju. Btw simuliracemo istek tokena tako sto idemo u config.env i za JWT_EXPIRES_IN stavimo 5s */

	//? 3) Check if user still exists
	/* 
	! Mnogu programeri ce ovde stati, tj nece raditi vise od koraka 1) i 2), ali to nije dovoljno bezbedno. Sta ako recimo korisnik obrise nalog u medjuvremenu, a token ostaje i dalje validan sve dok ne istekne, ali ako korisnik vise ne postoji, ne zelimo da postoji mogucnost da se on uloguje hahaha.
	! Ili, jos gore, sta ako korisnik promeni password nakon sto je token issued (dodeljen), takodje nece raditi. Zamisli da je neko ukrao token od korisnika, i da bi se korisnik zastitio on menja password, ali token ostaje i dalje validan te taj haker moze i dalje da ga koristi (to cemo u koraku 4) da resavamo). */
	const currentUser = await User.findById(decoded.id) /// ovo nije novi korisnik, dakle ne newUser, vec je ovo vec kreiran korisnik samo dekodiran, dakle currentUser

	if (!currentUser) {
		return next(
			new AppError(
				'The user belonging to this token no longer exists.',
				401
			)
		)
	}
	/* Da testiramo ovo idemo u Signup u Thunder Client da kreiramo novog tester korisnika, kopiramo potom token koji smo dobili i paste u Gel All Tours u Bearer token, i PRE nego sto okinemo rikvest, OBRISAMO u Compassu tok korisnika */

	//? 4) Check if user changed password after the token was issued (dodeljen)
	// Posto ce ovde biti mnogo koda za verification, idemo u userModel.js da kreiramo userSchema.methods.changedPasswordAfter
	if (currentUser.changedPasswordAfter(decoded.iat)) {
		// ako je ovo u if true, to znaci da je user menjao password
		// iat je valjda issued authorization token
		return next(
			new AppError(
				'User recently changed password! Please log in again.',
				401
			)
		)
	}

	//? GRANT ACCESS TO PROTECTED ROUTE
	req.user = currentUser // stavljamo sve podatke o korisniku u req.user gde taj podatak ide dalje drugom middleware-u koji smo stavili. Dakle ako nesto hocemo da bude dostupno sledecem mw-u, samo stavimo taj podatak u request objekat
	next()
})

exports.restrictTo = (...roles) => {
	// ne mozemo proslediti argumente u mw. Ali u ovom slucaju su nam oni potrebni, te kako to uciniti? Sa ...roles
	return (req, res, next) => {
		// roles is array ['admin', 'lead-guide'] npr

		console.log(req.user.role)
		console.log(roles.includes(req.user.role))

		//! Jako bitna linija koda !
		if (!roles.includes(req.user.role)) {
			return next(
				new AppError(
					'You do not have permission to perform this action',
					403
				)
			)
		}

		next()
	}
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
	//? 1. Get user based on POSTed email
	const user = await User.findOne({ email: req.body.email })

	if (!user) {
		return next(
			new AppError('There is no user with that email address', 404)
		)
	}

	//? 2. Generate the random reset token
	// Idemo u userModel.js da ispisemo ovaj kod jer ce biti previse za ovde
	const resetToken = user.createPasswordResetToken()

	await user.save({ validateBeforeSave: false }) // { validateBeforeSave: false } - ovo ce da deaktivira sve validatore koje smo napravili u nasoj schemi

	//? 3. Send it to user's email (utils/email.js)
	const resetURL = `${req.protocol}://${req.get(
		'host'
	)}/api/v1/users/resetPassword/${resetToken}` // i ovde saljemo original token a ne enkriptovan

	const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email`

	try {
		await sendEmail({
			email: user.email,
			subject: 'Your password reset token (valid for 10 min)',
			message,
		})

		res.status(200).json({
			status: 'success',
			message: 'Token sent to email',
		})
	} catch (error) {
		// ako imamo error zelimo da resetujemo token i expires setting
		user.passwordResetToken = undefined
		user.passwordResetExpires = undefined

		await user.save({ validateBeforeSave: false })

		return next(
			new AppError(
				'There was an error sending the email. Try again later!',
				500
			)
		)
	}
})

exports.resetPassword = catchAsync(async (req, res, next) => {
	//? 1) Get user based on the token
	// Eknriptovacemo token da bismo gaa uporedili sa vec enkriptovanim ukoji je u bazi, ovo je sada mng lakse nego sa password enkripcijom jer je ovde enkripcija manja/slabija
	const hashedToken = crypto
		.createHash('sha256')
		.update(req.params.token)
		.digest('hex')

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() }, // cekiramo da li je token expires vece od (greater then iliti $gt u mongodb) sada, to znaci da je jos validan tj da nije istekao
	})

	//? 2) If token has not expired, and there is user, set the new password
	if (!user) {
		return next(new AppError('Token is invalid or has expired', 400))
	}

	user.password = req.body.password
	user.passwordConfirm = req.body.passwordConfirm
	user.passwordResetToken = undefined // resetujemo
	user.passwordResetExpires = undefined // resetujemo

	await user.save() // sada zelimo validatore (dakle ne stavljamo { validateBeforeSave: false } u save()), da proverimo da li je password isti sa passwordConfirm

	//? 3) Update changedPasswordAt property for the user

	//? 4) Log the user in, send JWT to client
	createSendToken(user, 200, res)

	/* const token = signToken(user._id)
	res.status(200).json({ status: 'success', token }) */
})

exports.updatePassword = catchAsync(async (req, res, next) => {
	// iz bezbednosnih razloga moramo pitati korisnika za password iako je vec ulogovan, jer sta ako je ostabvio komp i neko zlonameran sedne za komp i promeni password
	// ? 1) Get user from collection
	const user = await User.findById(req.user.id).select('+password') // req.user.id dolazi iz protect mw-a

	// ? 2) Check if POSTed current password is correct
	if (
		!(await user.correctPassword(req.body.passwordCurrent, user.password))
	) {
		return next(new AppError('Your current password is wrong', 401))
	}

	// ? 3) If so, update
	user.password = req.body.password
	user.passwordConfirm = req.body.passwordConfirm
	await user.save()

	/* ! Apdejtujemo password sa await.user.save(), a ne sa User.findByIdAndUpdate jer to nece raditi kako treba. Iz dva razloga, jedan je da validator u passwordConfirm Schemi nece raditi jer this.password nije definisan kada koristimo findByIdAndUpdate, jer u pozadini Mongoose ne cuva trenutni objekat u memoriji.
	! A potom nece raditi ni ona dva userSchema.pre('save', function (next)....) */
	// User.findByIdAndUpdate // Will NOT work as intented!

	// ? 4) Log user in, send JWT to client
	createSendToken(user, 200, res)
})
