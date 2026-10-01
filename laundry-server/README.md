# FreshFold Laundry – Node.js `http` Server

A small, dependency-free web server built with Node.js's core **`http`** module. It routes
requests to different HTML pages, styles them with **Tailwind CSS**, handles a form
submission, and serves a custom **404** page for unknown routes.

## Features

- Pure Node.js – **no npm dependencies** (ES modules, `node:` imports)
- Routing table with per-method handlers (`GET`, `POST`)
- Shared HTML layout + page views (DRY templates, cached in memory)
- Asynchronous file reading with `fs/promises` and `async/await`
- Correct HTTP status codes: `200`, `301`, `400`, `404`, `405`, `413`, `500`
- Custom **404** and **500** pages
- Tailwind CSS styling (via CDN)
- Extra routes: `/services`, `/pricing`, `POST /contact`, JSON `/health`
- Basic safety: HTML-escaping of user input, request body size limit, graceful shutdown

## Requirements

- **Node.js 20.11 or newer** (uses `import.meta.dirname`). Check with `node -v`.
- An internet connection in the browser (Tailwind is loaded from its CDN).

## Getting Started

```bash
cd laundry-server
npm start            # or: node server.js
```

Open <http://localhost:3000> – it redirects to `/home`.

For auto-restart while editing: `npm run dev` (uses `node --watch`).

### Configuration

| Variable | Default     | Description                |
|----------|-------------|----------------------------|
| `PORT`   | `3000`      | Port the server listens on |
| `HOST`   | `localhost` | Interface to bind to       |

```bash
PORT=8080 npm start
```

## Routes

| Method | Path        | Status | Description                                   |
|--------|-------------|--------|-----------------------------------------------|
| GET    | `/`         | 301    | Redirects to `/home`                          |
| GET    | `/home`     | 200    | Home page                                     |
| GET    | `/about`    | 200    | About page                                    |
| GET    | `/contact`  | 200    | Contact page with a form                      |
| POST   | `/contact`  | 200/400/413 | Handles the form (thank-you, validation error, or too-large body) |
| GET    | `/services` | 200    | Services page                                 |
| GET    | `/pricing`  | 200    | Pricing page                                  |
| GET    | `/health`   | 200    | JSON health check (status, uptime, Node version) |
| any    | other path  | 404    | Custom "Page Not Found" page                  |
| other  | known path  | 405    | Method Not Allowed (with `Allow` header)      |

Trailing slashes are ignored (`/about/` works like `/about`).

## Project Structure

```
laundry-server/
├── server.js          # Entry point: creates the server, logging, error fallback, shutdown
├── package.json
├── README.md
├── src/
│   ├── config.js      # PORT, HOST and limits
│   ├── router.js      # Route table + dispatcher (404 / 405 / POST handling)
│   └── render.js      # View loader, layout wrapper, HTML/JSON response helpers
└── views/
    ├── layout.html    # Shared header, nav, footer, Tailwind CDN script
    ├── home.html  about.html  contact.html  services.html  pricing.html
    └── 404.html  500.html
```

## How It Works

1. `server.js` calls `http.createServer()` and passes each request to `handleRequest()`.
2. `router.js` parses the URL, normalises the path, and looks it up in the `routes` object.
   - Path not found → **404** page.
   - Path found but method not supported → **405**.
   - Otherwise the matching `async` handler runs.
3. Handlers call `renderView()` which reads `views/<name>.html` (cached after first read),
   injects it into `layout.html` (`{{title}}`, `{{content}}`, active nav link), and sends it
   with `sendHtml()`.
4. Any thrown error is caught in `server.js` and answered with the **500** page.

## Testing

In a browser, visit each route. From a terminal:

```bash
curl -i http://localhost:3000/home            # 200 + HTML
curl -i http://localhost:3000/                # 301 -> /home
curl -i http://localhost:3000/nope            # 404 custom page
curl -i -X DELETE http://localhost:3000/home  # 405 + Allow header
curl -i http://localhost:3000/health          # 200 + JSON
curl -i -X POST -d "name=Asha&email=a@b.com&message=Hi" http://localhost:3000/contact   # 200
curl -i -X POST -d "name=Asha" http://localhost:3000/contact                           # 400
```

## Adding a New Page

1. Create `views/faq.html` (just the page content – the layout is added automatically).
2. Register it in `src/router.js`:
   ```js
   '/faq': { GET: page('faq', 'FAQ') },
   ```
3. (Optional) add a link in `views/layout.html`.

## Notes on Tailwind CSS

Tailwind is loaded with the **Play CDN** script in `layout.html`. It is perfect for learning
and prototypes. For production, install Tailwind via the CLI, generate a static CSS file,
and serve it as a static asset instead of the CDN script.

## Troubleshooting

- **`EADDRINUSE`** – the port is busy; run with another one: `PORT=3001 npm start`.
- **Unstyled pages** – the browser couldn't reach the Tailwind CDN (check your connection).
- **`import.meta.dirname` undefined** – upgrade Node.js to 20.11+.

### Made for Learning & Assignment Purpose

### Code by Sukant C.
 
