const express = require('express');
const router = express.Router();
const { Subject } = require('../models/subject');
const { Course } = require('../models/course');

// GET all subjects
router.get('/', async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET subject by ID
router.get('/:id', async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) return res.status(404).json({ message: 'Subject not found.' });
        res.json(subject);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
        res.status(500).json({ message: err.message });
    }
});

// POST create subject
router.post('/', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        if (!name) return res.status(400).json({ message: 'Subject name is required.' });

        // Case-insensitive duplicate check
        const existing = await Subject.findOne({ name }).collation({ locale: 'en', strength: 2 });
        if (existing) return res.status(409).json({ message: `Subject "${name}" already exists.` });

        const subject = new Subject({ name });
        const saved = await subject.save();
        res.status(201).json(saved);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: `Subject already exists.` });
        res.status(400).json({ message: err.message });
    }
});

// PUT update subject
router.put('/:id', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        if (!name) return res.status(400).json({ message: 'Subject name is required.' });

        // Check duplicate (exclude self)
        const existing = await Subject.findOne({
            name,
            _id: { $ne: req.params.id }
        }).collation({ locale: 'en', strength: 2 });
        
        if (existing) return res.status(409).json({ message: `Subject "${name}" already exists.` });

        const subject = await Subject.findById(req.params.id);
        if (!subject) return res.status(404).json({ message: 'Subject not found.' });
        subject.name = name;
        const updated = await subject.save();
        res.json(updated);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: `Subject already exists.` });
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
        res.status(400).json({ message: err.message });
    }
});

// DELETE subject — blocked if used in any course
router.delete('/:id', async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) return res.status(404).json({ message: 'Subject not found.' });

        const usedInCourse = await Course.findOne({ subjects: req.params.id });
        if (usedInCourse) {
            return res.status(409).json({
                message: `Cannot delete subject "${subject.name}" — it is used in course "${usedInCourse.name}".`
            });
        }

        await Subject.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subject deleted successfully.' });
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;