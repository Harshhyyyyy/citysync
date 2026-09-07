const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const r = await fetch(`${API_BASE}${path}`, options);
  if (!r.ok) {
    let message = `Request failed (${r.status})`;
    try {
      const body = await r.json();
      message = body.detail || message;
    } catch {}
    throw new Error(message);
  }
  return r.json();
}

export function apiHealth() {
  return request("/health");
}

export function getIssues() {
  return request("/issues");
}

export function getMapData() {
  return request("/map/data");
}

export function getLayerSummary() {
  return request("/map/layers");
}

export function createIssue(payload) {
  return request("/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getAnalytics() {
  return request("/analytics/summary");
}
