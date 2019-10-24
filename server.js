const express = require('express');
const bodyParser = require('body-parser');
const dbConfig = require('./config/database.config.js');
const mongoose = require('mongoose');
const app = express();

mongoose.Promise = global.Promise;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requeted-With, Content-Type, Accept, Authorization, RBR");

	// if (req.headers.origin) {
	// 	res.header('Access-Control-Allow-Origin', req.headers.origin);
	// }

	// if (req.method === 'OPTIONS') {
	// 	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
	// 	return res.status(200).json({});
	// }

	next();
});

mongoose.connect(dbConfig.url, {
	useNewUrlParser: true
}).then(() => {
	console.log('Successfully connected to the database');
}).catch(err => {
	console.log('Could not connect to the database. Exiting now...', err);
	process.exit();
});

app.get('/', (req, res) => {
	res.json({ "message": "Welcome to EasyNotes application. Take notes quickly. Organize your shit" });
});

require('./app/routes/student.routes.js')(app);

app.listen(process.env.PORT || 5000, () => {
	console.log('Server is listening on port 3000');
});
