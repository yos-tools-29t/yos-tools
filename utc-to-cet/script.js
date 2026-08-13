/**
 * UTC to CET Converter — tool logic
 */
(function () {
  "use strict";

  /**
   * Day-of-month for the last Sunday of a UTC month.
   * @param {number} year
   * @param {number} monthIndex - 0-based
   * @returns {number}
   */
  function getLastSunday(year, monthIndex) {
    var lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    var lastDate = new Date(Date.UTC(year, monthIndex, lastDay));
    return lastDay - lastDate.getUTCDay();
  }

  /**
   * EU Central European DST:
   * last Sunday of March 01:00 UTC → CEST
   * last Sunday of October 01:00 UTC → CET
   * @param {Date} date
   * @returns {"CEST"|"CET"}
   */
  function getDSTStatus(date) {
    var year = date.getUTCFullYear();
    var dstStart = Date.UTC(year, 2, getLastSunday(year, 2), 1, 0, 0);
    var dstEnd = Date.UTC(year, 9, getLastSunday(year, 9), 1, 0, 0);
    var t = date.getTime();
    return t >= dstStart && t < dstEnd ? "CEST" : "CET";
  }

  /**
   * Parse datetime-local value as UTC (not browser local time).
   * @param {string} value
   * @returns {Date|null}
   */
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

  /**
   * Format a Date's UTC components for datetime-local.
   * @param {Date} date
   * @returns {string}
   */
  function toDatetimeLocalUtc(date) {
    var y = date.getUTCFullYear();
    var m = String(date.getUTCMonth() + 1).padStart(2, "0");
    var d = String(date.getUTCDate()).padStart(2, "0");
    var hh = String(date.getUTCHours()).padStart(2, "0");
    var mm = String(date.getUTCMinutes()).padStart(2, "0");
    return y + "-" + m + "-" + d + "T" + hh + ":" + mm;
  }

  /**
   * Format CET/CEST date into YYYY-MM-DD HH:mm label
   * @param {Date} date
   * @param {string} label
   * @param {number} offset
   * @returns {string}
   */
  function formatCET(date, label, offset) {
    var y = date.getUTCFullYear();
    var m = String(date.getUTCMonth() + 1).padStart(2, "0");
    var d = String(date.getUTCDate()).padStart(2, "0");
    var hh = String(date.getUTCHours()).padStart(2, "0");
    var mm = String(date.getUTCMinutes()).padStart(2, "0");
    return (
      y +
      "-" +
      m +
      "-" +
      d +
      " " +
      hh +
      ":" +
      mm +
      " " +
      label +
      " (UTC+" +
      offset +
      ")"
    );
  }

  // DOM elements
  var form = document.getElementById("utc-to-cet-form");
  var inputUTC = document.getElementById("utc-input");
  var output = document.getElementById("result-output");
  var errorMsg = document.getElementById("result-error");
  var btnCurrent = document.getElementById("btn-current");
  var btnClear = document.getElementById("btn-clear");
  var btnCopy = document.getElementById("btn-copy");

  function showError(message) {
    if (output) {
      output.textContent = "—";
    }
    if (errorMsg) {
      errorMsg.hidden = false;
      errorMsg.textContent = message;
    }
    if (btnCopy) {
      btnCopy.disabled = true;
    }
  }

  function clearResult() {
    if (output) {
      output.textContent = "—";
    }
    if (errorMsg) {
      errorMsg.hidden = true;
      errorMsg.textContent = "";
    }
    if (btnCopy) {
      btnCopy.disabled = true;
      btnCopy.textContent = "Copy";
    }
  }

  function convertUtcToCET() {
    if (!inputUTC || !output) {
      return;
    }

    var value = inputUTC.value;
    if (!value) {
      showError("Please enter a valid UTC date and time.");
      return;
    }

    var utcDate = parseUtcInput(value);
    if (!utcDate || isNaN(utcDate.getTime())) {
      showError("Invalid date format.");
      return;
    }

    var status = getDSTStatus(utcDate);
    var offset = status === "CEST" ? 2 : 1;
    var cetDate = new Date(utcDate.getTime() + offset * 3600 * 1000);
    var formatted = formatCET(cetDate, status, offset);

    output.textContent = formatted;
    if (errorMsg) {
      errorMsg.hidden = true;
      errorMsg.textContent = "";
    }
    if (btnCopy) {
      btnCopy.disabled = false;
      btnCopy.textContent = "Copy";
    }
  }

  function copyResult(button) {
    if (!button) return;

    var resultPanel = button.closest(".result-panel");
    var resultOutput = resultPanel ? resultPanel.querySelector(".result-output") : null;
    if (!resultOutput) return;

    var text = resultOutput.innerText || resultOutput.textContent;
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

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      convertUtcToCET();
    });
  }

  if (btnCurrent) {
    btnCurrent.addEventListener("click", function () {
      if (inputUTC) {
        inputUTC.value = toDatetimeLocalUtc(new Date());
      }
      convertUtcToCET();
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", function () {
      if (inputUTC) {
        inputUTC.value = "";
      }
      clearResult();
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener("click", function () {
      copyResult(btnCopy);
    });
  }
})();
