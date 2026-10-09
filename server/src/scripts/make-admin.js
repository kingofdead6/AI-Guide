/** Usage: npm run make-admin -- someone@example.com   (add --revoke to remove admin access) */
import mongoose from 'mongoose';
import { config } from '../config.js';
import { User } from '../models/User.js';

const email = (process.argv[2] || '').trim().toLowerCase();
const revoke = process.argv.includes('--revoke');
if (!email || email.startsWith('--')) {
  console.error('Usage: npm run make-admin -- <email> [--revoke]');
  process.exit(1);
}

await mongoose.connect(config.mongoUri);
const u = await User.findOneAndUpdate({ email }, { role: revoke ? 'user' : 'admin' }, { returnDocument: 'after' });
console.log(u ? `${u.email} is now ${u.role === 'admin' ? 'an admin' : 'a regular user'}.` : `No account found for ${email}. Register it in the app first.`);
await mongoose.disconnect();
