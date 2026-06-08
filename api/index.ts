// Vercel serverless entry — wraps the Express app as a single function.
// All /api/* requests are routed here via the rewrite in vercel.json.
// The app is built to server/dist by the `vercel-build` step before this runs.
import { createApp } from '../server/dist/app.js';

const app = createApp();

export default app;
