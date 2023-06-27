const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

const Tour = require('../../models/tourModel')

dotenv.config({ path: './config.env' })

// ponovo moramo da konektujem o sa db ponovo u ovoj skripti, jer ovo se pokrece totalno nezavisno od nase express app.
const DB = process.env.DATABASE.replace(
	'<PASSWORD>',
	process.env.DATABASE_PASSWORD
)
mongoose.connect(DB).then(() => {
	console.log('Connected to MongoDB')
})

// READ JSON FILE
const tours = JSON.parse(
	fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
) // ./ ovo ./ je relativno uvek od toga gde je node app zapoceta (dakle valjda od homde folder), a nama to ne odg, vec treba da dodamo __dirname

// IMPORT DATA INTO DB
const importData = async () => {
	try {
		await Tour.create(tours) // prihvata i Object, ali i Array of Objects, kao sto su tours

		console.log('Data successfully loaded!')
	} catch (error) {
		console.log(error)
	}

	process.exit() // agresivan nacin stopiranja aplikacije
}

// DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
	try {
		await Tour.deleteMany() // kad se ne prosledi nista, brise sve

		console.log('Data successfully deleted!')
	} catch (error) {
		console.log(error)
	}

	process.exit()
}

if (process.argv[2] === '--import') {
	importData()
} else if (process.argv[2] === '--delete') {
	deleteData()
}
console.log(process.argv)
/* 
Okada u terminalu pokerenemo komandu:
    node dev-data/data/import-dev-data.js

dobijemo:
    [
        'C:\\Program Files\\nodejs\\node.exe',
        'D:\\WEBDEV\\Codlearning Time\\Nodejs\\JONAS SCHMEDTMANN\\Node Bootcamp 11-2022\\2-natours\\dev-data\\data\\import-dev-data.js',  
    ]

a mi hocemo da dodamo --import za import i --delete za delete> dakle sad kucamo:
    node dev-data/data/import-dev-data.js --import

i ovo ovde process.argv u konzoli onda vrati:
    [
        'C:\\Program Files\\nodejs\\node.exe',
        'D:\\WEBDEV\\Codlearning Time\\Nodejs\\JONAS SCHMEDTMANN\\Node Bootcamp 11-2022\\2-natours\\dev-data\\data\\import-dev-data.js',  
        '--import'
    ]

i sad ako hocemo da dohvatimo ovo --import iz ovog niza, kucamo process.argv[2] jer je on treci element niza, ali ima index 2, ofc
*/
