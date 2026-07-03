import { LocalReviewPlugin } from "./plugin/plugin.ts";
import { runSidecar } from "./server/main.ts";

if (process.argv.includes("--local-review-server")) {
  runSidecar().catch((error) => {
    console.error(error?.stack || String(error));
    process.exit(1);
  });
}

export { LocalReviewPlugin };
export { LocalReviewPlugin as OpenReviewPlugin };
export const server = LocalReviewPlugin;
export default { server: LocalReviewPlugin };
