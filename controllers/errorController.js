const AppError = require('../utils/appError')

const handleCastErrorDB = (err) => {
	console.log(`💥💥💥💥💥 handleCastErrorDB ERROR`)

	const message = `Invalid ${err.path}: ${err.value}.`
	return new AppError(message, 400)
}
const handleDuplicateFieldsDB = (err) => {
	console.log(`💥💥💥💥💥 handleDuplicateFieldsDB ERROR`)

	const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0] // err.errmsg je mongoose err property. regex je: match the text between quotes
	const message = `Duplicate field value: ${value}. Please use another value!`
	return new AppError(message, 400)
}
const handleValidationErrorDB = (err) => {
	console.log(`💥💥💥💥💥 handleValidationErrorDB ERROR`)

	/* 
	* ovo su vrednosti error objekta error, dakle ovom f-jom dohvatamo "name", "difficulty", itd, i za svaki od njih dohvatam map() array metodom ovaj "message" property
	"error" :
		"name": {
			"message": "A tour name must have...."
			"name": "ValidatorError",
			"properties": {
				"message"r "A tour name must
				"type": "änlength" ,
				"minlength" : 10,
				" path": "name"
				"value": "Short "
			}
			"kind": "minlength" ,
			"path " name" ,
			"value": "Short"
		}
		"difficulty": {
			"message": "Difficulty is either
			"name "ValidatorError" ,
			"properties": {
				"message": "Difficulty is ei
				"type": "enum" ,
				"enumVaIues": ["easy", "medium", "difficult"]
			},
			"path": "difficulty",
			"value": "Stagod"
		},
		"ratingsAverage": {...},
		...
	}
	*/
	const errors = Object.values(err.errors).map((el) => el.message)

	const message = `Invalid input data. ${errors.join('. ')}`
	return new AppError(message, 400)
}

const sendErrorDev = (err, res) => {
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
	})
}
const sendErrorProd = (err, res) => {
	// console.log(err.isOperational)

	//? Operatioanal, trusted error: send message to client
	if (err.isOperational) {
		console.log('💥💥💥💥💥 [sendErrorProd]: ✅ Operational Error')
		// console.log(err)

		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		})

		//? Programming or other uknown error: dont leak error details
	} else {
		// 1) Log error
		console.log('💥💥💥💥💥 [sendErrorProd]: ❌ not Operational Error ')
		// console.log(err)

		// 2) Send generic message
		res.status(500).json({
			status: 'error',
			message: 'Something went wrong!',
		})
	}
}

module.exports = (err, req, res, next) => {
	// console.log(err)

	err.statusCode = err.statusCode || 500
	err.status = err.status || 'error'
	// err.isOperational = true

	if (process.env.NODE_ENV === 'development') {
		console.log('🟡🟡🟡🟡🟡 DEVELOPMENT')

		sendErrorDev(err, res)
	} else if (process.env.NODE_ENV === 'production') {
		console.log('🟢🟢🟢🟢🟢 PRODUCTION')

		let error = { ...err }

		// console.log('ERR\n', err)
		// console.log('ERROR\n', error)
		// console.log(error.errors.name.contains('ValidatorError'))
		console.log(err.name)
		// console.log(error.errors.name)

		if (err.name === 'CastError') error = handleCastErrorDB(error)
		if (err.code === 11000) error = handleDuplicateFieldsDB(error)
		if (err.name === 'ValidationError')
			error = handleValidationErrorDB(error)
		// if (error.name === 'JsonWebTokenError') error = handleJWTError()
		// if (error.name === 'TokenExpiredError') error = handleJWTExpiredError()

		sendErrorProd(error, res)
	}

	res.status(err.statusCode).json({
		status: err.status,
		message: err.message,
	})
}
