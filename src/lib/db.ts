import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

type DevPlatformProxy = {
	env: CloudflareEnv;
	dispose: () => Promise<void>;
};

let devPlatformProxy: DevPlatformProxy | undefined;

async function getDevPlatformProxy(): Promise<DevPlatformProxy> {
	if (!devPlatformProxy) {
		// Match OpenNext's pattern so wrangler is not bundled into the app.
		const { getPlatformProxy } = await import(
			/* webpackIgnore: true */ `${"__wrangler".replaceAll("_", "")}`
		);
		devPlatformProxy = await getPlatformProxy({ envFiles: [] });
	}

	return devPlatformProxy as DevPlatformProxy;
}

export async function getDb() {
	const { env } = await getCloudflareContext({ async: true });
	if (env.DB) {
		return env.DB;
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error('D1 database binding "DB" is not available in production.');
	}

	// During `next dev`, server actions can run before the Cloudflare context
	// includes D1 bindings. Fall back to wrangler's local platform proxy.
	const proxy = await getDevPlatformProxy();
	if (!proxy.env.DB) {
		throw new Error(
			'D1 database binding "DB" is not available. Check wrangler.jsonc and restart the dev server.',
		);
	}

	return proxy.env.DB;
}
