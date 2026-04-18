const express = require('express');
const router = express.Router();
const { Student } = require('../models/students');
const { Course } = require('../models/course');
const { Batch } = require('../models/batch');

// GET all students
router.get('/', async (req, res) => {
    try {
        const students = await Student.find()
            .populate('course')
            .populate('batch')
            .sort({ name: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET student by ID
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('course')
            .populate('batch');
        if (!student) return res.status(404).json({ message: 'Student not found.' });
        res.json(student);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
        res.status(500).json({ message: err.message });
    }
});

// POST create student
router.post('/', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const courseId = req.body.course;
        const batchId = req.body.batch;

        if (!name) return res.status(400).json({ message: 'Student name is required.' });
        if (!courseId) return res.status(400).json({ message: 'Course is required.' });
        if (!batchId) return res.status(400).json({ message: 'Batch is required.' });

        // Validate course exists
        const course = await Course.findById(courseId);
        if (!course) return res.status(400).json({ message: 'Selected course does not exist.' });

        // Validate batch exists and belongs to the selected course
        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(400).json({ message: 'Selected batch does not exist.' });
        if (batch.course.toString() !== courseId.toString()) {
            return res.status(400).json({ message: 'Selected batch does not belong to the selected course.' });
        }

        // Duplicate student: same name in same batch
        const duplicate = await Student.findOne({
            name,
            batch: batchId
        }).collation({ locale: 'en', strength: 2 });
        if (duplicate) {
            return res.status(409).json({ message: `Student "${name}" is already enrolled in this batch.` });
        }

        // Time-conflict check: student must not be in overlapping batches
        const existingStudentBatches = await Student.find({ name }).collation({ locale: 'en', strength: 2 }).populate('batch');
        for (const s of existingStudentBatches) {
            const existingBatch = s.batch;
            if (!existingBatch) continue; // safety check
            const overlapStart = existingBatch.starttime < batch.endtime;
            const overlapEnd = existingBatch.endtime > batch.starttime;
            if (overlapStart && overlapEnd) {
                return res.status(409).json({
                    message: `Time conflict: student "${name}" is already enrolled in batch "${existingBatch.name}" which overlaps with the selected batch.`
                });
            }
        }

        const student = new Student({ name, course: courseId, batch: batchId });
        const saved = await student.save();
        const populated = await saved.populate(['course', 'batch']);
        res.status(201).json(populated);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: `Student is already enrolled in this batch.` });
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID format.' });
        res.status(400).json({ message: err.message });
    }
});

// PUT update student
router.put('/:id', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const courseId = req.body.course;
        const batchId = req.body.batch;

        if (!name) return res.status(400).json({ message: 'Student name is required.' });
        if (!courseId) return res.status(400).json({ message: 'Course is required.' });
        if (!batchId) return res.status(400).json({ message: 'Batch is required.' });

        const course = await Course.findById(courseId);
        if (!course) return res.status(400).json({ message: 'Selected course does not exist.' });

        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(400).json({ message: 'Selected batch does not exist.' });
        if (batch.course.toString() !== courseId.toString()) {
            return res.status(400).json({ message: 'Selected batch does not belong to the selected course.' });
        }

        const duplicate = await Student.findOne({
            name,
            batch: batchId,
            _id: { $ne: req.params.id }
        }).collation({ locale: 'en', strength: 2 });
        if (duplicate) {
            return res.status(409).json({ message: `Student "${name}" is already enrolled in this batch.` });
        }

        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found.' });
        
        // Time conflict check for update
        if (student.batch.toString() !== batchId.toString()) {
            const existingStudentBatches = await Student.find({
                name,
                _id: { $ne: req.params.id }
            }).collation({ locale: 'en', strength: 2 }).populate('batch');

            for (const s of existingStudentBatches) {
                const existingBatch = s.batch;
                if (!existingBatch) continue;
                const overlapStart = existingBatch.starttime < batch.endtime;
                const overlapEnd = existingBatch.endtime > batch.starttime;
                if (overlapStart && overlapEnd) {
                    return res.status(409).json({
                        message: `Time conflict: student "${name}" is already enrolled in batch "${existingBatch.name}" which overlaps with the selected batch.`
                    });
                }
            }
        }

        student.name = name;
        student.course = courseId;
        student.batch = batchId;
        const updated = await student.save();
        const populated = await updated.populate(['course', 'batch']);
        res.json(populated);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: `Student is already enrolled in this batch.` });
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID format.' });
        res.status(400).json({ message: err.message });
    }
});

// DELETE student
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found.' });
        res.json({ message: 'Student deleted successfully.' });
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;