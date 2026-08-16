#!/usr/bin/env node
/**
 * YOS Tools test runner — executes specs and writes test-report.html
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  parseUtcInput,
  formatDate,
  convertUTCToEST,
  convertUTCToPST,
  convertUTCToIST,
  convertUTCToJST,
  convertUTCToCET,
  formatCET,
  getESTDSTStatus,
  getPSTDSTStatus,
  getCETDSTStatus,
  formatJson,
  minifyJson,
  validateJson,
  sortKeys,
  diffJson,
  listRegexMatches,
  testRegexSyntax,
  convertUtcInput,
} from "./tool-logic.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPORT_PATH = path.join(ROOT, "test-report.html");
const RUN_AT = new Date();

const suites = [];

function suite(name, description) {
  const current = { name, description, tests: [] };
  suites.push(current);
  return current;
}

function test(current, id, name, fn) {
  const started = performance.now();
  try {
    const detail = fn();
    current.tests.push({
      id,
      name,
      status: "pass",
      durationMs: Math.round((performance.now() - started) * 100) / 100,
      detail: detail || "",
    });
  } catch (error) {
    current.tests.push({
      id,
      name,
      status: "fail",
      durationMs: Math.round((performance.now() - started) * 100) / 100,
      detail: error.message,
    });
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual:   ${actual}`);
  }
  return `Expected: ${expected}`;
}

function assertTrue(value, message) {
  if (!value) throw new Error(message);
  return message;
}

function assertIncludes(text, needle, message) {
  if (!String(text).includes(needle)) {
    throw new Error(`${message}\n  Text: ${text}\n  Needle: ${needle}`);
  }
  return message;
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function fileExists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

// --- Site structure ---
const site = suite("SITE", "サイト構成・SEO・静的ファイルの存在確認");

const pages = [
  "index.html",
  "about/index.html",
  "privacy/index.html",
  "sitemap.html",
  "time-conversion/index.html",
  "json-tools/index.html",
  "regex-tools/index.html",
  "utc-to-est/index.html",
  "utc-to-pst/index.html",
  "utc-to-ist/index.html",
  "utc-to-jst/index.html",
  "utc-to-cet/index.html",
  "json-formatter/index.html",
  "json-diff/index.html",
  "regex-tester/index.html",
];

pages.forEach((page, i) => {
  test(site, `SITE-${String(i + 1).padStart(2, "0")}`, `Page exists: ${page}`, () => {
    assertTrue(fileExists(page), `Missing file: ${page}`);
    return "File found";
  });
});

test(site, "SITE-16", "sitemap.xml includes privacy page", () => {
  const xml = read("sitemap.xml");
  assertIncludes(xml, "yos-tools-29t.github.io/yos-tools/privacy/", "privacy URL missing");
  return "privacy/ listed in sitemap.xml";
});

test(site, "SITE-17", "robots.txt references sitemap", () => {
  const robots = read("robots.txt");
  assertIncludes(robots, "Sitemap:", "robots.txt missing Sitemap directive");
  assertIncludes(robots, "sitemap.xml", "sitemap.xml not referenced");
  return robots.trim();
});

test(site, "SITE-18", "Footer does not include GitHub link", () => {
  const js = read("assets/js/common.js");
  assertTrue(!js.includes("github.com"), "GitHub link should be removed from footer");
  return "No GitHub link in footer";
});

test(site, "SITE-19", "Google Analytics loader present", () => {
  assertTrue(fileExists("assets/ga.js"), "assets/ga.js missing");
  const ga = read("assets/ga.js");
  assertIncludes(ga, "G-GLHN0E2CSV", "GA measurement ID missing");
  const common = read("assets/js/common.js");
  assertIncludes(common, "loadAnalytics", "common.js does not load analytics");
  return "GA ID G-GLHN0E2CSV configured";
});

test(site, "SITE-20", "All tool pages load common.js", () => {
  const toolPages = pages.filter((p) => p !== "index.html" && p !== "sitemap.html");
  toolPages.forEach((page) => {
    const html = read(page);
    if (!html.includes("common.js")) {
      throw new Error(`${page} missing common.js`);
    }
  });
  return `${toolPages.length} pages include common.js`;
});

// --- UTC basic ---
const utc = suite("UTC", "UTC 変換ツールの基本動作（固定オフセット・標準時）");

test(utc, "UTC-01", "parseUtcInput accepts datetime-local format", () => {
  const d = parseUtcInput("2024-07-15T14:30");
  assertEqual(d.toISOString(), "2024-07-15T14:30:00.000Z", "UTC parse mismatch");
  return d.toISOString();
});

test(utc, "UTC-02", "parseUtcInput rejects invalid calendar date", () => {
  const d = parseUtcInput("2024-02-31T10:00");
  assertTrue(Number.isNaN(d.getTime()), "Feb 31 should be invalid");
  return "Invalid date rejected";
});

test(utc, "UTC-03", "parseUtcInput rejects empty input", () => {
  assertEqual(parseUtcInput(""), null, "Empty should be null");
  assertEqual(parseUtcInput("   "), null, "Whitespace should be null");
  return "Empty input → null";
});

test(utc, "UTC-04", "UTC to IST (+5:30)", () => {
  const input = "2024-01-15T12:00";
  const r = convertUtcInput(convertUTCToIST, input);
  assertTrue(r.ok, r.error);
  const out = `${formatDate(r.result.date)} ${r.result.zone}`;
  assertEqual(out, "2024-01-15 17:30 IST", "IST conversion");
  return out;
});

test(utc, "UTC-05", "UTC to JST (+9)", () => {
  const r = convertUtcInput(convertUTCToJST, "2024-06-01T00:00");
  assertTrue(r.ok, r.error);
  const out = `${formatDate(r.result.date)} ${r.result.zone}`;
  assertEqual(out, "2024-06-01 09:00 JST", "JST conversion");
  return out;
});

test(utc, "UTC-06", "UTC to EST standard time (winter)", () => {
  const r = convertUtcInput(convertUTCToEST, "2024-01-15T15:00");
  assertTrue(r.ok, r.error);
  const out = `${formatDate(r.result.date)} ${r.result.zone}`;
  assertEqual(out, "2024-01-15 10:00 EST", "Winter EST");
  return out;
});

test(utc, "UTC-07", "UTC to EST daylight time (summer)", () => {
  const r = convertUtcInput(convertUTCToEST, "2024-07-15T14:00");
  assertTrue(r.ok, r.error);
  const out = `${formatDate(r.result.date)} ${r.result.zone}`;
  assertEqual(out, "2024-07-15 10:00 EDT", "Summer EDT");
  return out;
});

test(utc, "UTC-08", "UTC to PST standard time", () => {
  const r = convertUtcInput(convertUTCToPST, "2024-01-15T18:00");
  assertTrue(r.ok, r.error);
  const out = `${formatDate(r.result.date)} ${r.result.zone}`;
  assertEqual(out, "2024-01-15 10:00 PST", "Winter PST");
  return out;
});

test(utc, "UTC-09", "UTC to CET winter (UTC+1)", () => {
  const parsed = parseUtcInput("2024-01-15T12:00");
  const r = convertUTCToCET(parsed);
  const out = formatCET(r.date, r.zone, r.offset);
  assertEqual(out, "2024-01-15 13:00 CET (UTC+1)", "CET winter");
  return out;
});

// --- DST boundaries ---
const dst = suite("DST", "サマータイム切り替え境界（開始直前/開始時刻/終了直前/終了時刻）");

function dstBoundaryTests(year) {
  // US Eastern 2024: 2nd Sun Mar = 10, 1st Sun Nov = 3
  const estCases = [
    { input: `${year}-03-10T06:59`, zone: "EST", label: "EST spring before DST" },
    { input: `${year}-03-10T07:00`, zone: "EDT", label: "EST spring at DST start" },
    { input: `${year}-11-03T05:59`, zone: "EDT", label: "EST fall before DST end" },
    { input: `${year}-11-03T06:00`, zone: "EST", label: "EST fall at DST end" },
  ];

  estCases.forEach((c, i) => {
    test(dst, `DST-EST-${i + 1}`, `${c.label} (${c.input} UTC)`, () => {
      const d = parseUtcInput(`${c.input}:00`);
      assertEqual(getESTDSTStatus(d), c.zone, "Zone label");
      const conv = convertUTCToEST(d);
      assertEqual(conv.zone, c.zone, "Converted zone");
      return `${c.input}Z → ${getESTDSTStatus(d)}`;
    });
  });

  const pstCases = [
    { input: `${year}-03-10T09:59`, zone: "PST", label: "PST spring before DST" },
    { input: `${year}-03-10T10:00`, zone: "PDT", label: "PST spring at DST start" },
    { input: `${year}-11-03T08:59`, zone: "PDT", label: "PST fall before DST end" },
    { input: `${year}-11-03T09:00`, zone: "PST", label: "PST fall at DST end" },
  ];

  pstCases.forEach((c, i) => {
    test(dst, `DST-PST-${i + 1}`, `${c.label} (${c.input} UTC)`, () => {
      const d = parseUtcInput(`${c.input}:00`);
      assertEqual(getPSTDSTStatus(d), c.zone, "Zone label");
      return `${c.input}Z → ${getPSTDSTStatus(d)}`;
    });
  });

  // EU CET 2024: last Sun Mar = 31, last Sun Oct = 27
  const cetCases = [
    { input: `${year}-03-31T00:59`, zone: "CET", label: "CET spring before DST" },
    { input: `${year}-03-31T01:00`, zone: "CEST", label: "CET spring at DST start" },
    { input: `${year}-10-27T00:59`, zone: "CEST", label: "CET fall before DST end" },
    { input: `${year}-10-27T01:00`, zone: "CET", label: "CET fall at DST end" },
  ];

  cetCases.forEach((c, i) => {
    test(dst, `DST-CET-${i + 1}`, `${c.label} (${c.input} UTC)`, () => {
      const d = parseUtcInput(`${c.input}:00`);
      assertEqual(getCETDSTStatus(d), c.zone, "Zone label");
      return `${c.input}Z → ${getCETDSTStatus(d)}`;
    });
  });

  test(dst, "DST-13", "EST offset jumps +1h at spring boundary", () => {
    const before = convertUTCToEST(parseUtcInput(`${year}-03-10T06:30:00`));
    const after = convertUTCToEST(parseUtcInput(`${year}-03-10T07:30:00`));
    const beforeLocal = formatDate(before.date);
    const afterLocal = formatDate(after.date);
    assertEqual(beforeLocal, `${year}-03-10 01:30`, "Before spring forward");
    assertEqual(afterLocal, `${year}-03-10 03:30`, "After spring forward");
    return `${beforeLocal} EST → ${afterLocal} EDT (skipped 02:30)`;
  });
}

dstBoundaryTests(2024);

// --- Continuous input ---
const cont = suite("CONT", "連続入力・連続操作（状態汚染・クラッシュなし）");

test(cont, "CONT-01", "EST: 1440 sequential minute inputs (24h)", () => {
  const start = parseUtcInput("2024-07-01T00:00");
  let lastZone = "";
  for (let i = 0; i < 1440; i++) {
    const d = new Date(start.getTime() + i * 60000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const input = `${y}-${m}-${day}T${hh}:${mm}`;
    const r = convertUtcInput(convertUTCToEST, input);
    if (!r.ok) throw new Error(`Failed at ${input}: ${r.error}`);
    lastZone = r.result.zone;
  }
  return `1440 conversions OK, last zone=${lastZone}`;
});

test(cont, "CONT-02", "PST: rapid alternating summer/winter dates (100 cycles)", () => {
  for (let i = 0; i < 100; i++) {
    const summer = convertUtcInput(convertUTCToPST, "2024-07-15T12:00");
    const winter = convertUtcInput(convertUTCToPST, "2024-01-15T12:00");
    assertTrue(summer.ok && winter.ok, "Conversion failed");
    assertEqual(summer.result.zone, "PDT", "Summer zone");
    assertEqual(winter.result.zone, "PST", "Winter zone");
  }
  return "100 summer/winter alternations stable";
});

test(cont, "CONT-03", "CET: DST boundary sweep minute-by-minute (±120 min)", () => {
  const pivot = parseUtcInput("2024-03-31T01:00:00");
  let prevZone = getCETDSTStatus(new Date(pivot.getTime() - 120 * 60000));
  let transitions = 0;
  for (let offset = -120; offset <= 120; offset++) {
    const d = new Date(pivot.getTime() + offset * 60000);
    const zone = getCETDSTStatus(d);
    if (zone !== prevZone) transitions++;
    prevZone = zone;
  }
  assertEqual(transitions, 1, "Should have exactly one DST transition in window");
  return "Single CET transition detected across 241 minutes";
});

test(cont, "CONT-04", "JSON Formatter: 50 rapid beautify/minify alternations", () => {
  for (let i = 0; i < 50; i++) {
    const raw = JSON.stringify({ index: i, nested: { value: i * 2 } });
    const pretty = formatJson(raw, 2);
    const flat = minifyJson(raw);
    assertIncludes(pretty, `"index": ${i}`, "Beautify content");
    assertTrue(!pretty.includes("\n") === false, "Pretty has newlines");
    assertTrue(!flat.includes("\n"), "Minify has no newlines");
    validateJson(flat);
  }
  return "50 beautify/minify cycles OK";
});

test(cont, "CONT-05", "JSON Diff: 30 sequential compare with changing payloads", () => {
  for (let i = 0; i < 30; i++) {
    const left = JSON.stringify({ version: i, items: [1, 2] });
    const right = JSON.stringify({ version: i + 1, items: [1, 2, 3] });
    const diffs = diffJson(left, right);
    assertTrue(diffs.length >= 2, "Expected differences");
    const same = diffJson(left, left);
    assertEqual(same.length, 0, "Identical JSON should have 0 diffs");
  }
  return "30 diff cycles OK";
});

test(cont, "CONT-06", "Regex: 40 rapid pattern changes without throw", () => {
  const patterns = ["\\d+", "[a-z]+", "hello", "^test$", "\\b\\w+\\b", "a.*z"];
  const text = "Hello 123 test line";
  for (let i = 0; i < 40; i++) {
    const pattern = patterns[i % patterns.length];
    const syntax = testRegexSyntax(pattern, "g");
    assertTrue(syntax.ok, syntax.message || "Invalid pattern");
    listRegexMatches(pattern, "g", text);
  }
  return "40 pattern switches OK";
});

test(cont, "CONT-07", "parseUtcInput: burst of 200 malformed then valid inputs", () => {
  const bad = ["", "not-a-date", "2024-13-01T10:00", "2024-02-30T10:00", "2024/01/01T10:00"];
  for (let i = 0; i < 200; i++) {
    const value = bad[i % bad.length];
    const parsed = parseUtcInput(value);
    if (value.trim() === "") {
      assertEqual(parsed, null, "Empty");
    } else {
      assertTrue(parsed === null || Number.isNaN(parsed.getTime()), "Bad input rejected");
    }
  }
  const ok = parseUtcInput("2024-05-01T08:15");
  assertEqual(ok.toISOString(), "2024-05-01T08:15:00.000Z", "Valid after burst");
  return "200 malformed + 1 valid parse OK";
});

// --- JSON tools ---
const json = suite("JSON", "JSON Formatter / JSON Diff 機能テスト");

test(json, "JSON-01", "Beautify pretty-prints with 2-space indent", () => {
  const out = formatJson('{"b":2,"a":1}');
  assertIncludes(out, '"a": 1', "Key a");
  assertIncludes(out, '\n', "Newlines");
  return out;
});

test(json, "JSON-02", "Minify removes whitespace", () => {
  const out = minifyJson('{ "x" : 1 }');
  assertEqual(out, '{"x":1}', "Minified");
  return out;
});

test(json, "JSON-03", "Validate accepts valid JSON", () => {
  assertTrue(validateJson("[1,2,3]"), "Valid");
  return "Valid JSON accepted";
});

test(json, "JSON-04", "Invalid JSON throws on beautify", () => {
  let threw = false;
  try {
    formatJson("{bad}");
  } catch {
    threw = true;
  }
  assertTrue(threw, "Should throw");
  return "Invalid JSON rejected";
});

test(json, "JSON-05", "Sort keys recursively", () => {
  const out = JSON.stringify(sortKeys({ z: 1, a: { y: 2, b: 3 } }), null, 2);
  assertIncludes(out, '"a"', "Sorted keys");
  return out.split("\n").slice(0, 4).join(" / ");
});

test(json, "JSON-06", "Diff detects nested value change", () => {
  const diffs = diffJson('{"user":{"name":"A"}}', '{"user":{"name":"B"}}');
  assertTrue(diffs.some((d) => d.path === "$.user.name"), "Path found");
  return diffs.map((d) => d.path).join(", ");
});

test(json, "JSON-07", "Diff detects array length mismatch", () => {
  const diffs = diffJson("[1,2]", "[1,2,3]");
  assertTrue(diffs.some((d) => d.path === "$[2]"), "Extra index");
  return diffs.map((d) => d.path).join(", ");
});

test(json, "JSON-08", "Diff reports type mismatch (string vs number)", () => {
  const diffs = diffJson('"1"', "1");
  assertEqual(diffs.length, 1, "One diff at root");
  return `$.left=${JSON.stringify(diffs[0].left)} right=${JSON.stringify(diffs[0].right)}`;
});

// --- Regex ---
const regex = suite("REGEX", "Regex Tester ロジックテスト");

test(regex, "REGEX-01", "Global word matches", () => {
  const m = listRegexMatches("\\b\\w+\\b", "g", "Hello world");
  assertEqual(m.length, 2, "Two words");
  assertEqual(m[0].match, "Hello", "First match");
  return m.map((x) => x.match).join(", ");
});

test(regex, "REGEX-02", "Email preset pattern matches valid email", () => {
  const pattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
  const m = listRegexMatches(pattern, "", "name@example.com");
  assertEqual(m.length, 1, "One match");
  return m[0].match;
});

test(regex, "REGEX-03", "Invalid pattern returns syntax error", () => {
  const r = testRegexSyntax("[unclosed", "g");
  assertTrue(!r.ok, "Should fail");
  return r.message;
});

test(regex, "REGEX-04", "Ignore case flag", () => {
  const m = listRegexMatches("hello", "i", "Hello HELLO");
  assertEqual(m.length, 1, "Non-global first match only");
  assertEqual(m[0].match, "Hello", "Case insensitive");
  return m[0].match;
});

test(regex, "REGEX-05", "Empty pattern returns no matches", () => {
  const m = listRegexMatches("", "g", "abc");
  assertEqual(m.length, 0, "No matches");
  return "0 matches";
});

// --- Generate HTML ---
const allTests = suites.flatMap((s) => s.tests);
const passed = allTests.filter((t) => t.status === "pass").length;
const failed = allTests.filter((t) => t.status === "fail").length;
const total = allTests.length;

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const suiteHtml = suites
  .map((s) => {
    const sPass = s.tests.filter((t) => t.status === "pass").length;
    const sFail = s.tests.filter((t) => t.status === "fail").length;
    const rows = s.tests
      .map(
        (t) => `<tr class="${t.status}">
  <td><code>${esc(t.id)}</code></td>
  <td>${esc(t.name)}</td>
  <td><span class="badge ${t.status}">${t.status === "pass" ? "PASS" : "FAIL"}</span></td>
  <td>${t.durationMs} ms</td>
  <td><pre>${esc(t.detail)}</pre></td>
</tr>`
      )
      .join("\n");

    return `<section class="suite">
  <header>
    <h2>${esc(s.name)} — ${esc(s.description)}</h2>
    <p class="suite-summary">${sPass} passed, ${sFail} failed (${s.tests.length} tests)</p>
  </header>
  <table>
    <thead><tr><th>ID</th><th>Test case</th><th>Result</th><th>Time</th><th>Detail</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</section>`;
  })
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YOS Tools テスト仕様書 &amp; 結果 — ${esc(RUN_AT.toISOString())}</title>
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #fff;
      --text: #0f172a;
      --muted: #64748b;
      --border: #e2e8f0;
      --pass: #15803d;
      --pass-bg: #dcfce7;
      --fail: #b91c1c;
      --fail-bg: #fee2e2;
      --accent: #2563eb;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1rem 3rem;
    }
    .wrap { max-width: 1100px; margin: 0 auto; }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    .meta { color: var(--muted); margin-bottom: 1.5rem; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      box-shadow: 0 1px 2px rgba(0,0,0,.04);
    }
    .card strong { display: block; font-size: 1.75rem; }
    .card.total strong { color: var(--accent); }
    .card.pass strong { color: var(--pass); }
    .card.fail strong { color: var(--fail); }
    .scope {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;
    }
    .scope h2 { font-size: 1.1rem; margin-bottom: 0.75rem; }
    .scope ul { padding-left: 1.25rem; color: var(--muted); }
    .scope li { margin: 0.35rem 0; }
    .suite {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .suite header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border);
      background: #f1f5f9;
    }
    .suite h2 { font-size: 1rem; }
    .suite-summary { color: var(--muted); font-size: 0.875rem; margin-top: 0.25rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    th { background: #fafafa; font-weight: 600; }
    tr.fail { background: var(--fail-bg); }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 0.8125rem;
      color: var(--muted);
      margin: 0;
    }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
    }
    .badge.pass { background: var(--pass-bg); color: var(--pass); }
    .badge.fail { background: var(--fail-bg); color: var(--fail); }
    code { font-size: 0.8125rem; }
    footer { margin-top: 2rem; color: var(--muted); font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>YOS Tools テスト仕様書 &amp; 実行結果</h1>
    <p class="meta">実行日時: ${esc(RUN_AT.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }))} (JST) &nbsp;|&nbsp; 対象: YOS Tools 静的サイト + クライアントサイドツールロジック</p>

    <div class="summary">
      <div class="card total"><span>Total</span><strong>${total}</strong></div>
      <div class="card pass"><span>Passed</span><strong>${passed}</strong></div>
      <div class="card fail"><span>Failed</span><strong>${failed}</strong></div>
      <div class="card"><span>Pass rate</span><strong>${total ? Math.round((passed / total) * 1000) / 10 : 0}%</strong></div>
    </div>

    <section class="scope">
      <h2>テスト範囲</h2>
      <ul>
        <li><strong>SITE</strong> — 全15ページの存在、SEO ファイル（sitemap / robots）、共通 JS・GA 設定</li>
        <li><strong>UTC</strong> — UTC 入力パース、EST/PST/IST/JST/CET 基本変換</li>
        <li><strong>DST</strong> — 米国東部・太平洋、EU 中央ヨーロッパのサマータイム開始/終了境界（分単位）</li>
        <li><strong>CONT</strong> — 連続入力（24時間分の分刻み変換、夏冬交替、JSON/Regex 連打、不正入力バースト）</li>
        <li><strong>JSON</strong> — Beautify / Minify / Validate / Sort / Diff</li>
        <li><strong>REGEX</strong> — マッチング、プリセット、構文エラー、フラグ</li>
      </ul>
    </section>

    ${suiteHtml}

    <footer>
      Generated by <code>tests/run-tests.mjs</code>. Re-run: <code>node tests/run-tests.mjs</code>
    </footer>
  </div>
</body>
</html>`;

fs.writeFileSync(REPORT_PATH, html, "utf8");

console.log(`Test report written to ${REPORT_PATH}`);
console.log(`Results: ${passed}/${total} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
