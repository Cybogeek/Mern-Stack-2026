// src/render.js - loads HTML views asynchronously and wraps them in the shared layout.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const VIEWS_DIR = path.join(import.meta.dirname, '..', 'views');
const NAV_ITEMS = ['home', 'about', 'services', 'pricing', 'contact'];
const cache = new Map(); // simple in-memory template cache

async function readTemplate(name) {
  if (!cache.has(name)) {
    cache.set(name, await readFile(path.join(VIEWS_DIR, `${name}.html`), 'utf8'));
  }
  return cache.get(name);
}

/** Escape user-supplied text before putting it into HTML (prevents XSS). */
export function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Wrap an HTML fragment in layout.html. `active` highlights a nav link. */
export async function renderLayout({ title, active = '', body }) {
  let html = await readTemplate('layout');
  html = html.replace('{{title}}', () => title).replace('{{content}}', () => body);
  for (const item of NAV_ITEMS) {
    const cls = item === active ? 'text-sky-600 font-semibold' : 'text-slate-600';
    html = html.replaceAll(`{{nav_${item}}}`, cls);
  }
  return html;
}

/** Load views/<name>.html and render it inside the layout. */
export async function renderView(name, { title, active = '' }) {
  const body = await readTemplate(name);
  return renderLayout({ title, active, body });
}

/** Send an HTML response. */
export function sendHtml(res, status, html) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
  });
  res.end(html);
}

/** Send a JSON response. */
export function sendJson(res, status, data) {
  const json = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}
