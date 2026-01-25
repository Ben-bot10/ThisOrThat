const API_BASE = window.API_BASE || "http://localhost:3000";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["x-user-id"] = JSON.parse(localStorage.getItem("user") || "{}").id;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed." }));
    throw new Error(error.error || "Request failed.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  getPolls: () => request("/api/polls"),
  getPoll: (id) => request(`/api/polls/${id}`),
  vote: (id, option) =>
    request(`/api/polls/${id}/vote`, { method: "POST", body: JSON.stringify({ option }) }),
  addComment: (id, body) =>
    request(`/api/polls/${id}/comments`, { method: "POST", body: JSON.stringify({ body }) }),
  getMe: () => request("/api/users/me"),
  getHistory: () => request("/api/users/me/history"),
  createPoll: (payload) => request("/api/polls", { method: "POST", body: JSON.stringify(payload) }),
  getPendingPolls: () => request("/api/admin/polls/pending"),
  approvePoll: (id, status) =>
    request(`/api/admin/polls/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ status })
    }),
  deletePoll: (id) => request(`/api/admin/polls/${id}`, { method: "DELETE" }),
  banUser: (id, banned) =>
    request(`/api/admin/users/${id}/ban`, { method: "POST", body: JSON.stringify({ banned }) }),
  getAnalytics: () => request("/api/admin/analytics"),
  getUsers: () => request("/api/admin/users")
};
