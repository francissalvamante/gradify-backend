const mongoose = require('mongoose');

const AverageSchema = mongoose.Schema({
	average: Number,
	homeworkScore: Number,
	testScore: Number,
	quarter: String,
	year: String,
	studentId: {
		type: String,
		ref: 'Student'
	}
}, {
	timestamps: true
});

AverageSchema.index({ studentId: -1 });

module.exports = mongoose.model('Average', AverageSchema);
