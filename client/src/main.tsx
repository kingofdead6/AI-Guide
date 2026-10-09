import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startSync } from './lib/auth';
import './index.css';

startSync();

// After a redeploy, a tab opened earlier may ask for page files that no longer exist. Reload once to get the
// new version instead of showing an error (the flag stops a reload loop if something else is wrong).
window.addEventListener('vite:preloadError', (e) => {
  try {
    if (sessionStorage.getItem('reloaded-for-update')) return;
    sessionStorage.setItem('reloaded-for-update', '1');
  } catch {
    return;
  }
  e.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => setTimeout(() => {
  try {
    sessionStorage.removeItem('reloaded-for-update');
  } catch {
    /* ignore */
  }
}, 10_000));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
