import { nitro } from "nitro/vite";
import { sites } from "@openai/sites-vite-plugin";
import { fileURLToPath } from "node:url";
import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Vercel builds (via Nitro) have no Cloudflare Workers runtime, so the
  // `cloudflare:workers` import used for the D1/R2 bindings cannot resolve
  // there. Only for Vercel builds, point it at a local shim (which leaves
  // DB/MEDIA undefined) and add the Nitro plugin; Cloudflare builds keep
  // using the real module and are unaffected. Vercel sets VERCEL=1 in CI;
  // NITRO_PRESET=vercel covers local verification builds.
  const isVercelBuild =
    process.env.VERCEL === "1" || process.env.NITRO_PRESET === "vercel";

  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      ...(isVercelBuild
        ? [
            nitro({
              // Route requests to the Vinext RSC service (see
              // lib/nitro-renderer.ts) instead of Nitro default SSR
              // renderer, whose handler cannot call this app RSC entry.
              renderer: { handler: "./lib/nitro-renderer.ts" },
            }),
          ]
        : []),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
    ...(isVercelBuild
      ? {
          resolve: {
            alias: {
              "cloudflare:workers": fileURLToPath(
                new URL("./lib/cloudflare-workers-env.ts", import.meta.url),
              ),
            },
          },
        }
      : {}),
  };
});
