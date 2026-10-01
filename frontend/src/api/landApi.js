const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function createLand(payload) {
  return request("/api/v1/lands", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function searchLands(payload) {
  return request("/api/v1/lands/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    const error = new Error(body?.message || "Request failed");

    error.status = response.status;
    error.body = body;

    throw error;
  }

  return body;
}

async function readResponseBody(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}
