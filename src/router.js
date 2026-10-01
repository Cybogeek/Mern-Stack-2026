// src/router.js - route table + dispatcher (404 / 405 handling included).
import { MAX_BODY_BYTES } from './config.js';
import { escapeHtml, renderLayout, renderView, sendHtml, sendJson } from './render.js';

const startTime = Date.now();

/** Read a request body asynchronously, enforcing a size limit. */
async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const err = new Error('Payload too large');
      err.status = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/** Simple page route factory: GET -> render views/<view>.html with 200. */
const page = (view, title, active = view) => async (req, res) =>
  sendHtml(res, 200, await renderView(view, { title, active }));

// Route table, keyed by path, then by HTTP method.
const routes = {
  '/home': { GET: page('home', 'Home') },
  '/about': { GET: page('about', 'About Us') },
  '/services': { GET: page('services', 'Services') },
  '/pricing': { GET: page('pricing', 'Pricing') },

  '/contact': {
    GET: page('contact', 'Contact'),

    // Handles the contact form submission.
    async POST(req, res) {
      let form;
      try {
        form = new URLSearchParams(await readBody(req));
      } catch (err) {
        const body = `<section class="max-w-xl mx-auto text-center py-16">
          <h1 class="text-3xl font-bold text-red-600">${err.status} - Request rejected</h1>
          <p class="mt-3 text-slate-600">${escapeHtml(err.message)}</p></section>`;
        return sendHtml(res, err.status || 400, await renderLayout({ title: 'Error', active: 'contact', body }));
      }

      const name = form.get('name')?.trim();
      const email = form.get('email')?.trim();
      const message = form.get('message')?.trim();

      if (!name || !email || !message) {
        const body = `<section class="max-w-xl mx-auto text-center py-16">
          <h1 class="text-3xl font-bold text-red-600">Missing information</h1>
          <p class="mt-3 text-slate-600">Please fill in your name, email and message.</p>
          <a href="/contact" class="inline-block mt-6 rounded-lg bg-sky-600 px-5 py-2 text-white hover:bg-sky-700">Go back</a></section>`;
        return sendHtml(res, 400, await renderLayout({ title: 'Missing information', active: 'contact', body }));
      }

      const body = `<section class="max-w-xl mx-auto text-center py-16">
        <h1 class="text-3xl font-bold text-emerald-600">Thank you, ${escapeHtml(name)}!</h1>
        <p class="mt-3 text-slate-600">We received your message and will reply to <strong>${escapeHtml(email)}</strong> soon.</p>
        <a href="/home" class="inline-block mt-6 rounded-lg bg-sky-600 px-5 py-2 text-white hover:bg-sky-700">Back to home</a></section>`;
      sendHtml(res, 200, await renderLayout({ title: 'Message sent', active: 'contact', body }));
    },
  },

  // JSON health-check endpoint.
  '/health': {
    GET: async (req, res) =>
      sendJson(res, 200, {
        status: 'ok',
        uptimeSeconds: Math.round((Date.now() - startTime) / 1000),
        node: process.version,
        timestamp: new Date().toISOString(),
      }),
  },
};

export async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  // Normalise trailing slash: "/about/" -> "/about"
  const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;

  // Redirect the root to /home (301 = permanent redirect).
  if (pathname === '/') {
    res.writeHead(301, { Location: '/home' });
    return res.end();
  }

  const methods = routes[pathname];

  // Unknown path -> custom 404 page.
  if (!methods) {
    return sendHtml(res, 404, await renderView('404', { title: 'Page Not Found' }));
  }

  // HEAD behaves like GET (Node omits the body automatically).
  const method = req.method === 'HEAD' ? 'GET' : req.method;
  const handler = methods[method];

  // Known path, unsupported method -> 405 with an Allow header.
  if (!handler) {
    res.writeHead(405, {
      Allow: Object.keys(methods).join(', '),
      'Content-Type': 'text/plain; charset=utf-8',
    });
    return res.end('405 - Method Not Allowed');
  }

  await handler(req, res);
}
