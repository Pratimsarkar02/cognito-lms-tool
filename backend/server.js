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

import { createServer } from 'http';
import { Server } from 'socket.io';
import ExamAttempt from './models/examAttemptModel.js';

const app = express();

const httpServer = createServer(app);

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

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods:["GET", "POST"]
    }
})

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



httpServer.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
});

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
  
    socket.on('join-exam-room', async (attemptId) => {
      try {
        const attempt = await ExamAttempt.findById(attemptId).lean();
        if (!attempt) return;
  
        const exam = await Exam.findById(attempt.examId).lean();
        const totalDuration = exam.duration * 60;
  
        // Clear existing interval
        if (socket.interval) clearInterval(socket.interval);
  
        // Initial time calculation
        const elapsed = Math.floor((Date.now() - attempt.startTime) / 1000);
        let remaining = Math.max(totalDuration - elapsed, 0);
        socket.emit('timer-update', remaining);
  
        // Start synchronized updates
        socket.interval = setInterval(async () => {
          const currentAttempt = await ExamAttempt.findById(attemptId).lean();
          const newElapsed = Math.floor((Date.now() - currentAttempt.startTime) / 1000);
          remaining = Math.max(totalDuration - newElapsed, 0);
          
          if (remaining <= 0) {
            clearInterval(socket.interval);
            io.to(attemptId).emit('time-expired');
          }
          
          io.to(attemptId).emit('timer-update', remaining);
        }, 1000);
  
        socket.join(attemptId);
  
      } catch (error) {
        console.error('Socket error:', error);
      }
    });
  
    socket.on('disconnect', () => {
      clearInterval(socket.interval);
    });
  });
