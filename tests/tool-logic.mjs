/** Pure logic extracted from YOS Tools client scripts for automated testing. */

export function getNthSunday(year, monthIndex, n) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const dayOfWeek = first.getUTCDay();
  const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  return firstSunday + (n - 1) * 7;
}

export function getLastSunday(year, monthIndex) {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const lastDate = new Date(Date.UTC(year, monthIndex, lastDay));
  return lastDay - lastDate.getUTCDay();
}

export function parseUtcInput(value) {
  if (!value || !String(value).trim()) return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return new Date(NaN);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] != null ? Number(match[6]) : 0;
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
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

export function formatDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export function getESTDSTStatus(date) {
  const year = date.getUTCFullYear();
  const dstStart = Date.UTC(year, 2, getNthSunday(year, 2, 2), 7, 0, 0);
  const dstEnd = Date.UTC(year, 10, getNthSunday(year, 10, 1), 6, 0, 0);
  const t = date.getTime();
  return t >= dstStart && t < dstEnd ? "EDT" : "EST";
}

export function convertUTCToEST(date) {
  const zone = getESTDSTStatus(date);
  const offsetHours = zone === "EDT" ? -4 : -5;
  return { date: new Date(date.getTime() + offsetHours * 3600000), zone };
}

export function getPSTDSTStatus(date) {
  const year = date.getUTCFullYear();
  const dstStart = Date.UTC(year, 2, getNthSunday(year, 2, 2), 10, 0, 0);
  const dstEnd = Date.UTC(year, 10, getNthSunday(year, 10, 1), 9, 0, 0);
  const t = date.getTime();
  return t >= dstStart && t < dstEnd ? "PDT" : "PST";
}

export function convertUTCToPST(date) {
  const zone = getPSTDSTStatus(date);
  const offsetHours = zone === "PDT" ? -7 : -8;
  return { date: new Date(date.getTime() + offsetHours * 3600000), zone };
}

export function convertUTCToIST(date) {
  return { date: new Date(date.getTime() + (5 * 60 + 30) * 60 * 1000), zone: "IST" };
}

export function convertUTCToJST(date) {
  return { date: new Date(date.getTime() + 9 * 3600000), zone: "JST" };
}

export function getCETDSTStatus(date) {
  const year = date.getUTCFullYear();
  const dstStart = Date.UTC(year, 2, getLastSunday(year, 2), 1, 0, 0);
  const dstEnd = Date.UTC(year, 9, getLastSunday(year, 9), 1, 0, 0);
  const t = date.getTime();
  return t >= dstStart && t < dstEnd ? "CEST" : "CET";
}

export function convertUTCToCET(date) {
  const zone = getCETDSTStatus(date);
  const offset = zone === "CEST" ? 2 : 1;
  return { date: new Date(date.getTime() + offset * 3600000), zone, offset };
}

export function formatCET(date, label, offset) {
  return `${formatDate(date)} ${label} (UTC+${offset})`;
}

export function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = sortKeys(value[key]);
      return result;
    }, {});
  }
  return value;
}

export function formatJson(input, spaces = 2) {
  return JSON.stringify(JSON.parse(input), null, spaces);
}

export function minifyJson(input) {
  return JSON.stringify(JSON.parse(input));
}

export function validateJson(input) {
  JSON.parse(input);
  return true;
}

export function diffJson(left, right) {
  const diffs = [];
  compareValues(typeof left === "string" ? JSON.parse(left) : left, typeof right === "string" ? JSON.parse(right) : right, "$", diffs);
  return diffs;
}

function compareValues(left, right, path, diffs) {
  if (left === right) return;
  const leftIsObject = left !== null && typeof left === "object" && !Array.isArray(left);
  const rightIsObject = right !== null && typeof right === "object" && !Array.isArray(right);
  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);

  if (leftIsArray && rightIsArray) {
    const maxLength = Math.max(left.length, right.length);
    for (let index = 0; index < maxLength; index++) {
      const childPath = `${path}[${index}]`;
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
    const keys = { ...Object.fromEntries(Object.keys(left).map((k) => [k, true])), ...Object.fromEntries(Object.keys(right).map((k) => [k, true])) };
    Object.keys(keys).sort().forEach((key) => {
      const childPath = path === "$" ? `$.${key}` : `${path}.${key}`;
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

  diffs.push({ path, left, right });
}

export function listRegexMatches(pattern, flags, text) {
  if (!pattern) return [];
  const regex = new RegExp(pattern, flags);
  const matches = [];
  const global = flags.includes("g");
  let match;
  while ((match = global ? regex.exec(text) : regex.exec(text))) {
    if (!match) break;
    if (global && match[0] === "" && regex.lastIndex !== 0) {
      regex.lastIndex++;
      continue;
    }
    matches.push({ index: match.index, match: match[0] });
    if (!global) break;
  }
  return matches;
}

export function decodePresetText(text) {
  if (!text) return text;
  return text.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}

export function testRegexSyntax(pattern, flags = "") {
  try {
    new RegExp(pattern, flags);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export function convertUtcInput(converter, input) {
  const parsed = parseUtcInput(input);
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return { ok: false, error: "Invalid date format." };
  }
  const result = converter(parsed);
  return { ok: true, result };
}
