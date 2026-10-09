import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './src/config.js';
import adminRoutes from './src/routes/admin.js';
import authRoutes from './src/routes/auth.js';
import progressRoutes from './src/routes/progress.js';
import { ensureAdmin } from './src/seed.js';

const app = express();
app.set('trust proxy', 1);
// The client loads fonts, KaTeX and Pyodide from CDNs and runs an inline theme script, so CSP is left to the host.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
if (config.clientOrigins.length) app.use('/api', cors({ origin: config.clientOrigins }));
// Progress includes the learner's saved exercise code, so allow a generous body.
app.use(express.json({ limit: '4mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// In production, serve the built client (client/dist) from the same origin.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: 'index.html', maxAge: '1h' }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'That request is too large.' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

try {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB.');
  await ensureAdmin();
} catch (e) {
  console.error('Could not connect to MongoDB. Check MONGO_URI in server/.env.\n', e.message);
  process.exit(1);
}

app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));
