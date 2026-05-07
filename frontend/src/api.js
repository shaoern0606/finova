export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }
  return response.json();
}

export function post(path, body) {
  return api(path, { method: "POST", body: JSON.stringify(body) });
}

