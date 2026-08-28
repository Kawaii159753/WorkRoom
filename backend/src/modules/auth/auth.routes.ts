import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import { validate } from '../../middleware/validate.js';
import { AuthController } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  AuthController.login
);

router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.getMe);

export const authRouter = router;
