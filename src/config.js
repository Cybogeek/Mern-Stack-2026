// src/config.js - central configuration (override with environment variables).
export const PORT = Number(process.env.PORT) || 3001;
export const HOST = process.env.HOST || 'localhost';
export const MAX_BODY_BYTES = 10 * 1024; // reject POST bodies larger than 10 KB
