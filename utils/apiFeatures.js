class APIFeatures {
	// constructor se pozove sam cim kreiramo incancu ove klase. Prosledjujemo ovde query, jer ne zelimo da querujemo unutar ove klase, jer ce to da bounce-uje ovu klasu u tour resource, a zelim oda bude reusable koliko je moguce
	constructor(query, queryString) {
		this.query = query
		this.queryString = queryString
	}

	filter() {
		//? 1a) Filtering
		const queryObj = { ...this.queryString } // shallow copy of req object. Moramo shallow copy jer ako obrisemo nesto iz queryObj obrisacemo i iz req.query object, a to ne smemo. Zato pravimo shallow copy od req.query sa {...}

		const excludedFields = ['page', 'sort', 'limit', 'fields']
		excludedFields.forEach((el) => delete queryObj[el]) // zelimo da obrisemo queryObj sa imenom ovog trenutnog elementa

		//? 1b) Advanced Filtering
		/*
		Ovako manuelno pisemo filter Object za query u mongodb shellu:
		```		{ difficulty: 'easy', duration: { $gte: 5} }
		
		U url za req za sever ga pisemo ovako:
		```		/api/v1/tours?duration[gte]=5&difficulty=easy&price[lt]=1500
		``` 	/api/v1/tours?duration[gte]=5&difficulty=easy
		i u konzoli na serveru kad logujemo req.query za ovu drugu url dobijamo: 
		``` 	{ difficulty: 'easy', duration: { gte: '5'} }
		dakle jedina razlika je gt bezz $, i sto je '5' string
		
		zelimo da gte, gt, lte, lt zamenimo sa $gte, $gt, $lte, $lt  i to cemo odraditi sa regex */
		let queryStr = JSON.stringify(queryObj)

		/* 
		ovo \b (before) znaci exactly ta rec, dakle aako imamo lting, necemo lting, vec samo gde ima lt. a \g znaci da replejsuje all of them, dakle ne samo prvi x kad naidje na neki od njig, vec svugde.
		replace(_regex, _cb) za drugi argument prihvata cb f-ju, koja ima za prvi argument matched word/string, i ono sto vracamo iz te cb f-je je novi string koji riplejsuje stariji. Dakle mi zelimo da dodamo $ */
		queryStr = queryStr.replace(
			/\b(gte|gt|lte|lt)\b/g,
			(match) => `$${match}`
		)

		this.query = this.query.find(JSON.parse(queryStr))
		// let query = Tour.find(JSON.parse(queryStr))

		return this // ! kada chainujemo dole na filter().sort() itd, sort() nece odraditi nista, jer nece imati sta da sortira. Zato ovde u filter() returnujemo this, a this je citav object u kom se nalaze ovi methods, pa cemo imati sta da pozovemo. To cemo odraditi i u sort()
	}

	sort() {
		/* ``` /api/v1/tours?sort=price   - ascending order
		``` /api/v1/tours?sort=-price  - descending order */
		if (this.queryString.sort) {
			// ako ovaj sort property postoji to znaci da zelimo da sortiramo

			/* sort('price ratingsAverage')  - mongoose
			``` /api/v1/tours?sort=-price,ratingsAverage
			``` /api/v1/tours?sort=-price,-ratingsAverage */
			const sortBy = this.queryString.sort.split(',').join(' ')
			this.query = this.query.sort(sortBy)

			/*
			default. za slucaj da user ne navede neki sort, mi cemo kreirati difoltni u ovom else. I mi cemo sortirati po datumu kreiranja, od novijeg ka starijem, da oni noviji budu prikazani prvo */
		} else {
			this.query = this.query.sort('-createdAt')
		}

		return this
	}

	limitFields() {
		//``` /api/v1/tours?fileds=name,duration,difficulty,price

		if (this.queryString.fields) {
			const fields = this.queryString.fields.split(',').join(' ') // 'name duration price'
			this.query = this.query.select(fields)

			// ako nemamo nista od fields zadato onda ovo else
		} else {
			this.query = this.query.select('-__v') // excludujemo --v, dakle imamo sve iz query-a osim __v
		}
		return this
	}

	paginate() {
		/* ``` /api/v1/tours?page=2&limit=10
		query = query.skip(2).limit(10) 

		10 itema po stranici je ovo limit, a skip je kolicina rezultata koja treba da bude skipovana pre nego sto se i query-ju podaci

		page=2&limit=10  |  query = query.skip(10).limit(10)
		page=3&limit=10  |  query = query.skip(20).limit(10)
		page=4&limit=10  |  query = query.skip(30).limit(10)
		
			1-10, page 1
			11-20, page 2
			21-30, page 3
			...
		dakle ako smo na prvoj stranici, moramo da preskocimo 10 resultata (itema) da bismo stigli na stranicu 2
		
		(this.queryString.page - 1) * +this.queryString.limit) */

		const page = +this.queryString.page || 1
		const limit = +this.queryString.limit || 100
		const skip = (page - 1) * limit

		this.query = this.query.skip(skip).limit(limit)

		return this
	}
}

module.exports = APIFeatures
