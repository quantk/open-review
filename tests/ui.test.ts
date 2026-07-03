import test from "node:test";
import assert from "node:assert/strict";
import { renderAppHTML } from "../src/ui/html.ts";

test("renderAppHTML embeds syntactically valid browser script", () => {
  const html = renderAppHTML("token-test");
  const start = html.indexOf("<script>");
  const end = html.lastIndexOf("</script>");
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.doesNotThrow(() => new Function(html.slice(start + "<script>".length, end)));
});

test("renderAppHTML includes Go syntax highlighting rules", () => {
  const html = renderAppHTML("token-test");
  assert.match(html, /go:\s*\[/);
  assert.match(html, /'func'/);
  assert.match(html, /'string'/);
  assert.match(html, /tok-keyword/);
});

test("renderAppHTML preserves highlighter regular expressions", () => {
  const html = renderAppHTML("token-test");
  assert.ok(html.includes("const number = /^\\d+(?:\\.\\d+)?/.exec(rest);"));
  assert.ok(html.includes("const ident = /^[A-Za-z_$][\\w$]*/.exec(rest);"));
});
