import axios from 'axios';

export const API_BASE = 'http://localhost:8010';
export const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function apiRequest(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadFile(path, formData) {
  const res = await fetch(API_BASE + path, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  if (path.startsWith('/crop_images/')) return path;
  if (path.startsWith('/')) return path;
  return `/crop_images/${path}`;
}
