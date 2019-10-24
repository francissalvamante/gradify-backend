const mongoose = require('mongoose');

const StudentSchema = mongoose.Schema({
	studentId: String,
	firstName: String,
	lastName: String
}, {
	toJSON: { virtuals: true },
	timestamps: true
});

StudentSchema.virtual('homeworks', {
	ref: 'Homework',
	localField: 'studentId',
	foreignField: 'studentId',
	justOne: false
});

StudentSchema.virtual('averages', {
	ref: 'Average',
	localField: 'studentId',
	foreignField: 'studentId',
	justOne: false
});

StudentSchema.virtual('tests', {
	ref: 'Test',
	localField: 'studentId',
	foreignField: 'studentId',
	justOne: false
});

StudentSchema.index({ studentId: -1 }, { unique: true });

StudentSchema.pre('find', function() {
	this.populate('homeworks');
	this.populate('averages');
	this.populate('tests');
});

StudentSchema.pre('findOne', function() {
	this.populate('homeworks');
	this.populate('averages');
	this.populate('tests');
});

module.exports = mongoose.model('Student', StudentSchema);
