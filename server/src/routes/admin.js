import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const DAY = 86_400_000;

/**
 * Drops the heavy parts of a progress document (saved code, individual answers) and keeps what the
 * admin list needs to compute course status, accuracy and streaks on the client.
 */
function slim(p) {
  if (!p || typeof p !== 'object') return null;
  const quizzes = {};
  for (const [id, q] of Object.entries(p.quizzes ?? {})) quizzes[id] = { results: q?.results ?? {}, attempts: q?.attempts ?? 0, best: q?.best ?? 0, passedAt: q?.passedAt };
  const exams = {};
  for (const [id, e] of Object.entries(p.exams ?? {}))
    exams[id] = { attempts: e?.attempts ?? 0, best: e?.best ?? 0, passedAt: e?.passedAt, last: e?.last ? { results: e.last.results ?? {}, score: e.last.score, finishedAt: e.last.finishedAt, qids: [], answers: {} } : undefined };
  const code = {};
  for (const [id, c] of Object.entries(p.code ?? {})) if (c?.passedAt) code[id] = { passedAt: c.passedAt };
  return {
    version: 1,
    name: p.name ?? '',
    theme: 'system',
    lessons: p.lessons ?? {},
    quizzes,
    exams,
    code,
    projects: p.projects ?? {},
    certificates: p.certificates ?? {},
    activity: p.activity ?? {},
    last: p.last,
  };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/stats', async (_req, res) => {
  const now = Date.now();
  const [users, admins, active7, active30, new7, deletionRequests] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ lastSeenAt: { $gte: new Date(now - 7 * DAY) } }),
    User.countDocuments({ lastSeenAt: { $gte: new Date(now - 30 * DAY) } }),
    User.countDocuments({ createdAt: { $gte: new Date(now - 7 * DAY) } }),
    User.countDocuments({ deletionRequestedAt: { $ne: null } }),
  ]);
  const since = new Date(now - 29 * DAY);
  since.setHours(0, 0, 0, 0);
  const signups = await User.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ users, admins, active7, active30, new7, deletionRequests, signups: Object.fromEntries(signups.map((s) => [s._id, s.n])) });
});

router.get('/users', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  const filter = q ? { $or: [{ name: new RegExp(escapeRe(q), 'i') }, { email: new RegExp(escapeRe(q), 'i') }] } : {};
  const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 2000);
  const docs = await User.find(filter).sort({ lastSeenAt: -1 }).limit(limit);
  const total = await User.countDocuments(filter);
  res.json({
    total,
    users: docs.map((u) => ({ ...u.toPublic(), progressUpdatedAt: u.progressUpdatedAt, progress: slim(u.progress) })),
  });
});

router.get('/deletion-requests', async (_req, res) => {
  const docs = await User.find({ deletionRequestedAt: { $ne: null } }).sort({ deletionRequestedAt: 1 });
  res.json({ requests: docs.map((u) => ({ ...u.toPublic(), deletionReason: u.deletionReason, progress: slim(u.progress) })) });
});

/** Keep the account and clear the request. */
router.delete('/deletion-requests/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'User not found.' });
  const u = await User.findByIdAndUpdate(req.params.id, { deletionRequestedAt: null, deletionReason: '' }, { returnDocument: 'after' });
  if (!u) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: u.toPublic() });
});

router.get('/users/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'User not found.' });
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: { ...u.toPublic(), deletionReason: u.deletionReason, progressUpdatedAt: u.progressUpdatedAt, progress: u.progress ?? null } });
});

router.patch('/users/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'User not found.' });
  const role = req.body?.role;
  if (role !== 'user' && role !== 'admin') return res.status(400).json({ error: 'Role must be user or admin.' });
  if (req.params.id === req.user._id.toString() && role !== 'admin') return res.status(400).json({ error: 'You cannot remove your own admin access.' });
  const u = await User.findByIdAndUpdate(req.params.id, { role }, { returnDocument: 'after' });
  if (!u) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: u.toPublic() });
});

router.delete('/users/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'User not found.' });
  if (req.params.id === req.user._id.toString()) return res.status(400).json({ error: 'You cannot delete your own account here.' });
  const u = await User.findByIdAndDelete(req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found.' });
  res.json({ ok: true });
});

export default router;
