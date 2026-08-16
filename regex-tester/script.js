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
      '  <h3>g (global)</h3>',
      '  <pre><code>Pattern: \\b\\w+\\b\nText: Hello world\n→ With g, both "Hello" and "world" are matched</code></pre>',
      '  <h3>i (ignore case)</h3>',
      '  <pre><code>Pattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\nText: Name@EXAMPLE.COM\n→ With i, uppercase letters in the address are accepted</code></pre>',
      '  <h3>m (multiline)</h3>',
      '  <pre><code>Pattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\nText:\nname@example.com\nnot-an-email\nuser@test.org\n→ With m, ^ and $ apply to each line</code></pre>',
      '  <h3>s (dotAll)</h3>',
      '  <pre><code>Pattern: https?:\\/\\/.*\nText: Visit https://example.com\n/page now\n→ With s, the dot matches the newline in the URL path</code></pre>',
      '  <h3>u (unicode)</h3>',
      '  <pre><code>Pattern: \\b\\w+\\b\nText: Hello こんにちは\n→ With u, Unicode letters are treated as word characters</code></pre>',
      '  <h3>y (sticky)</h3>',
      '  <pre><code>Pattern: \\d+\nText: Order 123 shipped at 09:30\n→ With y, matching only succeeds at the current search position</code></pre>',
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

    function applyPreset(pattern, text) {
      patternEl.value = pattern;
      textEl.value = text;
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

    var presetButtons = app.querySelectorAll(".regex-preset");
    presetButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        applyPreset(button.getAttribute("data-pattern"), button.getAttribute("data-text"));
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
