import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { User } from './models/User.js';

/** Creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD on first start, or promotes that account if it already exists. */
export async function ensureAdmin() {
  const { email, password, name } = config.admin;
  if (!email) return;
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted ${email} to admin.`);
    }
    return;
  }
  if (password.length < 8) {
    console.warn(`ADMIN_EMAIL is set but ADMIN_PASSWORD is missing or shorter than 8 characters, so no admin was created.`);
    return;
  }
  await User.create({ name, email, role: 'admin', passwordHash: await bcrypt.hash(password, 12) });
  console.log(`Created admin account ${email}.`);
}
