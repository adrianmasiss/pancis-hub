/*
 * Service worker de Pancis Hub.
 *
 * Estrategia deliberadamente conservadora (docs/SECURITY.md):
 * - NUNCA cachea peticiones a Supabase ni datos de usuario.
 * - Navegaciones: red primero; si no hay conexion, pagina /offline.
 * - Estaticos inmutables (_next/static, iconos, logos): cache primero.
 */
const CACHE_NAME = "pancis-hub-v1";
const PRECACHE = [
  "/offline",
  "/logo.png",
  "/logo-dark.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isSupabaseRequest(url) {
  return (
    url.hostname.endsWith(".supabase.co") ||
    url.port === "54321" ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/storage/")
  );
}

function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/logo.png" ||
    url.pathname === "/logo-dark.png"
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isSupabaseRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match("/offline")
          .then(
            (cached) => cached ?? new Response("Sin conexion", { status: 503 }),
          ),
      ),
    );
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
