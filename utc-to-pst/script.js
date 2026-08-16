/**
 * UTC to PST Converter — tool logic
 */
(function () {
  "use strict";

  function getNthSunday(year, monthIndex, n) {
    var first = new Date(Date.UTC(year, monthIndex, 1));
    var dayOfWeek = first.getUTCDay();
    var firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    return firstSunday + (n - 1) * 7;
  }

  /**
   * US Pacific DST:
   * 2nd Sunday of March 02:00 PST (10:00 UTC)
   * through 1st Sunday of November 02:00 PDT (09:00 UTC)
   * @param {Date} date
   * @returns {"PDT"|"PST"}
   */
  function getDSTStatus(date) {
    var year = date.getUTCFullYear();
    var dstStart = Date.UTC(year, 2, getNthSunday(year, 2, 2), 10, 0, 0);
    var dstEnd = Date.UTC(year, 10, getNthSunday(year, 10, 1), 9, 0, 0);
    var t = date.getTime();
    return t >= dstStart && t < dstEnd ? "PDT" : "PST";
  }

  /**
   * @param {Date} date
   * @returns {{ date: Date, zone: "PST"|"PDT" }}
   */
  function convertUTCToPST(date) {
    var zone = getDSTStatus(date);
    var offsetHours = zone === "PDT" ? -7 : -8;
    return {
      date: new Date(date.getTime() + offsetHours * 60 * 60 * 1000),
      zone: zone
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

    clearResult();

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

    var converted = convertUTCToPST(utcDate);
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
    var form = document.getElementById("utc-to-pst-form");
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
    var form = document.getElementById("utc-to-pst-form");
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
