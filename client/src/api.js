const BASE = "http://localhost:5000";    // ← full URL, no proxy needed

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("cctv_token");

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("cctv_token");
    localStorage.removeItem("cctv_user");
    window.location.href = "/login";
  }

  return res.json();
}