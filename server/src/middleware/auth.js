import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';

export const signToken = (user) => jwt.sign({ sub: user._id.toString(), v: user.tokenVersion ?? 0 }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

/** Loads the user from the bearer token. The role is always read from the database, never trusted from the token. */
export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in.' });
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
  const user = await User.findById(payload.sub);
  if (!user) return res.status(401).json({ error: 'This account no longer exists.' });
  if ((payload.v ?? 0) !== (user.tokenVersion ?? 0)) return res.status(401).json({ error: 'Your password was changed. Please sign in again.' });
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admins only.' });
  next();
}
