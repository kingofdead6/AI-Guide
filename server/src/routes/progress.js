import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);

/** Same shape check the client uses before restoring a backup. */
const isProgressData = (x) => isObj(x) && x.version === 1 && isObj(x.lessons) && isObj(x.quizzes) && isObj(x.exams);

/** MongoDB rejects keys that start with `$`; a well-formed progress document never has them. */
function hasBadKeys(x, depth = 0) {
  if (depth > 12) return true;
  if (Array.isArray(x)) return x.some((v) => hasBadKeys(v, depth + 1));
  if (!isObj(x)) return false;
  return Object.entries(x).some(([k, v]) => k.startsWith('$') || hasBadKeys(v, depth + 1));
}

router.get('/', (req, res) => {
  res.json({ progress: req.user.progress ?? null, updatedAt: req.user.progressUpdatedAt });
});

router.put('/', async (req, res) => {
  const progress = req.body?.progress;
  if (!isProgressData(progress) || hasBadKeys(progress)) return res.status(400).json({ error: 'That is not a valid progress document.' });
  const now = new Date();
  req.user.progress = progress;
  req.user.markModified('progress');
  req.user.progressUpdatedAt = now;
  req.user.lastSeenAt = now;
  await req.user.save();
  res.json({ ok: true, updatedAt: now });
});

export default router;
