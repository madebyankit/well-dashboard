/**
 * Removes a production build before starting the dev server.
 *
 * `next build` and `next dev` share the .next directory but write different,
 * incompatible things into it. Running one after the other leaves the dev
 * server loading chunks that no longer exist, which surfaces as a confusing
 * "Cannot find module './611.js'" and the app failing to load at all.
 *
 * A production build is identifiable by its BUILD_ID file, which dev never
 * writes — so that is the only case we clear, keeping the dev cache (and fast
 * restarts) intact the rest of the time.
 */
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const nextDir = path.join(process.cwd(), '.next');

if (existsSync(path.join(nextDir, 'BUILD_ID'))) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log('Removed a previous production build from .next so the dev server starts clean.');
}
