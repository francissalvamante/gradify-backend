const uuidv4 = require('uuid/v4');
const Student = require('../models/student.model.js');
const Homework = require('../models/homework.model.js');
const Test = require('../models/test.model.js');
const Average = require('../models/average.model.js');

var Promise = require('bluebird');
Promise.promisifyAll(Student);

function checkExists(firstName, lastName) {
	return Student.findOne({ firstName, lastName }).then((response) => {
		return response;
	});
}

function saveGrades(studentId, details, quarter, year) {
	let homework = false, test = false;
	let totalH = 0, totalT = 0;
	let countH = 0, countT = 0;
	let minH = Number.MAX_SAFE_INTEGER;

	for(var j = 2; j < details.length; j++) {
		if(details[j] === 'H') {
			homework = true;
			test = false;
		} else if(details[j] === 'T') {
			test = true;
			homework = false;
		} else {
			let g = parseInt(details[j]);
			if(homework) {
				new Homework({
					grade: g,
					quarter: quarter,
					year: year,
					studentId: studentId
				}).save();
				minH = g < minH ? g : minH;
				totalH += g;
				countH++;
			} else if(test) {
				new Test({
					grade: g,
					quarter: quarter,
					year: year,
					studentId: studentId
				}).save();
				totalT += g;
				countT++;
			}
		}
	}

	totalH -= minH;
	let aveH = totalH / countH > 1 ? (countH - 1) : countH;
	let aveT = totalT / countT;

	let homeworkPerc = aveH * 0.4;
	let testPerc = aveT * 0.6;
	let finalGrade = homeworkPerc + testPerc;
	new Average({
		average: finalGrade.toFixed(1),
		homeworkScore: homeworkPerc.toFixed(1),
		testScore: testPerc.toFixed(1),
		quarter: quarter,
		year: year,
		studentId: studentId
	}).save();
}

exports.grades = async (req, res) => {
	let body = req.body.content;
	let quarter = body[0].split(',')[0];
	let year = body[0].split(',')[1];
	let data = [];

	for(var i = 1; i < body.length; i++) {
		let details = body[i].split(' ');
		let firstName = details[0];
		let lastName = details[1];

		let exists = await checkExists(firstName, lastName);
		if(exists) {
			saveGrades(exists.studentId, details, quarter, year);
		} else {
			let student = new Student({
				studentId: uuidv4(),
				firstName: firstName,
				lastName: lastName
			});

			await student.save().then((response) => {
				data.push(response);
				saveGrades(response.studentId, details, quarter, year);
			}).catch(err => {
				res.status(500).send('An error has occured');
			});
		}
	}

	res.status(200).send({
		status: true,
		message: 'Successfully saved'
	});
};

exports.getStudents = (req, res) => {
	Student.find().sort({ firstName: 'asc', lastName: 'asc' }).then(response => {
		let data = [];
		for(var i = 0; i < response.length; i++) {
			let student = {
				studentId: response[i].studentId,
				firstName: response[i].firstName,
				lastName: response[i].lastName,
                createdAt: response[i].createdAt
			};

			data.push(student);
		}
		res.status(200).send({
			status: true,
			data: data
		});
	}).catch(err => {
		console.error('error', err);
	});
};

exports.studentGrade = (req, res) => {
	Student.findOne({ studentId: req.query.studentId }).then(response => {
		res.status(200).send({
			status: true,
			data: {
				studentId: response.studentId,
				firstName: response.firstName,
				lastName: response.lastName,
				createdAt: response.createdAt
			},
			homework: response.homeworks,
			test: response.tests,
			average: response.averages
		});
	}).catch(err => {
		res.status(500).send(`An error has occurred ${err}`);
	});
};

exports.updateGrade = (req, res) => {
	let query = { _id: req.body._id, studentId: req.body.studentId }
	if(req.body.type === 'homework') {
		let grade = { grade: req.body.grade };
		Homework.findOneAndUpdate(query, grade).then((response) => {
			recomputeAverage(req.body.studentId, response.quarter, response.year, req.body.type);

			res.status(200).send({ status: true, message: 'Updated homework score' });
		});
	} else if(req.body.type === 'test') {
		let grade = { grade: req.body.grade };
		Test.findOneAndUpdate(query, grade).then((response) => {
			recomputeAverage(req.body.studentId, response.quarter, response.year, req.body.type);

			res.status(200).send({ status: true, message: 'Updated test score' });
		});
	} else {
		res.status(501).send('Unknown type');
	}
}

function recomputeAverage(studentId, quarter, year, type) {
	Average.findOne({ studentId, quarter, year }).then((average) => {
		if(type === 'homework') {
			let homework = Homework.find({ studentId, quarter, year });
			let minH = Number.MAX_SAFE_INTEGER, totalH = 0;
			homework.then((response) => {
				for(var i = 0; i < response.length; i++) {
					totalH += response[i].grade;
					minH = response[i].grade < minH ? response[i].grade : minH;
				}

				totalH -= minH;
				let aveH = totalH / (response.length - 1);
				let homeworkPerc = aveH * 0.4;
				let ave = homeworkPerc + average.testScore;
				console.log(homeworkPerc + average.testScore);
				Average.findOneAndUpdate({ studentId, quarter, year }, {
					homeworkScore: homeworkPerc.toFixed(1),
					average: ave.toFixed(1)
				}).then((response) => {});

				return true;
			})
		} else if(type === 'test') {
			let test = Test.find({ studentId, quarter, year });
			let totalT = 0;
			test.then((response) => {
				for(var i = 0; i< response.length; i++) {
					totalT += response[i].grade;
				}

				let aveT = totalT / response.length;
				let testPerc = aveT * 0.6;
				let ave = average.homeworkScore + testPerc;

				Average.findOneAndUpdate({ studentId, quarter, year }, {
					testScore: testPerc.toFixed(1),
					average: ave.toFixed(1)
				}).then((response) => {});

				return true;
			})
		} else {
			return false;
		}
	});
}