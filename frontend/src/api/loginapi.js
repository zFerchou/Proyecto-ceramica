// Simple login API wrapper for auth endpoints
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

export async function login(payload) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`);
    return data;
  } catch (err) {
    // If response not JSON, throw text
    throw new Error(text || err.message);
  }
}

export async function verify2FA(payload) {
  const res = await fetch(`${API_BASE}/auth/verify2FA`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`);
    return data;
  } catch (err) {
    throw new Error(text || err.message);
  }
}

const loginapi = { login, verify2FA };
export default loginapi;
