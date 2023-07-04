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
		sendErrorDev()
	} else if (process.env.NODE_ENV === 'production') {
		sendErrorProd()
	}

	res.status(err.statusCode).json({
		status: err.status,
		message: err.message,
	})
}
