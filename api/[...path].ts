import app from '../server/src/index.js';

type MutableUrlRequest = {
  url?: string;
};

export default function handler(req: MutableUrlRequest, res: unknown) {
  if (typeof req.url === 'string' && !req.url.startsWith('/api')) {
    const normalizedPath = req.url.startsWith('/') ? req.url : `/${req.url}`;
    req.url = `/api${normalizedPath}`;
  }

  return app(req as any, res as any);
}
