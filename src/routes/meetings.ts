import { Router } from 'express';
import multer from 'multer';
import { MeetingController } from '../controllers/meetingController';
import { validateParam } from '../middleware/validation';
import { authenticateUser } from '../middleware/auth';
import { meetingCreationLimiter } from '../middleware/rateLimit';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow webm files
    console.log({ mimeType: file.mimetype });
    if (file.mimetype.includes('video/webm') || file.mimetype.includes('audio/webm')) {
      cb(null, true);
    } else {
      cb(new Error('Only WebM files are allowed'));
    }
  },
});

// Routes
router.post('/', authenticateUser, meetingCreationLimiter, upload.single('recording'), MeetingController.createMeeting);
router.get('/stats', authenticateUser, MeetingController.getMeetingStats);
router.get('/:id', authenticateUser, validateParam('id'), MeetingController.getMeeting);
router.get('/', authenticateUser, MeetingController.getMeetings);
router.put('/:id', authenticateUser, validateParam('id'), MeetingController.updateMeeting);
router.delete('/:id', authenticateUser, validateParam('id'), MeetingController.deleteMeeting);

export default router;
