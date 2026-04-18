const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true }
}, { timestamps: true });

// Case-insensitive unique index
subjectSchema.index({ name: 1 }, {
    unique: true,
    collation: { locale: 'en', strength: 2 }
});

const Subject = mongoose.model('Subject', subjectSchema);
exports.Subject = Subject;