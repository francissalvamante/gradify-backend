const express = require('express');
const bodyParser = require('body-parser');
const dbConfig = require('./config/database.config.js');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const fs = require('fs');
const controller = require('./app/controllers/student.controller');

const PATH = './uploads';

if(!fs.existsSync(PATH)) {
	fs.mkdirSync(PATH);
}

let storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, PATH);
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now());
	}
});

let upload = multer({
	storage: storage
});

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
	res.json({ "message": "Welcome to Gradify Backend" });
});

app.post('/upload', upload.single('image'), (req, res) => {
	if(!req.file) {
		return res.status(500).send({ success: false });
	} else {
		fs.readFile(`./${req.file.path}`, async (err, data) => {
			let grades = data.toString().split('\n');
			grades.pop();
			let result = await controller.processUpload(grades);
			fs.unlinkSync(`./${req.file.path}`);
			if(result.status) {
				return res.status(200).send({ success: true });
			} else {
				return res.status(500).send({ success: false });
			}
		});
	}
});

require('./app/routes/student.routes.js')(app);

app.listen(process.env.PORT || 5000, () => {
	console.log(`Server is listening on port ${process.env.PORT || 5000}`);
});
