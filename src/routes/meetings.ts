import { Router } from 'express';
import multer from 'multer';
import { MeetingController } from '../controllers/meetingController';
import { validateIdParam } from '../middleware/validation';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow webm files
    if (file.mimetype === 'video/webm' || file.mimetype === 'audio/webm') {
      cb(null, true);
    } else {
      cb(new Error('Only WebM files are allowed'));
    }
  },
});

// Routes
router.post('/', authenticateUser, upload.single('recording'), MeetingController.createMeeting);
router.get('/stats', authenticateUser, MeetingController.getMeetingStats);
router.get('/:id', authenticateUser, validateIdParam('id'), MeetingController.getMeeting);
router.get('/', authenticateUser, MeetingController.getMeetings);
router.put('/:id', authenticateUser, validateIdParam('id'), MeetingController.updateMeeting);
router.delete('/:id', authenticateUser, validateIdParam('id'), MeetingController.deleteMeeting);

export default router;
