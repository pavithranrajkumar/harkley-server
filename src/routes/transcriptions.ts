import { Router } from 'express';
import { TranscriptionController } from '../controllers/transcriptionController';
import { validateParam } from '../middleware/validation';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Transcription routes
router.get('/meetings/:id', authenticateUser, validateParam('id'), TranscriptionController.getTranscriptionByMeeting);
router.get('/meetings/:id/stats', authenticateUser, validateParam('id'), TranscriptionController.getTranscriptionStats);
router.get('/:id', authenticateUser, validateParam('id'), TranscriptionController.getTranscriptionById);
router.get('/:id/chat-segments', authenticateUser, validateParam('id'), TranscriptionController.getChatSegmentsByTranscription);
router.delete('/:id', authenticateUser, validateParam('id'), TranscriptionController.deleteTranscription);

export default router;
