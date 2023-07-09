//////  4) START THE SERVER
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({ path: './config.env' }) // path gde se config.env file nalazi. BTW, OVO MORA PRE const app = require('./app'). jer ne mozemo da citamo process.env varijable u app.js ako oni jos nisu konfigurisani, ofc!!

const app = require('./app')

// console.log(app.get('env')) // output: development. ovaj env je set by express, ali i nodejs setuje mnooogo environmenta
// console.log(process.env) // nodejs environments

const DB = process.env.DATABASE.replace(
	'<PASSWORD>',
	process.env.DATABASE_PASSWORD
)

/* 
Moramo da hendlujemo greske i koje su se desile van nase express app (pa ih samim tim errorController.js nece kesirati), tipa ako ne mozemo da se konektujemo sa bazom ili ne mozemo da se logujemo.
Da bismo simulirali to, idemo u config.env i recimo promenimo password za DATABASE_PASSWORD i samim tim necemo moci da se logujemo na nas Mongoose bazu */
mongoose.connect(DB).then((conn) => {
	// mzd za options pored DB staviti [options.autoCreate=false]
	// console.log(conn.connection)
	console.log('Connected to MongoDB')
})

/* 
DODAVANJE ENV PROMENLJVIE U process.env:

u terminalu kucamo:
    NODE_ENV=development nodemon server.js

mozemo i vise promenljivih odj, npr: 
    NODE_ENV=development X=33 TRECA_PROMENLJIVA=vrednosttrecepromenljive nodemon server.js

medjutim nije zgodno ovo raditi u terminalu. Zato cemo kreirati config file tj config.env. Ali, da bi nasa app mogla da cita taj config file i te env, potreban nam je env paket, pa idemo da ga instaliramo:
    npm i dotenv

i citamo env promenljive sa: dotenv.config({ path: './config.env' }) 
*/

const port = process.env.PORT || 3000

// i sada u npm ne pokrecem nodemon app.js vec nodemon server.js, bitno je gde je .listen
const server = app.listen(port, () => console.log(`Listening on port ${port}`))

/* 
u package.js promenjeno:

    "start:dev": "nodemon server.js",
    "start:prod": "NODE_ENV=production nodemon server.js" */

/* 
Konfigurisanje slinta sa prettier-om. Moramo instalirati ove extensions u vsc i takodje u terminalu za ovaj project instalirati:

    npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react --save-dev */

// !Error - censtralno mesto za handloivanje gresaka van express app
process.on('unhandledRejection', (err) => {
	console.log(err.name, err.message)
	console.log('UNHANDLED REJECTION! 💥 Shutting down...')
	// process.exit(1)
	server.close(() => {
		process.exit(1)
	})
})
