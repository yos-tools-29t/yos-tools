/**
 * UTC to JST Converter — tool logic
 * JST = UTC+9 (no daylight saving time)
 */
(function () {
  "use strict";

  var JST_OFFSET_MS = 9 * 60 * 60 * 1000;

  /**
   * @param {Date} date
   * @returns {{ date: Date, zone: "JST" }}
   */
  function convertUTCToJST(date) {
    return {
      date: new Date(date.getTime() + JST_OFFSET_MS),
      zone: "JST"
    };
  }

  function formatDate(date) {
    var y = date.getUTCFullYear();
    var m = String(date.getUTCMonth() + 1).padStart(2, "0");
    var d = String(date.getUTCDate()).padStart(2, "0");
    var hh = String(date.getUTCHours()).padStart(2, "0");
    var mm = String(date.getUTCMinutes()).padStart(2, "0");
    return y + "-" + m + "-" + d + " " + hh + ":" + mm;
  }

  function parseUtcInput(value) {
    if (!value || !String(value).trim()) {
      return null;
    }

    var match = String(value).trim().match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
    );
    if (!match) {
      return new Date(NaN);
    }

    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var hour = Number(match[4]);
    var minute = Number(match[5]);
    var second = match[6] != null ? Number(match[6]) : 0;

    var date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day ||
      date.getUTCHours() !== hour ||
      date.getUTCMinutes() !== minute
    ) {
      return new Date(NaN);
    }

    return date;
  }

  function toDatetimeLocalUtc(date) {
    var y = date.getUTCFullYear();
    var m = String(date.getUTCMonth() + 1).padStart(2, "0");
    var d = String(date.getUTCDate()).padStart(2, "0");
    var hh = String(date.getUTCHours()).padStart(2, "0");
    var mm = String(date.getUTCMinutes()).padStart(2, "0");
    return y + "-" + m + "-" + d + "T" + hh + ":" + mm;
  }

  function setResultState(isError) {
    var output = document.getElementById("result-output");
    if (output) {
      output.classList.toggle("is-error", isError);
      output.classList.toggle("is-success", !isError);
    }
  }

  function showError(message) {
    var output = document.getElementById("result-output");
    var error = document.getElementById("result-error");
    var copyButton = document.getElementById("btn-copy");
    if (output) output.textContent = "—";
    if (copyButton) copyButton.disabled = true;
    setResultState(true);
    if (error) {
      error.hidden = false;
      error.textContent = message;
    }
  }

  function showResult(text) {
    var output = document.getElementById("result-output");
    var error = document.getElementById("result-error");
    var copyButton = document.getElementById("btn-copy");
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
    if (output) output.textContent = text;
    if (copyButton) copyButton.disabled = false;
    setResultState(false);
  }

  function clearResult() {
    var output = document.getElementById("result-output");
    var error = document.getElementById("result-error");
    var copyButton = document.getElementById("btn-copy");
    if (output) output.textContent = "—";
    if (copyButton) {
      copyButton.disabled = true;
      copyButton.textContent = "Copy";
    }
    setResultState(false);
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
  }

  function handleConvert(event) {
    if (event) event.preventDefault();

    var input = document.getElementById("utc-input");
    var value = input ? input.value : "";

    if (!value || !String(value).trim()) {
      showError("Please enter a valid UTC time.");
      return;
    }

    var utcDate = parseUtcInput(value);
    if (!utcDate || isNaN(utcDate.getTime())) {
      showError("Invalid date format.");
      return;
    }

    var converted = convertUTCToJST(utcDate);
    showResult(formatDate(converted.date) + " " + converted.zone);
  }

  function handleUseCurrentTime() {
    var input = document.getElementById("utc-input");
    if (!input) return;
    input.value = toDatetimeLocalUtc(new Date());
    handleConvert();
  }

  function handleClear() {
    var input = document.getElementById("utc-input");
    var form = document.getElementById("utc-to-jst-form");
    if (form) form.reset();
    if (input) input.value = "";
    clearResult();
  }

  function copyResult(button) {
    if (!button) return;

    var resultPanel = button.closest(".result-panel");
    var output = resultPanel ? resultPanel.querySelector(".result-output") : null;
    if (!output) return;

    var text = output.innerText || output.textContent;
    if (!text || String(text).trim() === "—") return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        button.textContent = "Copied!";
        setTimeout(function () {
          button.textContent = "Copy";
        }, 500);
      }).catch(function () {
        button.textContent = "Copy";
      });
    }
  }

  function init() {
    var form = document.getElementById("utc-to-jst-form");
    var btnCurrent = document.getElementById("btn-current");
    var btnClear = document.getElementById("btn-clear");
    var btnCopy = document.getElementById("btn-copy");

    if (form) form.addEventListener("submit", handleConvert);
    if (btnCurrent) btnCurrent.addEventListener("click", handleUseCurrentTime);
    if (btnClear) btnClear.addEventListener("click", handleClear);
    if (btnCopy) btnCopy.addEventListener("click", function () {
      copyResult(btnCopy);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
