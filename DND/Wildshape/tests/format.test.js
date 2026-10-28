import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, formatMarkdown } from "../src/ui/format.js";

test("escapeHtml", () => {
  assert.equal(escapeHtml(`<b class="x">'&'</b>`), "&lt;b class=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/b&gt;");
  assert.equal(escapeHtml(undefined), "");
});

test("markdown from the API", () => {
  assert.equal(formatMarkdown("_Trigger:_ The octopus takes damage. _Response:_ Ink."), "<em>Trigger:</em> The octopus takes damage. <em>Response:</em> Ink.");
  assert.equal(formatMarkdown("snake_case_word stays"), "snake_case_word stays");
  assert.equal(formatMarkdown("<script>"), "&lt;script&gt;");
});

test("markdown in notes", () => {
  assert.equal(formatMarkdown("**a** *b*\nc"), "<strong>a</strong> <em>b</em><br>c");
  assert.equal(formatMarkdown("**a**", true), '<span class="notes-highlight"><strong>a</strong></span>');
  assert.equal(formatMarkdown("***a***", true), '<span class="notes-highlight"><strong><em>a</em></strong></span>');
});
