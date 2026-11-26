// Custom Nitro renderer for Vercel builds (see vite.config.ts).
//
// Routes all requests to the Vinext RSC service instead of the SSR
// service. Nitro default SSR renderer calls the SSR entry, whose
// fetch handler calls the RSC entry default export as a function —
// but that default is an object with a `fetch` method, not a function —
// so every request fails with
// "TypeError: (intermediate value).default is not a function".
// The RSC entry itself is a valid `{ fetch(request) }` handler, so
// delegating to it directly avoids that mismatch.
import { fetchService } from "nitro/services";

export default function rscRenderer(event: { req: Request }) {
  return fetchService("rsc", event.req);
}
