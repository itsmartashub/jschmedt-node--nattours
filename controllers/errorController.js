const AppError = require('../utils/appError')

const handleCastErrorDB = (err) => {
	const message = `Invalid ${err.path}: ${err.value}.`
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

		if (error.name === 'CastError') error = handleCastErrorDB(error)

		sendErrorProd(error, res)
	} else {
		console.log(typeof process.env.NODE_ENV)
	}

	res.status(err.statusCode).json({
		status: err.status,
		message: err.message,
	})
}
