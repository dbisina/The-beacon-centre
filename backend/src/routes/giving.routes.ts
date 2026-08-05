// backend/src/routes/giving.routes.ts
import { Router } from 'express';
import { GivingController } from '../controllers/giving.controller';
import { authenticate, requireFullAccess } from '../middleware/auth.middleware';
import { authenticateUser, optionalAuthenticateUser } from '../middleware/user.middleware';

const router = Router();

// Church bank accounts - the default giving option (manual transfer).
// Public read, admin-managed writes.
router.get('/bank-accounts', GivingController.listBankAccounts);
router.post('/bank-accounts', authenticate, requireFullAccess, GivingController.createBankAccount);
router.put('/bank-accounts/:id', authenticate, requireFullAccess, GivingController.updateBankAccount);
router.delete('/bank-accounts/:id', authenticate, requireFullAccess, GivingController.deleteBankAccount);

// Paystack - the online/alternative giving option.
router.post('/initialize', optionalAuthenticateUser, GivingController.initialize);
router.post('/verify', GivingController.verify);
// No auth middleware at all - Paystack calls this directly.
router.post('/webhook', GivingController.webhook);

// Giving history / saved cards - mobile app, logged-in user only.
router.get('/history', authenticateUser, GivingController.getHistory);
router.get('/methods', authenticateUser, GivingController.getMethods);
router.delete('/methods/:id', authenticateUser, GivingController.deleteMethod);

// Admin ledger.
router.get('/admin/transactions', authenticate, requireFullAccess, GivingController.getAdminTransactions);

export default router;
