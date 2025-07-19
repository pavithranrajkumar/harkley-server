import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';

const router = Router();

// Webhook routes
router.post('/transcription', WebhookController.handleTranscriptionWebhook);

export default router;
