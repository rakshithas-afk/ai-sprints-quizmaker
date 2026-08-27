import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

void initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
	// Pin the workspace root so a stray lockfile elsewhere on the machine cannot
	// make Turbopack infer the wrong project directory.
	turbopack: {
		root: __dirname,
	},
};

export default nextConfig;
