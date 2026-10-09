import bcrypt from 'bcryptjs';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, signToken } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 12);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v) => (typeof v === 'string' ? v : '');

router.post('/register', limiter, async (req, res) => {
  const name = str(req.body?.name).trim();
  const email = str(req.body?.email).trim().toLowerCase();
  const password = str(req.body?.password);
  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Please enter your name (2 to 80 characters).' });
  if (!EMAIL_RE.test(email) || email.length > 200) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (password.length < 8 || password.length > 200) return res.status(400).json({ error: 'Your password needs at least 8 characters.' });
  if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists. Try signing in.' });

  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: signToken(user), user: user.toPublic() });
});

router.post('/login', limiter, async (req, res) => {
  const email = str(req.body?.email).trim().toLowerCase();
  const password = str(req.body?.password);
  const user = await User.findOne({ email }).select('+passwordHash');
  // Compare even when the user is missing so response time does not reveal which emails exist.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: 'Wrong email or password.' });
  user.lastSeenAt = new Date();
  await user.save();
  res.json({ token: signToken(user), user: user.toPublic() });
});

router.get('/me', requireAuth, async (req, res) => {
  req.user.lastSeenAt = new Date();
  await req.user.save();
  res.json({ user: req.user.toPublic() });
});

router.patch('/me', requireAuth, async (req, res) => {
  const name = str(req.body?.name).trim();
  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Please enter your name (2 to 80 characters).' });
  req.user.name = name;
  await req.user.save();
  res.json({ user: req.user.toPublic() });
});

export default router;
