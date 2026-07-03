import test from "node:test";
import assert from "node:assert/strict";
import { renderAppHTML } from "../src/ui/html.ts";
import { APP_SCRIPT, APP_STYLES } from "../src/ui/generated/assets.ts";

test("renderAppHTML embeds syntactically valid browser script", () => {
  const html = renderAppHTML();
  const start = html.indexOf("<script>");
  const end = html.lastIndexOf("</script>");
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.doesNotThrow(() => new Function(html.slice(start + "<script>".length, end)));
});

test("renderAppHTML includes Go syntax highlighting rules", () => {
  assert.match(APP_SCRIPT, /go:\[/);
  assert.ok(APP_SCRIPT.includes("func"));
  assert.ok(APP_SCRIPT.includes("string"));
  assert.ok(APP_SCRIPT.includes("tok-keyword"));
});

test("renderAppHTML preserves highlighter regular expressions", () => {
  assert.ok(APP_SCRIPT.includes("/^\\d+(?:\\.\\d+)?/"));
  assert.ok(APP_SCRIPT.includes("/^[A-Za-z_$][\\w$]*/"));
});

test("renderAppHTML does not embed bootstrap tokens", () => {
  const html = renderAppHTML();
  assert.equal(html.includes("token-test"), false);
  assert.equal(html.includes("set-cookie"), false);
  assert.equal(html.includes("review_token"), false);
});

test("renderAppHTML includes collapsible sidebars", () => {
  assert.ok(APP_SCRIPT.includes("toggle-left"));
  assert.ok(APP_SCRIPT.includes("toggle-right"));
  assert.ok(APP_SCRIPT.includes("localReviewLeftCollapsed"));
  assert.ok(APP_SCRIPT.includes("localReviewRightCollapsed"));
  assert.ok(APP_STYLES.includes(".layout-grid.left-collapsed"));
  assert.ok(APP_STYLES.includes(".layout-grid.right-collapsed"));
});

test("renderAppHTML mounts compiled React app", () => {
  const html = renderAppHTML();
  assert.ok(html.includes('id="root"'));
  assert.ok(APP_SCRIPT.includes("react-tailwind"));
});

test("renderAppHTML includes resilient file sidebar styles", () => {
  assert.ok(APP_SCRIPT.includes("file-name"));
  assert.ok(APP_SCRIPT.includes("file-path"));
  assert.ok(APP_STYLES.includes("overflow-wrap:anywhere"));
  assert.ok(APP_STYLES.includes("-webkit-line-clamp:2"));
});
