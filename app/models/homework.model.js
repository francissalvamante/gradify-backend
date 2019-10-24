const mongoose = require('mongoose');

const HomeworkSchema = mongoose.Schema({
	grade: Number,
	quarter: String,
	year: String,
	studentId: {
		type: String,
		ref: 'Student'
	}
}, {
	timestamps: true
});

HomeworkSchema.index({ studentId: -1 });

module.exports = mongoose.model('Homework', HomeworkSchema);
