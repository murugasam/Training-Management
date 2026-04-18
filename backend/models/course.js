const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }]
}, { timestamps: true });

// Case-insensitive unique index on course name
courseSchema.index({ name: 1 }, {
    unique: true,
    collation: { locale: 'en', strength: 2 }
});

const Course = mongoose.model('Course', courseSchema);
exports.Course = Course;