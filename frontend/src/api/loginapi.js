const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

// ---------------------------------------------
// Login / Auth API
// ---------------------------------------------

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

export async function forgotUsername(email) {
  const res = await fetch(`${API_BASE}/auth/forgot-username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
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

export async function forgotPassword(email) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
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

export async function verifyToken(token) {
  const res = await fetch(`${API_BASE}/auth/verify-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
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

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
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

// ---------------------------------------------
// Export default
// ---------------------------------------------
export default {
  login,
  verify2FA,
  forgotUsername,
  forgotPassword,
  verifyToken,
  resetPassword,
};
