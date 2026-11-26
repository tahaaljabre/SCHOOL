// Shim for the `cloudflare:workers` module, used ONLY when building for
// Vercel via Nitro (see vite.config.ts). On Cloudflare Workers the real
// module provides the DB (D1) and MEDIA (R2) bindings; Vercel has no
// equivalent bindings, so they are absent here and the app database
// code fails with its own clear "database unavailable" errors instead
// of the build failing on an unresolvable import.
//
// The Cloudflare Vite plugin also re-exports WorkerEntrypoint,
// DurableObject and WorkflowEntrypoint from this module, so stub classes
// are provided for those as well. Nothing instantiates them on Vercel.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const env: { DB?: any; MEDIA?: any; [key: string]: any } = {};

export class WorkerEntrypoint {}

export class DurableObject {}

export class WorkflowEntrypoint {}
