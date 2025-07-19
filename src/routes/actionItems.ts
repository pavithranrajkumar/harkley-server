import { Router } from 'express';
import { ActionItemController } from '../controllers/actionItemController';
import { validateParam } from '../middleware/validation';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/', authenticateUser, ActionItemController.getActionItems);
router.post('/', authenticateUser, ActionItemController.createActionItem);
router.put('/:id', authenticateUser, validateParam('id'), ActionItemController.updateActionItem);
router.delete('/:id', authenticateUser, validateParam('id'), ActionItemController.deleteActionItem);

export default router;
