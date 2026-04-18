const express = require('express');
const router = express.Router();
const { Course } = require('../models/course');
const { Subject } = require('../models/subject');
const { Batch } = require('../models/batch');

// GET all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find().populate('subjects').sort({ name: 1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET course by ID
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('subjects');
        if (!course) return res.status(404).json({ message: 'Course not found.' });
        res.json(course);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
        res.status(500).json({ message: err.message });
    }
});

// POST create course
router.post('/', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const subjects = req.body.subjects;

        if (!name) return res.status(400).json({ message: 'Course name is required.' });
        if (!Array.isArray(subjects) || subjects.length < 2) {
            return res.status(400).json({ message: 'A course must have at least 2 subjects.' });
        }

        // De-duplicate array
        const uniqueSubjects = [...new Set(subjects)];
        if (uniqueSubjects.length < 2) {
            return res.status(400).json({ message: 'A course must have at least 2 distinct subjects.' });
        }

        // Validate all subject IDs exist
        const foundSubjects = await Subject.find({ _id: { $in: uniqueSubjects } });
        if (foundSubjects.length !== uniqueSubjects.length) {
            return res.status(400).json({ message: 'One or more subject IDs are invalid.' });
        }

        // Case-insensitive duplicate check
        const existing = await Course.findOne({ name }).collation({ locale: 'en', strength: 2 });
        if (existing) return res.status(409).json({ message: `Course "${name}" already exists.` });

        const course = new Course({ name, subjects: uniqueSubjects });
        const saved = await course.save();
        const populated = await saved.populate('subjects');
        res.status(201).json(populated);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: `Course already exists.` });
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
        res.status(400).json({ message: err.message });
    }
});

// PUT update course
router.put('/:id', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const subjects = req.body.subjects;

        if (!name) return res.status(400).json({ message: 'Course name is required.' });
        if (!Array.isArray(subjects) || subjects.length < 2) {
            return res.status(400).json({ message: 'A course must have at least 2 subjects.' });
        }

        const uniqueSubjects = [...new Set(subjects)];
        if (uniqueSubjects.length < 2) {
            return res.status(400).json({ message: 'A course must have at least 2 distinct subjects.' });
        }

        const foundSubjects = await Subject.find({ _id: { $in: uniqueSubjects } });
        if (foundSubjects.length !== uniqueSubjects.length) {
            return res.status(400).json({ message: 'One or more subject IDs are invalid.' });
        }

        // Duplicate check excluding self
        const existing = await Course.findOne({
            name,
            _id: { $ne: req.params.id }
        }).collation({ locale: 'en', strength: 2 });

        if (existing) return res.status(409).json({ message: `Course "${name}" already exists.` });

        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found.' });
        course.name = name;
        course.subjects = uniqueSubjects;
        const updated = await course.save();
        const populated = await updated.populate('subjects');
        res.json(populated);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: `Course already exists.` });
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
        res.status(400).json({ message: err.message });
    }
});

// DELETE course — blocked if batches exist
router.delete('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found.' });

        const batchExists = await Batch.findOne({ course: req.params.id });
        if (batchExists) {
            return res.status(409).json({
                message: `Cannot delete course "${course.name}" — batch "${batchExists.name}" is associated with it.`
            });
        }

        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted successfully.' });
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;