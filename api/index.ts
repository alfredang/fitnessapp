// Vercel serverless entry — wraps the Express app as a single function.
// All /api/* requests are routed here via the rewrite in vercel.json.
//
// server/dist is ESM ("type": "module") while Vercel may compile this function
// as CommonJS, so we load the app via dynamic import() (valid in both) and
// memoize it across warm invocations.
import type { IncomingMessage, ServerResponse } from 'node:http';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let appPromise: Promise<Handler> | undefined;

async function getApp(): Promise<Handler> {
  if (!appPromise) {
    appPromise = import('../server/dist/app.js').then(
      (m) => m.createApp() as unknown as Handler
    );
  }
  return appPromise;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const app = await getApp();
  app(req, res);
}
