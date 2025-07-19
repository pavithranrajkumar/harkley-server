import { Router } from 'express';
import { ActionItemController } from '../controllers/actionItemController';
import { validateIdParam } from '../middleware/validation';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/', authenticateUser, ActionItemController.getActionItems);
router.post('/', authenticateUser, ActionItemController.createActionItem);
router.put('/:actionItemId', authenticateUser, validateIdParam('actionItemId'), ActionItemController.updateActionItem);
router.delete('/:actionItemId', authenticateUser, validateIdParam('actionItemId'), ActionItemController.deleteActionItem);

export default router;
