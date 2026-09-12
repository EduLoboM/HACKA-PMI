import type { Handle } from '@sveltejs/kit';
import { obterUsuarioDaSessao } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = obterUsuarioDaSessao(event.cookies);
	return resolve(event);
};