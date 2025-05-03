import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';

import examRoutes from './routes/examRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import responseRoutes from './routes/responseRoutes.js';
import resultRoutes from './routes/resultRoutes.js';

import examLogRoutes from './routes/examLogRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

import cron from 'node-cron';
import { updateExamAnalytics } from './controllers/analyticsController.js';
import Exam from './models/examModel.js';

const app = express();
const port = process.env.PORT || 5000;
connectDB();

const allowedOrigins = ['http://localhost:5173']

app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials: true}));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message:'Internal Server Error'});
});

//API Endpoints 
app.get('/', (req, res) => res.send("API is running..."));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

//exam API Endpoints
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/results', resultRoutes);

app.use('/api/logs', examLogRoutes);
app.use('/api/analytics', analyticsRoutes);

// Update analytics hourly
cron.schedule('0 * * * *', async () => {
    console.log('Updating exam analytics...');
    const exams = await Exam.find();
    await Promise.all(exams.map(exam => updateExamAnalytics(exam._id)));
  });

app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
});
