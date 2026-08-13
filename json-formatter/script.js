/**
 * JSON Formatter — tool logic
 */
(function () {
  "use strict";

  var inputEl = document.getElementById("json-input");
  var outputEl = document.getElementById("json-output");
  var errorEl = document.getElementById("json-error");
  var fileEl = document.getElementById("json-file");

  function setOutput(text) {
    outputEl.textContent = text;
    outputEl.classList.remove("is-error");
    errorEl.textContent = "";
  }

  function setError(message) {
    errorEl.textContent = message;
    outputEl.classList.add("is-error");
  }

  function sortKeys(value) {
    if (Array.isArray(value)) {
      return value.map(sortKeys);
    }

    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce(function (result, key) {
          result[key] = sortKeys(value[key]);
          return result;
        }, {});
    }

    return value;
  }

  function formatJson(input, spaces) {
    var parsed = JSON.parse(input);
    return {
      ok: true,
      result: JSON.stringify(parsed, null, spaces || 2)
    };
  }

  function minifyJson(input) {
    var parsed = JSON.parse(input);
    return {
      ok: true,
      result: JSON.stringify(parsed)
    };
  }

  function validateJson(input) {
    JSON.parse(input);
    return { ok: true };
  }

  function handleAction(action) {
    var rawInput = inputEl.value.trim();

    if (!rawInput) {
      setError("Please enter JSON input or upload a file.");
      return;
    }

    try {
      if (action === "beautify") {
        var formatted = formatJson(rawInput, 2);
        setOutput(formatted.result);
      } else if (action === "minify") {
        var minified = minifyJson(rawInput);
        setOutput(minified.result);
      } else if (action === "validate") {
        validateJson(rawInput);
        setOutput("Valid JSON.");
      } else if (action === "sort") {
        var parsed = JSON.parse(rawInput);
        setOutput(JSON.stringify(sortKeys(parsed), null, 2));
      } else if (action === "download") {
        var downloadContent = outputEl.textContent.trim();
        if (!downloadContent) {
          setError("Generate output first before downloading.");
          return;
        }

        var blob = new Blob([downloadContent], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "formatted.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      setError("Invalid JSON: " + error.message);
    }
  }

  function initJsonFormatter() {
    var buttons = document.querySelectorAll("[data-action]");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        handleAction(button.getAttribute("data-action"));
      });
    });

    fileEl.addEventListener("change", function (event) {
      var file = event.target.files[0];
      if (!file) {
        return;
      }

      var reader = new FileReader();
      reader.onload = function (loadEvent) {
        inputEl.value = loadEvent.target.result;
        setOutput("");
        setError("");
      };
      reader.readAsText(file);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initJsonFormatter);
  } else {
    initJsonFormatter();
  }
})();
