/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `krillshield-${version}`;
const NAV_FALLBACK = '/offline.html';

const ASSETS = [...build, ...files];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

async function roupaDeConexao(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	try {
		const res = await fetch(request);
		if (res.ok || res.status === 404) cache.put(request, res.clone());
		return res;
	} catch {
		const cached = await cache.match(request);
		if (cached) return cached;
		if (request.mode === 'navigate') {
			const fallback = await cache.match(NAV_FALLBACK);
			if (fallback) return fallback;
		}
		return new Response('Offline', { status: 503, statusText: 'Offline' });
	}
}

async function menosVeloz(revalidate: Request) {
	const cache = await caches.open(CACHE);
	const cached = await cache.match(revalidate);
	const rede = fetch(revalidate)
		.then((res) => {
			if (res.ok || res.status === 404) cache.put(revalidate, res.clone());
			return res;
		})
		.catch(() => cached);
	return cached ?? (await rede);
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	if (url.origin !== self.location.origin) return;
	if (request.method !== 'GET') return;

	if (url.pathname.startsWith('/api/auth')) return;

	if (url.pathname.startsWith('/api/')) {
		event.respondWith(roupaDeConexao(request));
		return;
	}

	if (request.mode === 'navigate') {
		event.respondWith(roupaDeConexao(request));
		return;
	}

	event.respondWith(menosVeloz(request));
});