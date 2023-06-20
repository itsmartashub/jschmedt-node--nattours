//////  4) START THE SERVER
// i sada u npm ne pokrecem nodemon app.js vec nodemon server.js, bitno je gde je .listen
const app = require('./app')

const port = 3000
app.listen(port, () => console.log(`Listening on port ${port}`))
