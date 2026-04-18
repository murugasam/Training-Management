const express = require('express');
const router = express.Router();
const { Batch } = require('../models/batch');
const { Course } = require('../models/course');
const { Student } = require('../models/students');

// GET all batches
router.get('/', async (req, res) => {
    try {
        const batches = await Batch.find().populate('course').sort({ name: 1 });
        res.json(batches);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET batch by ID
router.get('/:id', async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id).populate('course');
        if (!batch) return res.status(404).json({ message: 'Batch not found.' });
        res.json(batch);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
        res.status(500).json({ message: err.message });
    }
});

// POST create batch
router.post('/', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const courseId = req.body.course;
        const starttime = req.body.starttime;
        const endtime = req.body.endtime;

        if (!name) return res.status(400).json({ message: 'Batch name is required.' });
        if (!courseId) return res.status(400).json({ message: 'A valid course is required.' });
        if (!starttime) return res.status(400).json({ message: 'Start time is required.' });
        if (!endtime) return res.status(400).json({ message: 'End time is required.' });

        const start = new Date(starttime);
        const end = new Date(endtime);
        if (isNaN(start.getTime())) return res.status(400).json({ message: 'Start time is invalid.' });
        if (isNaN(end.getTime())) return res.status(400).json({ message: 'End time is invalid.' });
        if (end <= start) return res.status(400).json({ message: 'End time must be after start time.' });

        // Validate course exists
        const course = await Course.findById(courseId);
        if (!course) return res.status(400).json({ message: 'Course not found.' });

        // Duplicate batch name under same course
        const existing = await Batch.findOne({
            name,
            course: courseId
        }).collation({ locale: 'en', strength: 2 });
        if (existing) {
            return res.status(409).json({ message: `Batch "${name}" already exists for this course.` });
        }

        const batch = new Batch({ name, course: courseId, starttime: start, endtime: end });
        const saved = await batch.save();
        const populated = await saved.populate('course');
        res.status(201).json(populated);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: `Batch already exists for this course.` });
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID format.' });
        res.status(400).json({ message: err.message });
    }
});

// PUT update batch
router.put('/:id', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const courseId = req.body.course;
        const starttime = req.body.starttime;
        const endtime = req.body.endtime;

        if (!name) return res.status(400).json({ message: 'Batch name is required.' });
        if (!courseId) return res.status(400).json({ message: 'A valid course is required.' });

        const start = new Date(starttime);
        const end = new Date(endtime);
        if (isNaN(start.getTime())) return res.status(400).json({ message: 'Start time is invalid.' });
        if (isNaN(end.getTime())) return res.status(400).json({ message: 'End time is invalid.' });
        if (end <= start) return res.status(400).json({ message: 'End time must be after start time.' });

        const course = await Course.findById(courseId);
        if (!course) return res.status(400).json({ message: 'Course not found.' });

        // Duplicate check (exclude self)
        const existing = await Batch.findOne({
            name,
            course: courseId,
            _id: { $ne: req.params.id }
        }).collation({ locale: 'en', strength: 2 });
        if (existing) {
            return res.status(409).json({ message: `Batch "${name}" already exists for this course.` });
        }

        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ message: 'Batch not found.' });
        batch.name = name;
        batch.course = courseId;
        batch.starttime = start;
        batch.endtime = end;
        const updated = await batch.save();
        const populated = await updated.populate('course');
        res.json(populated);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: `Batch already exists for this course.` });
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID format.' });
        res.status(400).json({ message: err.message });
    }
});

// DELETE batch — blocked if students are enrolled
router.delete('/:id', async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ message: 'Batch not found.' });

        const studentExists = await Student.findOne({ batch: req.params.id });
        if (studentExists) {
            return res.status(409).json({
                message: `Cannot delete batch "${batch.name}" — student "${studentExists.name}" is enrolled.`
            });
        }

        await Batch.findByIdAndDelete(req.params.id);
        res.json({ message: 'Batch deleted successfully.' });
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;