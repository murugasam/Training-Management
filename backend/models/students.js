const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true }
}, { timestamps: true });

// Prevent duplicate: same name in same batch
studentSchema.index({ name: 1, batch: 1 }, {
    unique: true,
    collation: { locale: 'en', strength: 2 }
});

const Student = mongoose.model('Student', studentSchema);
exports.Student = Student;