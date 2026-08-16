(function () {
  "use strict";

  var leftInputEl = document.getElementById("json-left-input");
  var rightInputEl = document.getElementById("json-right-input");
  var leftFileEl = document.getElementById("json-left-file");
  var rightFileEl = document.getElementById("json-right-file");
  var outputEl = document.getElementById("diff-output");
  var errorEl = document.getElementById("diff-error");

  function setOutput(text) {
    outputEl.textContent = text;
    errorEl.textContent = "";
  }

  function setError(message) {
    outputEl.innerHTML = "";
    outputEl.classList.add("is-empty");
    errorEl.textContent = message;
  }

  function clearDiffResult() {
    outputEl.innerHTML = "";
    outputEl.classList.add("is-empty");
    errorEl.textContent = "";
  }

  function readFileAsText(file, callback) {
    var reader = new FileReader();
    reader.onload = function (event) {
      callback(event.target.result);
    };
    reader.readAsText(file);
  }

  function isObjectLike(value) {
    return value !== null && typeof value === "object";
  }

  function buildJsonPath(parentPath, key, isArrayIndex) {
    if (!parentPath || parentPath === "$") {
      return isArrayIndex ? "$[" + key + "]" : "$." + key;
    }

    return isArrayIndex ? parentPath + "[" + key + "]" : parentPath + "." + key;
  }

  function parseJsonValue(value) {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    return value;
  }

  function diffJson(left, right) {
    var leftValue = parseJsonValue(left);
    var rightValue = parseJsonValue(right);
    var diffs = [];
    compareValues(leftValue, rightValue, "$", diffs);
    return diffs;
  }

  function compareValues(left, right, path, diffs) {
    if (left === right) {
      return;
    }

    var leftIsObject = isObjectLike(left) && !Array.isArray(left);
    var rightIsObject = isObjectLike(right) && !Array.isArray(right);
    var leftIsArray = Array.isArray(left);
    var rightIsArray = Array.isArray(right);

    if (leftIsArray && rightIsArray) {
      var maxLength = Math.max(left.length, right.length);
      for (var index = 0; index < maxLength; index++) {
        var childPath = buildJsonPath(path, index, true);
        if (index >= left.length) {
          diffs.push({ path: childPath, left: undefined, right: right[index] });
          continue;
        }
        if (index >= right.length) {
          diffs.push({ path: childPath, left: left[index], right: undefined });
          continue;
        }
        compareValues(left[index], right[index], childPath, diffs);
      }
      return;
    }

    if (leftIsObject && rightIsObject) {
      var keys = {};
      Object.keys(left).forEach(function (key) {
        keys[key] = true;
      });
      Object.keys(right).forEach(function (key) {
        keys[key] = true;
      });

      Object.keys(keys).sort().forEach(function (key) {
        var childPath = buildJsonPath(path, key, false);
        if (!(key in left)) {
          diffs.push({ path: childPath, left: undefined, right: right[key] });
          return;
        }
        if (!(key in right)) {
          diffs.push({ path: childPath, left: left[key], right: undefined });
          return;
        }
        compareValues(left[key], right[key], childPath, diffs);
      });
      return;
    }

    diffs.push({ path: path, left: left, right: right });
  }

  function formatValue(value) {
    if (typeof value === "undefined") {
      return "∅";
    }
    if (value === null) {
      return "null";
    }
    return JSON.stringify(value, null, 2);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function renderDiffs(items) {
    if (!items.length) {
      return '<div class="diff-empty">No differences found.</div>';
    }

    return items.map(function (item) {
      return '<div class="diff-item">' +
        '<div class="diff-path">' + escapeHtml(item.path) + '</div>' +
        '<div class="diff-values">' +
          '<div class="diff-value diff-value--left"><span class="diff-label">Left</span><pre>' + escapeHtml(formatValue(item.left)) + '</pre></div>' +
          '<div class="diff-value diff-value--right"><span class="diff-label">Right</span><pre>' + escapeHtml(formatValue(item.right)) + '</pre></div>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  function setDiffOutput(html) {
    outputEl.innerHTML = html;
    outputEl.classList.toggle("is-empty", html.indexOf("diff-item") === -1);
  }

  function attachFileHandlers() {
    leftFileEl.addEventListener("change", function (event) {
      var file = event.target.files[0];
      if (!file) return;
      readFileAsText(file, function (text) {
        leftInputEl.value = text;
      });
    });

    rightFileEl.addEventListener("change", function (event) {
      var file = event.target.files[0];
      if (!file) return;
      readFileAsText(file, function (text) {
        rightInputEl.value = text;
      });
    });
  }

  function init() {
    document.getElementById("compare-btn").addEventListener("click", function () {
      clearDiffResult();

      var left = leftInputEl.value.trim();
      var right = rightInputEl.value.trim();

      if (!left || !right) {
        setError("Please provide JSON content in both fields.");
        return;
      }

      try {
        var diffResult = diffJson(left, right);
        setDiffOutput(renderDiffs(diffResult));
        errorEl.textContent = "";
      } catch (error) {
        setError("Invalid JSON: " + error.message);
      }
    });

    document.getElementById("clear-btn").addEventListener("click", function () {
      leftInputEl.value = "";
      rightInputEl.value = "";
      leftFileEl.value = "";
      rightFileEl.value = "";
      clearDiffResult();
    });

    attachFileHandlers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
