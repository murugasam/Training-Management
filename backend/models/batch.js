const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    starttime: { type: Date, required: true },
    endtime: { type: Date, required: true }
}, { timestamps: true });

// Duplicate batch name under same course prevented
batchSchema.index({ name: 1, course: 1 }, {
    unique: true,
    collation: { locale: 'en', strength: 2 }
});

const Batch = mongoose.model('Batch', batchSchema);
exports.Batch = Batch;