async function req(
  path,
  { method = "GET", body, auth = true, headers: extraHeaders = {} } = {},
  retry = true
) {
  if (!API_BASE) {
    throw new Error("API base URL not configured");
  }

  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetchWithTimeout(joinUrl(API_BASE, path), {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    /* ---------- TOKEN REFRESH (SAFE VERSION) ---------- */
    if (res.status === 401 && auth && retry && getToken()) {
      try {
        const refreshRes = await fetchWithTimeout(
          joinUrl(API_BASE, "/api/auth/refresh"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
            credentials: "include",
          }
        );

        const refreshData = await refreshRes.json().catch(() => ({}));

        if (refreshRes.ok && refreshData.token) {
          setToken(refreshData.token);
          if (refreshData.user) saveUser(refreshData.user);

          return req(
            path,
            { method, body, auth, headers: extraHeaders },
            false
          );
        }
      } catch {
        // ignore refresh failure
      }

      // 🔥 DO NOT auto clear token here
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        `Request failed (${res.status})`
      );
    }

    return data;
  } catch (err) {
    if (err.message === "Request timeout") {
      throw new Error("Network timeout. Please try again.");
    }

    throw new Error(
      err.message || "Network error. Please check connection."
    );
  }
}
