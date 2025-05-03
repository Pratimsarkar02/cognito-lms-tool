import cron from 'node-cron';
import examAttempt from '../models/examAttemptModel';

cron.schedule('0 3 * * *', async () => {
    await examAttempt.updateMany(
      { 
        isActive: true, 
        startTime: { $lt: new Date(Date.now() - 24*60*60*1000) } 
      },
      { isActive: false, isCompleted: false }
    );
  });