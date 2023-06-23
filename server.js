//////  4) START THE SERVER
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' }) // path gde se config.env file nalazi. BTW, OVO MORA PRE const app = require('./app'). jer ne mozemo da citamo process.env varijable u app.js ako oni jos nisu konfigurisani, ofc!!

const app = require('./app')

console.log(app.get('env')) // output: development. ovaj env je set by express, ali i nodejs setuje mnooogo environmenta
console.log(process.env) // nodejs environments

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
app.listen(port, () => console.log(`Listening on port ${port}`))

/* 
u package.js promenjeno:

    "start:dev": "nodemon server.js",
    "start:prod": "NODE_ENV=production nodemon server.js" */

/* 
Konfigurisanje slinta sa prettier-om. Moramo instalirati ove extensions u vsc i takodje u terminalu za ovaj project instalirati:

    npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react --save-dev */
