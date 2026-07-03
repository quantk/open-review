import test from "node:test";
import assert from "node:assert/strict";
import { renderAppHTML } from "../src/ui/html.ts";

test("renderAppHTML embeds syntactically valid browser script", () => {
  const html = renderAppHTML();
  const start = html.indexOf("<script>");
  const end = html.lastIndexOf("</script>");
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.doesNotThrow(() => new Function(html.slice(start + "<script>".length, end)));
});

test("renderAppHTML includes Go syntax highlighting rules", () => {
  const html = renderAppHTML();
  assert.match(html, /go:\s*\[/);
  assert.match(html, /'func'/);
  assert.match(html, /'string'/);
  assert.match(html, /tok-keyword/);
});

test("renderAppHTML preserves highlighter regular expressions", () => {
  const html = renderAppHTML();
  assert.ok(html.includes("const number = /^\\d+(?:\\.\\d+)?/.exec(rest);"));
  assert.ok(html.includes("const ident = /^[A-Za-z_$][\\w$]*/.exec(rest);"));
});

test("renderAppHTML does not embed bootstrap tokens", () => {
  const html = renderAppHTML();
  assert.equal(html.includes("token-test"), false);
  assert.equal(html.includes("set-cookie"), false);
  assert.equal(html.includes("review_token"), false);
});

test("renderAppHTML includes collapsible sidebars", () => {
  const html = renderAppHTML();
  assert.ok(html.includes('id="toggle-left"'));
  assert.ok(html.includes('id="toggle-right"'));
  assert.ok(html.includes("localReviewLeftCollapsed"));
  assert.ok(html.includes("localReviewRightCollapsed"));
});
