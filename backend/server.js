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

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: allowedOrigins, 
    credentials: true
  })
);

const io = new Server(httpServer,  {
    cors: {
        origin: allowedOrigins,
        methods:["GET", "POST"],
        credentials: true,
    },
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

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message:'Internal Server Error'});
});

// Update analytics hourly
cron.schedule('0 * * * *', async () => {
    console.log('Updating exam analytics...');
    const exams = await Exam.find();
    await Promise.all(exams.map(exam => updateExamAnalytics(exam._id)));
  });



httpServer.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
});

// Modification to the socket.io connection handler in server.js

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-exam-room', async (attemptId) => {
    console.log(`Socket ${socket.id} joining exam room: ${attemptId}`);
    try {
      // Check if attempt exists
      const attempt = await ExamAttempt.findById(attemptId).lean();
      if (!attempt) {
        console.log(`No exam attempt found for ID: ${attemptId}`);
        socket.emit('exam-error', { message: 'Exam attempt not found' });
        return;
      }

      // Get exam details
      const exam = await Exam.findById(attempt.examId).lean();
      if (!exam) {
        console.log(`No exam found for attempt: ${attemptId}`);
        socket.emit('exam-error', { message: 'Exam not found' });
        return;
      }

      const totalDuration = exam.duration * 60;

      // Clear existing interval
      if (socket.interval) {
        console.log(`Clearing existing interval for socket: ${socket.id}`);
        clearInterval(socket.interval);
      }

      // Initial time calculation
      const elapsed = Math.floor((Date.now() - attempt.startTime) / 1000);
      let remaining = Math.max(totalDuration - elapsed, 0);
      socket.emit('timer-update', remaining);
      console.log(`Initial timer update for ${attemptId}: ${remaining} seconds remaining`);

// In your server.js socket handler, modify the timer logic
socket.interval = setInterval(async () => {
  try {
    const currentAttempt = await ExamAttempt.findById(attemptId).lean();
    
    if (!currentAttempt) {
      console.log(`Attempt ${attemptId} no longer exists, stopping timer`);
      clearInterval(socket.interval);
      socket.emit('exam-error', { message: 'Exam attempt no longer available' });
      return;
    }

    const newElapsed = Math.floor((Date.now() - currentAttempt.startTime) / 1000);
    remaining = Math.max(totalDuration - newElapsed, 0);
    
    // Emit time-expired when official time is up (timer shows 0)
    if (remaining <= 0) {
      console.log(`Time expired for attempt ${attemptId}`);
      clearInterval(socket.interval);
      io.to(attemptId).emit('time-expired');
      return;
    }

    io.to(attemptId).emit('timer-update', remaining);
  } catch (error) {
    console.error(`Timer interval error for attempt ${attemptId}:`, error);
    clearInterval(socket.interval);
    socket.emit('exam-error', { message: 'Error updating exam timer' });
  }
}, 1000);


      socket.join(attemptId);
      console.log(`Socket ${socket.id} successfully joined room ${attemptId}`);

      // Store the attempt ID on the socket for cleanup
      socket.attemptId = attemptId;

    } catch (error) {
      console.error(`Socket error for ${socket.id}:`, error);
      socket.emit('exam-error', { message: 'Server error' });
    }
  });

  socket.on('leave-exam-room', () => {
    if (socket.attemptId) {
      console.log(`Socket ${socket.id} leaving exam room: ${socket.attemptId}`);
      socket.leave(socket.attemptId);
      socket.attemptId = null;
    }
    
    if (socket.interval) {
      console.log(`Clearing interval for socket: ${socket.id}`);
      clearInterval(socket.interval);
      socket.interval = null;
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    if (socket.interval) {
      clearInterval(socket.interval);
    }
  });
});
