const VERSION = "memories-pwa-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          "<!doctype html><title>Memories</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><body style=\"margin:0;background:#0b1020;color:#f8fafc;font-family:system-ui,sans-serif;display:grid;min-height:100vh;place-items:center;padding:24px;text-align:center\"><main><h1>Memories needs a connection</h1><p style=\"color:#94a3b8\">Reconnect to open your diary, Vault, and messages.</p></main></body>",
          {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "X-Memories-Service-Worker": VERSION,
            },
          }
        )
    )
  );
});
