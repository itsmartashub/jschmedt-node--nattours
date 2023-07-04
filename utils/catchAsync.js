// treba da catchujemo errors
// eslint-disable-next-line arrow-body-style
module.exports = (fn) => {
	return (req, res, next) => {
		// fn(req, res, next).catch((err) => next(err))
		fn(req, res, next).catch(next) // ovo i ovo iznad je isto wtf
	}
}
