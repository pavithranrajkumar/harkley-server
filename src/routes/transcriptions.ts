import { Router } from 'express';
import { TranscriptionController } from '../controllers/transcriptionController';
import { validateIdParam } from '../middleware/validation';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Transcription routes
router.get('/meetings/:meetingId', authenticateUser, validateIdParam('meetingId'), TranscriptionController.getTranscriptionByMeeting);
router.get('/meetings/:meetingId/stats', authenticateUser, validateIdParam('meetingId'), TranscriptionController.getTranscriptionStats);
router.get('/:transcriptionId', authenticateUser, validateIdParam('transcriptionId'), TranscriptionController.getTranscriptionById);
router.get(
  '/:transcriptionId/chat-segments',
  authenticateUser,
  validateIdParam('transcriptionId'),
  TranscriptionController.getChatSegmentsByTranscription
);
router.delete('/:transcriptionId', authenticateUser, validateIdParam('transcriptionId'), TranscriptionController.deleteTranscription);

export default router;
