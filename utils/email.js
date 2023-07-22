const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
	// 1) Create an email transport
	const transporter = nodemailer.createTransport({
		// service: 'Gmail',
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT,
		auth: {
			user: process.env.EMAIL_USERNAME,
			pass: process.env.EMAIL_PASSWORD,
		},

		// Activate in gmail "less secure app" option
		/* Inace ovo je sam oprimer jer bi mnogi koristili Gmail, ali mi ustv necemo. Jer ti je dozvoljeno oko 500 gmejlova per day da saljes, i bices oznacen kao spammer */
	})

	// 2) Define the email options
	const mailOptions = {
		// from: process.env.EMAIL_FROM,
		from: 'Jonas Schmedtmann <hello@jonas.io>',
		to: options.email,
		subject: options.subject,
		text: options.message,
		// html: options.message
	}

	// 3) Actually send the mail
	await transporter.sendMail(mailOptions) // vraca Promise
	// const info = await transporter.sendMail(mailOptions)
	// console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info))
}

module.exports = sendEmail
