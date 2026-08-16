/**
 * Regex Tester — tool logic
 */
(function () {
  "use strict";

  function parseFlags(flagString) {
    return {
      g: flagString.indexOf("g") !== -1,
      i: flagString.indexOf("i") !== -1,
      m: flagString.indexOf("m") !== -1,
      s: flagString.indexOf("s") !== -1,
      u: flagString.indexOf("u") !== -1,
      y: flagString.indexOf("y") !== -1
    };
  }

  function highlightMatches(pattern, flags, text) {
    if (!pattern) {
      return { html: "", matches: [] };
    }

    try {
      var regex = new RegExp(pattern, flags);
      var parts = [];
      var match;
      var lastIndex = 0;
      var matches = [];
      var global = flags.indexOf("g") !== -1;

      while ((match = global ? regex.exec(text) : regex.exec(text))) {
        if (!match) break;
        if (global && match[0] === "" && regex.lastIndex !== 0) {
          regex.lastIndex++;
          continue;
        }

        var segment = text.slice(lastIndex, match.index);
        parts.push(escapeHtml(segment));
        parts.push('<span class="regex-highlight-match">' + escapeHtml(match[0]) + '</span>');
        lastIndex = match.index + match[0].length;
        matches.push({ index: match.index, match: match[0] });

        if (!global) {
          break;
        }
      }

      parts.push(escapeHtml(text.slice(lastIndex)));
      return { html: parts.join(""), matches: matches };
    } catch (error) {
      return { html: escapeHtml(text), matches: [] };
    }
  }

  function extractCaptureGroups(pattern, flags, text) {
    if (!pattern) {
      return [];
    }

    try {
      var regex = new RegExp(pattern, flags);
      var matches = [];
      var match;
      var lastIndex = 0;
      var global = flags.indexOf("g") !== -1;

      while ((match = global ? regex.exec(text) : regex.exec(text))) {
        if (!match) break;
        if (global && match[0] === "" && regex.lastIndex !== 0) {
          regex.lastIndex++;
          continue;
        }

        var groups = [];
        for (var i = 1; i < match.length; i++) {
          groups.push({ group: i, value: match[i] !== undefined ? match[i] : "" });
        }
        matches.push.apply(matches, groups);
        lastIndex = match.index + match[0].length;
        if (!global) {
          break;
        }
      }

      return matches;
    } catch (error) {
      return [];
    }
  }

  function listAllMatches(pattern, flags, text) {
    if (!pattern) {
      return [];
    }

    try {
      var regex = new RegExp(pattern, flags);
      var matches = [];
      var match;
      var global = flags.indexOf("g") !== -1;

      while ((match = global ? regex.exec(text) : regex.exec(text))) {
        if (!match) break;
        if (global && match[0] === "" && regex.lastIndex !== 0) {
          regex.lastIndex++;
          continue;
        }
        matches.push({ index: match.index, match: match[0] });
        if (!global) {
          break;
        }
      }

      return matches;
    } catch (error) {
      return [];
    }
  }

  function showRegexError(pattern, flags, text) {
    if (!pattern) {
      return "";
    }

    try {
      new RegExp(pattern, flags);
      return "";
    } catch (error) {
      var message = error.message || "Invalid regular expression";
      var position = "";
      var match = message.match(/position (\d+)/i);
      if (match) {
        position = " at position " + match[1];
      }
      return message + position;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function testRegex(pattern, flags, text) {
    if (!pattern) {
      return { ok: true, matches: [], groups: [], allMatches: [], highlights: { html: "", matches: [] }, error: "" };
    }

    try {
      var regex = new RegExp(pattern, flags);
      var matches = [];
      var match;
      var global = flags.indexOf("g") !== -1;
      var allMatches = [];

      while ((match = global ? regex.exec(text) : regex.exec(text))) {
        if (!match) break;
        if (global && match[0] === "" && regex.lastIndex !== 0) {
          regex.lastIndex++;
          continue;
        }

        matches.push({ match: match[0], index: match.index, groups: match.slice(1) });
        allMatches.push({ index: match.index, match: match[0] });
        if (!global) {
          break;
        }
      }

      return {
        ok: true,
        matches: matches,
        groups: extractCaptureGroups(pattern, flags, text),
        allMatches: allMatches,
        highlights: highlightMatches(pattern, flags, text),
        error: ""
      };
    } catch (error) {
      return {
        ok: false,
        matches: [],
        groups: [],
        allMatches: [],
        highlights: { html: escapeHtml(text), matches: [] },
        error: error.message || "Invalid regular expression"
      };
    }
  }

  function initRegexTester() {
    var app = document.getElementById("regex-tester-app");
    if (!app) return;

    app.innerHTML = [
      '<div class="regex-grid">',
      '  <div class="regex-card">',
      '    <label class="form-group" for="regex-pattern">',
      '      <span>Pattern</span>',
      '      <textarea id="regex-pattern" placeholder="e.g. \\b[a-z]+\\b">abc</textarea>',
      '    </label>',
      '    <div class="regex-flags" id="regex-flags"></div>',
      '    <div class="regex-error" id="regex-error"></div>',
      '  </div>',
      '  <div class="regex-card">',
      '    <label class="form-group" for="regex-text">',
      '      <span>Text</span>',
      '      <textarea id="regex-text" placeholder="Enter text to test">Lorem ipsum 123 test</textarea>',
      '    </label>',
      '  </div>',
      '</div>',
      '<div class="regex-results">',
      '  <div class="regex-result-card">',
      '    <h3>Match Highlights</h3>',
      '    <div id="regex-preview" class="regex-preview"></div>',
      '  </div>',
      '  <div class="regex-result-card">',
      '    <h3>Capture Groups</h3>',
      '    <ul id="regex-groups"></ul>',
      '  </div>',
      '  <div class="regex-result-card">',
      '    <h3>Flags</h3>',
      '    <ul id="regex-flag-list"></ul>',
      '  </div>',
      '  <div class="regex-result-card">',
      '    <h3>Errors</h3>',
      '    <ul id="regex-errors"></ul>',
      '  </div>',
      '</div>',
      '<div class="regex-flags-help">',
      '  <h2>Quick examples</h2>',
      '  <div class="regex-presets">',
      '    <button type="button" class="regex-preset" data-pattern="\\b\\w+\\b" data-text="Hello world">Words</button>',
      '    <button type="button" class="regex-preset" data-pattern="\\d+" data-text="Order 123 shipped at 09:30">Numbers</button>',
      '    <button type="button" class="regex-preset" data-pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" data-text="name@example.com">Email</button>',
      '    <button type="button" class="regex-preset" data-pattern="https?:\\/\\/[^\\s]+" data-text="Visit https://example.com now">URL</button>',
      '  </div>',
      '  <h2>How to use regex flags (with examples)</h2>',
      '  <p class="regex-flag-example__hint">Load an example, then toggle the flag button above to see how the match highlights change.</p>',
      '  <div class="regex-flag-example-block">',
      '    <h3>g (global)</h3>',
      '    <p class="regex-flag-example__hint"><strong>g off:</strong> only the first number (<code>123</code>) is highlighted. <strong>g on:</strong> every number (<code>123</code>, <code>09</code>, <code>30</code>) is highlighted.</p>',
      '    <pre><code>Pattern: \\d+\nText: Order 123 shipped at 09:30</code></pre>',
      '    <button type="button" class="regex-preset regex-flag-example" data-pattern="\\d+" data-text="Order 123 shipped at 09:30">Load example</button>',
      '  </div>',
      '  <div class="regex-flag-example-block">',
      '    <h3>i (ignore case)</h3>',
      '    <p class="regex-flag-example__hint"><strong>i off:</strong> <code>Hello</code> does not match pattern <code>hello</code> — letter case must match exactly. <strong>i on:</strong> case is ignored, so <code>Hello</code> matches.</p>',
      '    <pre><code>Pattern: hello\nText: Hello</code></pre>',
      '    <button type="button" class="regex-preset regex-flag-example" data-pattern="hello" data-text="Hello">Load example</button>',
      '  </div>',
      '  <div class="regex-flag-example-block">',
      '    <h3>m (multiline)</h3>',
      '    <p class="regex-flag-example__hint"><strong>m</strong> only affects <code>^</code> and <code>$</code> — it makes them match the start/end of each line instead of the whole text. Pattern <code>^ok$</code> means “this entire line is exactly ok”. <strong>m off:</strong> no match. <strong>m on:</strong> the middle line <code>ok</code> matches.</p>',
      '    <pre><code>Pattern: ^ok$\nText:\nnot ok\nok\nok again</code></pre>',
      '    <button type="button" class="regex-preset regex-flag-example" data-pattern="^ok$" data-text="not ok\\nok\\nok again">Load example</button>',
      '  </div>',
      '  <div class="regex-flag-example-block">',
      '    <h3>s (dotAll)</h3>',
      '    <p class="regex-flag-example__hint"><strong>s</strong> lets <code>.</code> match newline characters. <strong>s off:</strong> the dot does not cross lines — no match. <strong>s on:</strong> <code>.*</code> matches from <code>Hello</code> through the newline to <code>world</code>.</p>',
      '    <pre><code>Pattern: Hello.*world\nText: Hello\\nworld</code></pre>',
      '    <button type="button" class="regex-preset regex-flag-example" data-pattern="Hello.*world" data-text="Hello\\nworld">Load example</button>',
      '  </div>',
      '  <div class="regex-flag-example-block">',
      '    <h3>u (unicode)</h3>',
      '    <p class="regex-flag-example__hint"><strong>u</strong> enables Unicode property escapes such as <code>\\p{Script=Hiragana}</code>. Without <strong>u</strong>, the pattern does not match Japanese text. Also note: in JavaScript, <code>\\w</code> matches only <code>A–Z</code>, <code>a–z</code>, <code>0–9</code>, and <code>_</code> — even with <strong>u</strong>, Japanese and emoji are not included. <strong>u off:</strong> no match. <strong>u on:</strong> <code>こんにちは</code> is highlighted.</p>',
      '    <pre><code>Pattern: \\p{Script=Hiragana}+\nText: Hello こんにちは\nFlags: u required</code></pre>',
      '    <button type="button" class="regex-preset regex-flag-example" data-pattern="\\p{Script=Hiragana}+" data-text="Hello こんにちは">Load example</button>',
      '  </div>',
      '  <div class="regex-flag-example-block">',
      '    <h3>y (sticky)</h3>',
      '    <p class="regex-flag-example__hint"><strong>y off:</strong> the engine finds <code>123</code> anywhere in the text. <strong>y on:</strong> matching must start at position 0, so there is no match.</p>',
      '    <pre><code>Pattern: \\d+\nText: abc 123 def</code></pre>',
      '    <button type="button" class="regex-preset regex-flag-example" data-pattern="\\d+" data-text="abc 123 def">Load example</button>',
      '  </div>',
      '</div>'
    ].join("");

    var patternEl = document.getElementById("regex-pattern");
    var textEl = document.getElementById("regex-text");
    var flagsEl = document.getElementById("regex-flags");
    var previewEl = document.getElementById("regex-preview");
    var groupsEl = document.getElementById("regex-groups");
    var flagListEl = document.getElementById("regex-flag-list");
    var errorsEl = document.getElementById("regex-errors");
    var errorEl = document.getElementById("regex-error");

    var flagKeys = ["g", "i", "m", "s", "u", "y"];
    var activeFlags = "";

    function decodePresetText(text) {
      if (!text) return text;
      return text.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    }

    function applyPreset(pattern, text, flags) {
      patternEl.value = pattern;
      textEl.value = decodePresetText(text);
      if (typeof flags === "string") {
        activeFlags = flags;
        renderFlags();
      }
      [patternEl, textEl].forEach(function (el) {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      });
      updateResults();
    }

    function renderFlags() {
      flagsEl.innerHTML = flagKeys.map(function (flag) {
        var isActive = activeFlags.indexOf(flag) !== -1;
        return '<button type="button" class="regex-flag-btn' + (isActive ? " is-active" : "") + '" data-flag="' + flag + '">' + flag + '</button>';
      }).join("");

      var buttons = flagsEl.querySelectorAll(".regex-flag-btn");
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          var flag = button.getAttribute("data-flag");
          activeFlags = activeFlags.indexOf(flag) === -1 ? activeFlags + flag : activeFlags.replace(flag, "");
          renderFlags();
          updateResults();
        });
      });
    }

    function updateResults() {
      previewEl.innerHTML = "";
      groupsEl.innerHTML = "";
      flagListEl.innerHTML = "";
      errorsEl.innerHTML = "";
      errorEl.textContent = "";
      patternEl.classList.remove("error");

      var pattern = patternEl.value;
      var text = textEl.value;
      var result = testRegex(pattern, activeFlags, text);
      previewEl.innerHTML = result.highlights.html || '<span class="regex-highlight-match">No matches</span>';
      groupsEl.innerHTML = result.groups.length ? result.groups.map(function (group) {
        return '<li><strong>Group ' + group.group + ':</strong> ' + escapeHtml(group.value || "") + '</li>';
      }).join("") : '<li>No capture groups.</li>';
      flagListEl.innerHTML = '<li>' + escapeHtml(activeFlags || "none") + '</li>';

      var errorMessage = showRegexError(pattern, activeFlags, text);
      if (errorMessage) {
        errorEl.textContent = errorMessage;
        patternEl.classList.add("error");
      } else {
        errorEl.textContent = "";
        patternEl.classList.remove("error");
      }

      errorsEl.innerHTML = result.error ? '<li>' + escapeHtml(result.error) + '</li>' : '<li>No errors.</li>';
    }

    var presetButtons = app.querySelectorAll(".regex-preset, .regex-flag-example");
    presetButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var initialFlags = undefined;
        if (button.classList.contains("regex-flag-example")) {
          initialFlags = button.hasAttribute("data-flags") ? button.getAttribute("data-flags") : "";
        }
        applyPreset(
          button.getAttribute("data-pattern"),
          button.getAttribute("data-text"),
          initialFlags
        );
      });
    });

    [patternEl, textEl].forEach(function (el) {
      el.addEventListener("input", function () {
        updateResults();
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      });
    });

    renderFlags();
    updateResults();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRegexTester);
  } else {
    initRegexTester();
  }
})();
