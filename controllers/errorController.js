const AppError = require('../utils/appError')

const handleCastErrorDB = (err) => {
	const message = `Invalid ${err.path}: ${err.value}.`
	return new AppError(message, 400)
}
const handleDuplicateFieldsDB = (err) => {
	console.log(err)
	const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0] // err.errmsg je mongoose err property. regex je: match the text between quotes
	const message = `Duplicate field value: ${value}. Please use another value!`
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
	//? Operatioanal, trusted error: send message to client
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		})

		//? Programming or other uknown error: dont leak error details
	} else {
		// 1) Log error
		console.log('ERROR 💥 ', err)

		// 2) Send generic message
		res.status(500).json({
			status: 'error',
			message: 'Something went wrong!',
		})
	}
}

module.exports = (err, req, res, next) => {
	// console.log(err.stack)

	err.statusCode = err.statusCode || 500
	err.status = err.status || 'error'

	if (process.env.NODE_ENV === 'development') {
		console.log('DEVELOPMENT')

		sendErrorDev(err, res)
	} else if (process.env.NODE_ENV === 'production') {
		console.log('PRODUCTION')

		let error = { ...err }

		console.log(error)

		if (error.name === 'CastError') error = handleCastErrorDB(error)
		if (error.code === 11000) error = handleDuplicateFieldsDB(error)
		// if (error.name === 'ValidationError') error = handleValidationErrorDB(error)
		// if (error.name === 'JsonWebTokenError') error = handleJWTError()
		// if (error.name === 'TokenExpiredError') error = handleJWTExpiredError()

		sendErrorProd(error, res)
	}

	res.status(err.statusCode).json({
		status: err.status,
		message: err.message,
	})
}
