module.exports = (app) => {
	const students = require('../controllers/student.controller.js');

	app.post('/grades', students.grades);

	app.get('/students', students.getStudents);

	app.get('/studentgrade', students.studentGrade);

	app.post('/update', students.updateGrade);
}
