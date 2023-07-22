const crypto = require('crypto') // built-in node module
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')

// name, email, photo, password, passwordConfirm
const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please tell us ur name'],
		trim: true,
	},
	email: {
		type: String,
		required: [true, 'Please provide ur email'],
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, 'Please provide a valid email'],
	},
	photo: String,
	role: {
		type: String,
		enum: ['user', 'guide', 'lead-guide', 'admin'],
		default: 'user',
	},
	password: {
		type: String,
		required: [true, 'Provide a password'],
		minlength: [8, 'Password must be at least 8 characters'],
		select: false, //@ jako bitno! Ne treba da dohvatamo password kada se logujemo, sta ce nam na klajentu.
	},
	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm your password'],
		validate: {
			// This only works on CREATE and SAVE!!!
			validator: function (el) {
				// validator fn vraca true ili false, true znaci da nema error, false da ima
				return el === this.password
			},
			message: 'Passwords are not the same',
		},
	},
	passwordChangedAt: Date, // menjace se kad god korisnik promeni password
	passwordResetToken: String,
	passwordResetExpires: Date,
})

/* 
Razlog zasto ovo ce se enkripcija desiti pre nego sto primimo user podatke i uupisemo ih u bazu. Ovde zelimo da enkriptujemo password samo ako je password field apdejtovano tj kada je password tek kreiran ili apdejtovvan postojeci */
userSchema.pre('save', async function (next) {
	// ? Only run this fn if password was actuaally modified
	if (!this.isModified('password')) return next()

	/* this.password je current password u db.
	Ovaj drugi argument u hash() metodul je koliko jaku enkripciju kor, kor smo nekada 8, pa 10, a sad mozemo 12 jer su danas kompovi jaci, veci broj vise CPU-a vuce, ali je i password jaci */
	// ? Hash the password with cost of 10
	this.password = await bcrypt.hash(this.password, 12)

	// ? Delete passwordConfirm field
	this.passwordConfirm = undefined // brisemo confirm password, jer nam on treba samo za validaciju, dakle ne treba nigde u bazi posle de ga cuvamo, to sto je required znaci da je required prilikom inputa, a ne u db-u

	next()
})

userSchema.pre('save', function (next) {
	if (!this.isModified('password') || this.isNew) return next()

	this.passwordChangedAt = Date.now() - 1000 // oduzimamo jednu sekundu jer je cuvanje u db sporije od issuinga novog jwt tokena. To moze da uzrokuje to da timestamp od passwordChangedAt se setuje NAKON sto se jwt token kreira sto ce uciniti to da korisnik nece moci da se uloguje koristeci novi token. Jer setimo se da je razlog sto passwordChangedAt postoji da bismo ga mogli uporediti sa timestampom na jtw tokenu (JWTTimestamp) (controllers/authController.js u loginu ono 2) Check if user exist && password is correct)

	next()
})

// ? INSTANCE METHOD - je ustv metod koji ce biti dostupan u svim documents u bazi
/* 
candidatePassword je password koji je user koristio za login, u userPassword je password koji je vec enkriptovan u bazi. ovde this keyword ukazuje na trenutni document .Ali posto smo gore u schemi sstavil iza password da je select: false, ovo this.password nece biti dostupno u outputu. zato koristimo ovde candidatePassword i userPassword */
userSchema.methods.correctPassword = async function (
	candidatePassword,
	userPassword
) {
	// console.log(candidatePassword, userPassword)

	return await bcrypt.compare(candidatePassword, userPassword) // vraca true ili false. Inace bez ove compare() fn ne bismo moglid a poredimo rucno ova dva passworda jer je jedan hashovan (ovaj postojeci u bazi) a drugi nije (ovaj koji je user uneto u input polje prilikom logina). I sad idemo da pozove ovu fn u authController.js
}

/* Prosledjujemo JWTTimestamp tj timestamp koji oznacava kad je token issued */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
	// u instance metodama this uvek ukazuje na trenutni document
	if (this.passwordChangedAt) {
		/* 	idemo gore u Schemu da kreiramo field za vreme kad je password kreiran: passwordChangedAt koji ce se menjati kad god korisnik promeni password
		ako ovo this.passwordChangedAt ne postoji onda to znaci da korisnik nikad nije menjao password 
		Za sad cemo rucno da dodamo ovaj property u body prilikom signup rikvesta samo dok istestiramo, pa cemo posle setovati ovaj property kada budemo pisali logiku za menjanje passworda. */

		console.log(this.passwordChangedAt, JWTTimestamp) // 2023-07-12T00:00:00.000Z 1689191106

		// sada hocem oda konvertujemo ovaj this.passwordChangedAt da bude kao ovaj timestamp
		const changedTimestamp = parseInt(
			this.passwordChangedAt.getTime() / 1000,
			10
		) // da pretvorimo iz ms u s delimo sa 1000, a da bude integer a ne String, stavljamo u parseInt. 10 je baza, tj koliko cifara

		console.log(changedTimestamp, JWTTimestamp) // 1689120000 1689191106

		return JWTTimestamp < changedTimestamp //* primer 100 < 200, a ovo je true, a to je ono sto hocemo da vratimo, jer false znaci NOT CHANGED, a ovo znaci da je CHANGED. A ako je 300 < 200, 300 nije manje od 200, i to je false
	}

	return false //! ovo znaci da user NIJE promenio svoj password nakon sto je token issued. NOT CHANGED znaci da je vreme kada je token dodeljen (issued) je MANJE od changedTimestamp vremena odn vremena kada se password menjao

	/* 
	DA bismo simulirali to da je korisnik promenio password te se kreirao novi token, idemo u Compass i za tog korisnika menjamo datum promene passworda mesec vise recimo, i onda kad pokusavamo da se ulogujemo necemo moci. Ako je vreme promenjenog passworda VECE od vremena kad je token issued, korisnik je promenio password nakon sto se token issued, i tada ne zelimo da korisnik ima pristup zasticenim rutama, vec a "teramo" da se ponovo uloguje, te mu se novi token issued, te ce JTWTimestamp da bude manji od vremena kada se password menjao, tj od changedTimestamp, sto znaci da ce biti false, sto znaci da ce userSchema.methods.changedPasswordAfter da vrati false, sto znaci da ce se u authConteoller.js doci do req.user = currentUser i next() dela */
}

userSchema.methods.createPasswordResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString('hex')

	/* Moramo da kriptujemo token koji ce korisnik dobiti da bi resetovao password. Kriptujemo jer sta ako neki haker probije u db, pa bude video text based token. Medjutim, ovo nije password te ne moramo da ga snazno kriptujemo kao password. Btw, moramo gore u Schemi da definisemo polje za passwordResetToken i za passwordResetExpires, jer on ofc istekne nakon nekog odredjenog vremena, i potom ovde mozemo da koristimo this.passwordResetToken i this.passwordResetExpires */
	this.passwordResetToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex')

	console.log({ resetToken }, '\n', this.passwordResetToken)

	this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // hocemo da cekamo 10min

	return resetToken // vracamo prvobitno kreirani resetToken a ne kriptovani, jer korisnik ofc treba da primi token kakav jeste a ne kriptovan, jer koja je poenta onda enkripcije
}

const User = mongoose.model('User', userSchema)

module.exports = User
