// extendujemo built-in Error class
class AppError extends Error {
	constructor(message, statusCode) {
		super(message) // message je jedini parametar koji built-in Error prihvata

		this.statusCode = statusCode
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error' // ako statusCode pocinje sa 4, to znaci da je fail

		/* 
		sve ove error koje kreiramo koristeci ovu AppError klasu ce biti operational errors tj greske kooje mozemo predvideti da se mogu desiti u buducnosti kao npr korinsik kreira tour bez polja koja su obavezna */
		this.isOperational = true

		Error.captureStackTrace(this, this.constructor)
	}
}

module.exports = AppError
