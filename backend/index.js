const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

mongoose.connect('mongodb+srv://murugasam2004_db_user:1234@cluster0.mp1ztyp.mongodb.net/?appName=Cluster0')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

app.use(cors());
app.use(express.json());
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/students', require('./routes/students'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});