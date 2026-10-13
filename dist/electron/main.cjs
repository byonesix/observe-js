"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/electron/main.ts
var main_exports = {};
__export(main_exports, {
  captureException: () => captureException,
  flush: () => flush,
  init: () => init,
  log: () => log,
  setAttributes: () => setAttributes
});
module.exports = __toCommonJS(main_exports);
var import_electron = require("electron");
var import_node_os = require("node:os");
var import_node_path2 = require("node:path");

// src/core/ids.ts
var hex = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function format(bytes) {
  let out = "";
  for (let i = 0; i < 16; i++) {
    if (i === 4 || i === 6 || i === 8 || i === 10) out += "-";
    out += hex[bytes[i]];
  }
  return out;
}
var lastMs = -1;
var counter = 0;
function uuidv7(wallMs) {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let ms = Math.max(0, Math.floor(wallMs));
  if (ms <= lastMs) {
    ms = lastMs;
    counter++;
    if (counter > 4095) {
      ms = lastMs + 1;
      counter = 0;
    }
  } else {
    counter = 0;
  }
  lastMs = ms;
  bytes[0] = Math.floor(ms / 2 ** 40) & 255;
  bytes[1] = Math.floor(ms / 2 ** 32) & 255;
  bytes[2] = ms >>> 24 & 255;
  bytes[3] = ms >>> 16 & 255;
  bytes[4] = ms >>> 8 & 255;
  bytes[5] = ms & 255;
  bytes[6] = 112 | counter >>> 8 & 15;
  bytes[7] = counter & 255;
  bytes[8] = 128 | bytes[8] & 63;
  return format(bytes);
}
function uuidv4() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = 64 | bytes[6] & 15;
  bytes[8] = 128 | bytes[8] & 63;
  return format(bytes);
}
function uuidv7Ms(id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)) return null;
  return parseInt(id.slice(0, 8) + id.slice(9, 13), 16);
}
function micros(wallMs) {
  return Math.round(wallMs * 1e3);
}
var systemClock = {
  wallMs: () => Date.now(),
  monoMs: () => globalThis.performance.now()
};

// src/core/scrub.ts
var REPLACEMENT = "[scrubbed]";
var DEFAULT_KEYS = [
  "authorization",
  "auth",
  "cookie",
  "session",
  "sessionid",
  "sid",
  "password",
  "passwd",
  "pwd",
  "passphrase",
  "secret",
  "token",
  "jwt",
  "bearer",
  "apikey",
  "privatekey",
  "signature",
  "hmac",
  "credential",
  "credentials",
  "dsn",
  "databaseurl",
  "connectionstring",
  "cardnumber",
  "cardholder",
  "cardexpiry",
  "cardexp",
  "creditcard",
  "pan",
  "cc",
  "ccnumber",
  "ccnum",
  "securitycode",
  "cvc",
  "cvc2",
  "cvv",
  "cvv2",
  "ccv",
  "iban",
  "accountnumber",
  "routingnumber",
  "sortcode",
  "bankaccount",
  "ssn",
  "socialsecuritynumber",
  "pin",
  "pincode",
  "otp",
  "authcode",
  "authorizationcode",
  "recoverycodes",
  "twofactorcode",
  "authpw",
  "recurringdetailreference"
];
var QUERY_ONLY_KEYS = /* @__PURE__ */ new Set(["code"]);
var QUERY_SEPARATORS = /* @__PURE__ */ new Set(["?", "&", "#", ";"]);
var QUOTES = /* @__PURE__ */ new Set(['"', "'", "`"]);
var TERMINAL = /* @__PURE__ */ new Set(["key", "credential"]);
var SAFE_SUFFIX = /* @__PURE__ */ new Set(["type", "status", "at", "required", "consent", "attempts", "count", "enabled", "length", "expires", "expiry"]);
var SAFE_PREFIX = /* @__PURE__ */ new Set(["has", "is", "should", "can", "needs"]);
var SAFE_KEYS = /* @__PURE__ */ new Set([
  "idempotencykey",
  "cachekey",
  "primarykey",
  "foreignkey",
  "sortkey",
  "partitionkey",
  "routekey",
  "publickey",
  "lockkey",
  "uniquekey",
  "objectkey",
  "translationkey"
]);
var CARD_EXEMPT_KEYS = /* @__PURE__ */ new Set([
  "pspreference",
  "psp",
  "imei",
  "imsi",
  "iccid",
  "ean",
  "gtin",
  "barcode",
  "sku",
  "ordernumber",
  "invoicenumber",
  "merchantreference",
  "reference",
  "timeus",
  "startus",
  "durationus"
]);
var MAX_DEPTH = 12;
var MAX_TEXT_DEPTH = 3;
var MAX_TEXT_BYTES = 131072;
var MAX_CUT_TOKEN_BYTES = 1024;
var MAX_ENCODED_BYTES = 8192;
var MAX_DECODES = 256;
var MAX_VERDICTS = 4096;
var WS = String.raw` \t\n\x0B\f\r`;
var KEY = String.raw`A-Za-z0-9_.\-\[\]`;
var HEX_ESCAPE = String.raw`u00(?:0[9adAD]|2[267]|3[ceCE])`;
var TOKEN_START = String.raw`(?:\b|(?<=\\[nrt]|\\${HEX_ESCAPE}))`;
var VALUE_BACKSLASH = String.raw`\\(?!u00(?:2[267]|3[ceCE])|(?:[nrt\\]|u000[9adAD])[${KEY}]{1,64}["'\x60]?[ \t]*[=:])`;
var WORD = String.raw`(?!\/)(?:[^${WS}&,;"'\x60<>(){}\[\]?=\\]|${VALUE_BACKSLASH})+`;
var NEXT_WORD = String.raw`[ \t]{1,4}(?![A-Za-z0-9_.\-]{1,64}["'\x60]?[${WS}]{0,4}[=:])(?:[^${WS}&,;"'\x60<>(){}\[\]?=:\\]|${VALUE_BACKSLASH})+`;
var TAIL = String.raw`(?:[^${WS}&,;"'\x60<>(){}\[\]?:\\]|${VALUE_BACKSLASH})*`;
var atoms = 0;
function atomic(body) {
  const name = `atom${atoms++}`;
  return String.raw`(?=(?<${name}>${body}))\k<${name}>`;
}
function anyCase(...words) {
  return words.map((word) => word.replace(/[a-z]/g, (c) => `[${c}${c.toUpperCase()}]`)).join("|");
}
function quoted() {
  return [
    String.raw`"${atomic(String.raw`(?:[^"\\\n]+|\\[^\n])*`)}(?:"|(?=\r?\n|$))`,
    String.raw`'${atomic(String.raw`(?:[^'\\\n]+|\\[^\n])*`)}(?:'|(?=\r?\n|$))`,
    String.raw`\x60${atomic(String.raw`[^\x60\n]*`)}\x60`,
    String.raw`\\u0022${atomic(String.raw`(?:[^"\\\n]+|\\(?!u0022)[^\n])*`)}(?:\\u0022|(?=["\r\n]|$))`,
    String.raw`\\u0027${atomic(String.raw`(?:[^"\\\n]+|\\(?!u0027)[^\n])*`)}(?:\\u0027|(?=["\r\n]|$))`
  ].join("|");
}
var PAIR = new RegExp(
  String.raw`(?<![${KEY}])(?<key>[${KEY}]{1,64})(?:` + String.raw`(?<sep>["'\x60]?(?:[ \t]*(?:=>|=)|[${WS}](?:${anyCase("like")})[${WS}])[ \t]*)(?<value>${quoted()}|${WORD})` + String.raw`|(?<csep>["'\x60]?[ \t]*:[ \t]*(?:\r?\n[ \t]*)?)(?<cvalue>${quoted()}|(?![${KEY}]{1,64}["'\x60]?[ \t]*[=:])${WORD}(?:${NEXT_WORD}){0,8}))`,
  "g"
);
var COLON_VALUE_WITH_EQUALS = new RegExp(
  String.raw`(?<![${KEY}])(?<key>[${KEY}]{1,64})(?<separator>["'\x60]?[ \t]*:[ \t]*)` + atomic(String.raw`(?:[^${WS}&,;"'\x60<>(){}\[\]?=:\\]|${VALUE_BACKSLASH})+`) + `=${TAIL}`,
  "g"
);
var SCRUBBED_TAIL = new RegExp(String.raw`\[scrubbed\]=${TAIL}`, "g");
var XML_ELEMENT = new RegExp(
  String.raw`(?<head>(?:<|\\u003[cC])(?<key>[A-Za-z0-9_.:-]{1,64})(?:>|\\u003[eE]))` + atomic(String.raw`(?:[^<\\]+|\\(?!u003[cC]))+`) + String.raw`(?<tail>(?:<|\\u003[cC])\/\k<key>(?:>|\\u003[eE]))`,
  "g"
);
var HEADER_PROBE = new RegExp(String.raw`(?<![^\n])[ \t]*(?:[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+|${anyCase("authorization", "cookie", "signature")})[ \t]*:`);
var HEADER_LINE = new RegExp(
  String.raw`(?<![^\n])(?<head>[ \t]*(?<key>[A-Za-z0-9]{1,32}(?:-[A-Za-z0-9]{1,32}){1,6}|${anyCase("authorization", "cookie", "signature")})[ \t]*:[ \t]*(?![ \t]))(?<value>[^\r\n]+)(?=\r?\n|$)`,
  "g"
);
var TOKENS = [
  [/eyJ/i, /(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]{4,4096}\.[A-Za-z0-9_-]{4,4096}\.[A-Za-z0-9_-]{0,4096}/g, REPLACEMENT],
  [/_live_/i, new RegExp(String.raw`${TOKEN_START}(?:sk|rk|pk)_live_[A-Za-z0-9]{6,}`, "g"), REPLACEMENT],
  [/_test_/i, new RegExp(String.raw`${TOKEN_START}(?:sk|rk|pk)_test_[A-Za-z0-9]{6,}`, "g"), REPLACEMENT],
  [/_/, new RegExp(String.raw`${TOKEN_START}(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})`, "g"), REPLACEMENT],
  [/xox/i, new RegExp(String.raw`${TOKEN_START}xox[abpr]-[A-Za-z0-9-]{10,}`, "g"), REPLACEMENT],
  [/AKIA/i, new RegExp(String.raw`${TOKEN_START}AKIA[0-9A-Z]{16}\b`, "g"), REPLACEMENT],
  [/AIza/i, new RegExp(String.raw`${TOKEN_START}AIza[0-9A-Za-z_-]{20,}`, "g"), REPLACEMENT],
  [/AQE/i, new RegExp(String.raw`${TOKEN_START}AQE[^${WS}"'\x60]{40,}`, "g"), REPLACEMENT],
  [/v/i, /(v[01](?:=|%3D))[A-Za-z0-9]{32,}/gi, `$1${REPLACEMENT}`],
  // The needle is PHP's: a bare "otp 123456" in text without "in" anywhere is not scanned on either side.
  [
    /in/i,
    new RegExp(String.raw`${TOKEN_START}((?:${anyCase("pin", "otp", "cvc", "cvv", "cvv2", "cvc2")})\b[ \t]{1,4}(?:(?:${anyCase("code", "number", "is")})[ \t]{1,4})?)\d{3,8}\b`, "g"),
    `$1${REPLACEMENT}`
  ],
  [/bot/i, new RegExp(String.raw`${TOKEN_START}bot(\d{5,}):[A-Za-z0-9_-]{20,}`, "g"), `bot$1:${REPLACEMENT}`],
  [/jsessionid/i, new RegExp(String.raw`;jsessionid=[^;?#\/${WS}"']+`, "gi"), `;jsessionid=${REPLACEMENT}`],
  [/-u/i, new RegExp(String.raw`([${WS}](?:-u|--user)[${WS}]+[^${WS}:'"]+):[^${WS}'"]+`, "g"), `$1:${REPLACEMENT}`],
  [/earer/i, new RegExp(String.raw`${TOKEN_START}(Bearer)[${WS}]+[A-Za-z0-9._~+\/-]{1,4096}=*`, "gi"), `$1 ${REPLACEMENT}`],
  [/asic/i, new RegExp(String.raw`${TOKEN_START}(Basic)[${WS}]+[A-Za-z0-9._~+\/-]{1,4096}=*`, "gi"), `$1 ${REPLACEMENT}`]
];
var COOKIE_LINE = new RegExp(String.raw`${TOKEN_START}(?<head>(?:set-)?cookie[${WS}]*:[${WS}]*)(?<value>(?:[^\r\n\\]|\\(?![nr]|u000[ad]))*)`, "gi");
var COOKIE_PAIR = new RegExp(String.raw`(?<![^=;${WS}])([^=;${WS}]+)=([^;\r\n]*)`, "g");
var TRACE_PROBE = /(?<![^\n])#\d+ /;
var TRACE_ARGUMENTS = /(?<![^\n])(#\d+ [^\r\n(]{0,1024}\(\d+\): [^\r\n(]{1,512})\([^\r\n]*\)[ \t]*(?![^\n])/g;
var ENCODED_JSON = /"\{\\(?:"|u0022)/g;
var SECRET_LIST = /(?<![A-Za-z0-9_.-])(?<quote>["'`]?)(?<key>[A-Za-z0-9_.-]{1,64})\k<quote>[ \t\r\n]{0,64}[:=][ \t\r\n]{0,64}\[/g;
var URL = new RegExp(String.raw`\b[a-z][a-z0-9+.\-]{0,20}:\/\/[^${WS}"'\x60<>\[\](){}]+`, "gi");
var PATH_PROBE = new RegExp(String.raw`(?:^|[${WS}"'\x60(=])\/[^${WS}\/]+\/(?<run>[^${WS}"'\x60<>]{1,16})`, "g");
var PATH = new RegExp(String.raw`(?<=^|[${WS}"'\x60(=])\/(?!\/)[^${WS}"'\x60<>\[\](){}]+`, "g");
var URL_PREFIX = new RegExp(String.raw`^(?<scheme>[a-z][a-z0-9+.\-]*:\/\/)?(?:(?<user>[^\/?#@:${WS}]{0,128}):(?<pass>[^\/?#@${WS}]{1,256})@)?`, "i");
var CARD_RUN = /(?<!\d)\d+(?:[ ./\-\u00A0\u2009\u202F]\d+){0,7}(?!\d)/g;
var UNESCAPE = /\\(?:[\\"/nrt]|u00(?:22|27|26|3[CEce]))/g;
var UNESCAPES = {
  "\\\\": "\\",
  '\\"': '"',
  "\\/": "/",
  "\\n": "\n",
  "\\r": "\r",
  "\\t": "	",
  "\\u0022": '"',
  "\\u0027": "'",
  "\\u0026": "&",
  "\\u003C": "<",
  "\\u003E": ">",
  "\\u003c": "<",
  "\\u003e": ">"
};
var ESCAPES = { "\\": "\\\\", '"': '\\"', "\n": "\\n", "\r": "\\r", "	": "\\t" };
var ESCAPED_KEY_PREFIX = new RegExp(`^(?:[nrt]|${HEX_ESCAPE})`);
var ULID = /^[0-7][0-9A-HJKMNP-TV-Z]{25}(?=\n?$)/;
var UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-8][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}(?=\n?$)/i;
var SLUG = /^[a-z0-9]+(?:[-_.][a-z0-9]{1,15})+(?=\n?$)/;
var PREFIXED_ID = /^[a-z]{2,8}_[A-Za-z0-9]{6,32}(?=\n?$)/;
var HEX = /^[0-9a-f]+(?=\n?$)/i;
var BACKSLASH_OR_DOUBLE = /[\\"]/g;
var BACKSLASH_OR_SINGLE = /[\\']/g;
var LIST_SYNTAX = /["'[\]]/g;
function replaceEach(value, pattern, replace) {
  let out = "";
  let copied = 0;
  let matched = false;
  for (const match of value.matchAll(pattern)) {
    matched = true;
    out += value.slice(copied, match.index) + replace({ text: match[0], at: match.index, groups: match.groups ?? {} });
    copied = match.index + match[0].length;
  }
  return matched ? out + value.slice(copied) : value;
}
function indexOf(value, pattern, from) {
  pattern.lastIndex = from;
  return pattern.exec(value)?.index ?? value.length;
}
function asciiLower(value) {
  return value.replace(/[A-Z]+/g, (upper) => upper.toLowerCase());
}
function segments(key) {
  return asciiLower(key.replace(/([a-z0-9])([A-Z])/g, "$1 $2")).split(/[^a-z0-9]+/).filter((segment) => segment !== "");
}
function normalize(key) {
  return asciiLower(key).replace(/[^a-z0-9]/g, "");
}
function nameOf(key) {
  return /^(?:0|-?[1-9][0-9]{0,18})$/.test(key) && BigInt(key) >= -(2n ** 63n) && BigInt(key) < 2n ** 63n ? null : key;
}
function keyAt(value, key, at, test) {
  return test(key) || at > 0 && value[at - 1] === "\\" && test(key.replace(ESCAPED_KEY_PREFIX, ""));
}
function cardExempt(key) {
  if (key === null) return false;
  const parts = segments(key);
  const last = parts[parts.length - 1];
  return last === "id" || last === "ids" || CARD_EXEMPT_KEYS.has(parts.join(""));
}
function luhn(digits) {
  if (digits.length < 13 || digits.length > 19 || !/^[0-9]+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = digits.charCodeAt(digits.length - 1 - i) - 48;
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
function secretSegment(segment) {
  const length = utf8Bytes(segment);
  if (length < 16 || ULID.test(segment) || UUID.test(segment) || SLUG.test(segment) && !/[a-z0-9]{21,}/.test(segment) || PREFIXED_ID.test(segment) || /^[0-9]+$/.test(segment)) {
    return false;
  }
  const upper = /[A-Z]/.test(segment);
  const lower = /[a-z]/.test(segment);
  const digit = /\d/.test(segment);
  return upper && lower && digit || length >= 20 && (upper && lower || HEX.test(segment) || digit && (upper || lower) || /[+/=%]/.test(segment));
}
function urlParts(url) {
  const prefix = URL_PREFIX.exec(url);
  const scheme = prefix.groups?.scheme ?? "";
  const user = prefix.groups?.user ?? "";
  const pass = prefix.groups?.pass ?? "";
  const userinfo = pass !== "" && utf8Bytes(user) <= 128 && utf8Bytes(pass) <= 256;
  const rest = url.slice(userinfo ? prefix[0].length : scheme.length);
  const cut = rest.search(/[?#]/);
  const parts = (cut === -1 ? rest : rest.slice(0, cut)).split("/");
  for (let i = 0; i < parts.length; i++) {
    if ((scheme === "" || i > 0) && secretSegment(parts[i].split(";")[0])) parts[i] = REPLACEMENT;
  }
  return scheme + (userinfo ? `${user}:${REPLACEMENT}@` : "") + parts.join("/") + (cut === -1 ? "" : rest.slice(cut));
}
function hasLongPath(value) {
  for (const match of value.matchAll(PATH_PROBE)) {
    if (utf8Bytes(match.groups.run) >= 16) return true;
  }
  return false;
}
function urls(value) {
  if (value.includes("://")) value = replaceEach(value, URL, (m) => urlParts(m.text));
  if (hasLongPath(value)) value = replaceEach(value, PATH, (m) => urlParts(m.text));
  return value;
}
function afterClosingBracket(value, open) {
  let depth = 0;
  let quote = null;
  for (let i = open; i < value.length; ) {
    if (quote !== null) {
      i = indexOf(value, quote === '"' ? BACKSLASH_OR_DOUBLE : BACKSLASH_OR_SINGLE, i);
      if (i >= value.length) break;
      if (value[i] === "\\") {
        i += 2;
        continue;
      }
      quote = null;
      i++;
      continue;
    }
    i = indexOf(value, LIST_SYNTAX, i);
    if (i >= value.length) break;
    const char = value[i++];
    if (char === '"' || char === "'") quote = char;
    else if (char === "[") depth++;
    else if (--depth === 0) return i;
  }
  return value.length;
}
function scrubCards(value) {
  if (!/\d{4}/.test(value)) return value;
  return replaceEach(value, CARD_RUN, ({ text: text2 }) => {
    if (text2.replace(/\D+/g, "").length < 13) return text2;
    const groups = [...text2.matchAll(/\d+/g)].map((group) => ({ digits: group[0], at: group.index }));
    const spans = [];
    next: for (let i = 0; i < groups.length; i++) {
      let digits = "";
      for (let j = i; j < groups.length && digits.length + groups[j].digits.length <= 19; j++) {
        digits += groups[j].digits;
        if (digits.length >= 13 && luhn(digits)) {
          spans.push([groups[i].at, groups[j].at + groups[j].digits.length]);
          i = j;
          continue next;
        }
      }
      const group = groups[i];
      if (group.digits.length > 19) spans.push([group.at, group.at + group.digits.length]);
    }
    let run = text2;
    for (const [from, to] of spans.reverse()) run = run.slice(0, from) + REPLACEMENT + run.slice(to);
    return run;
  });
}
function cutAtTextCap(value) {
  value = truncateUtf8(value, MAX_TEXT_BYTES);
  let start2 = value.length;
  while (start2 > 0 && value.length - start2 <= MAX_CUT_TOKEN_BYTES && !" 	\r\n".includes(value[start2 - 1])) start2--;
  const partial = Math.min(utf8Bytes(value.slice(start2)), MAX_CUT_TOKEN_BYTES);
  return truncateUtf8(value, utf8Bytes(value) - partial) + REPLACEMENT;
}
function fitsEncoded(value, begin, end) {
  const length = end - begin;
  return length <= MAX_ENCODED_BYTES / 3 || length <= MAX_ENCODED_BYTES && utf8Bytes(value.slice(begin, end)) <= MAX_ENCODED_BYTES;
}
var Scrubber = class _Scrubber {
  keys;
  verdicts = /* @__PURE__ */ new Map();
  decodes = 0;
  constructor(keys) {
    this.keys = new Set(keys.map(normalize).filter((key) => key !== ""));
  }
  static withDefaults(extra) {
    return new _Scrubber([...DEFAULT_KEYS, ...extra]);
  }
  keyed(value, parent) {
    try {
      return value !== null && typeof value === "object" ? this.walk(value, 0, parent ?? null) : this.item(null, value, 0, parent ?? null);
    } catch {
      return REPLACEMENT;
    }
  }
  text(value, cards = true) {
    try {
      return this.scrub(value, cards, 0);
    } catch {
      return REPLACEMENT;
    }
  }
  url(value) {
    try {
      return this.text(value.includes("://") ? value : urlParts(value));
    } catch {
      return REPLACEMENT;
    }
  }
  matchesKey(key, parent) {
    const id = `${parent ?? ""}\0${key}`;
    let verdict = this.verdicts.get(id);
    if (verdict === void 0) {
      verdict = this.decide(key, parent);
      this.verdicts.set(id, verdict);
    }
    return verdict;
  }
  walk(data, depth, parent) {
    if (Array.isArray(data)) return data.map((value) => this.item(null, value, depth, parent));
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, this.item(nameOf(key), value, depth, parent)]));
  }
  item(name, value, depth, parent) {
    if (value === null || typeof value === "boolean") return value;
    if (name !== null && this.matchesKey(name, parent ?? void 0)) return REPLACEMENT;
    if (typeof value === "object") return depth < MAX_DEPTH ? this.walk(value, depth + 1, name ?? parent) : REPLACEMENT;
    if (typeof value === "string") return this.text(value, !cardExempt(name));
    if (Number.isInteger(value) && value >= 1e12 && value < 1e19 && !cardExempt(name) && (value > Number.MAX_SAFE_INTEGER || luhn(String(value)))) {
      return REPLACEMENT;
    }
    return value;
  }
  scrub(value, cards, depth) {
    if (value.length < 6 && utf8Bytes(value) < 6) return value;
    if (value.length > MAX_TEXT_BYTES / 3 && utf8Bytes(value) > MAX_TEXT_BYTES) value = cutAtTextCap(value);
    if (depth === 0) this.decodes = 0;
    if (value.includes("\\/")) value = value.replace(/(?<!\\)\\\//g, "/");
    if (value.includes("#") && TRACE_PROBE.test(value)) value = value.replace(TRACE_ARGUMENTS, "$1(...)");
    value = urls(value);
    if (value.includes(":") && HEADER_PROBE.test(value)) {
      value = replaceEach(
        value,
        HEADER_LINE,
        ({ text: text2, groups }) => this.matchesKey(groups.key) && !/^(?:Bearer|Basic)\b/i.test(groups.value) ? groups.head + REPLACEMENT : text2
      );
    }
    for (const [needle, pattern, replacement] of TOKENS) {
      if (needle.test(value)) value = value.replace(pattern, replacement);
    }
    if (/cookie/i.test(value)) {
      value = replaceEach(value, COOKIE_LINE, ({ groups }) => groups.head + groups.value.replace(COOKIE_PAIR, `$1=${REPLACEMENT}`));
    }
    if (value.includes('"{\\"') || value.includes('"{\\u0022')) value = this.encodedJson(value, depth);
    if (value.includes("[")) value = this.secretLists(value);
    if (/[=:]/.test(value) || / like /i.test(value)) value = this.pairs(value, depth);
    if (value.includes(":") && value.includes("=")) value = this.colonValuesWithEquals(value);
    if (depth === 0 && (value.includes('\\"') || /\\u00/i.test(value))) {
      const ascii = value.replace(/\\u00([2-7][0-9a-f])/gi, (_, hex2) => String.fromCharCode(parseInt(hex2, 16)));
      const flat = ascii.replace(/(?<!\\)\\+(?=["'])/g, "");
      const scrubbedFlat = this.pairs(flat, MAX_TEXT_DEPTH);
      if (scrubbedFlat !== flat) value = scrubbedFlat;
    }
    if (value.includes(`${REPLACEMENT}=`)) value = value.replace(SCRUBBED_TAIL, REPLACEMENT);
    if (value.includes("</") || /\\u003C\//i.test(value)) {
      value = replaceEach(value, XML_ELEMENT, ({ text: text2, groups }) => this.matchesKey(groups.key) ? groups.head + REPLACEMENT + groups.tail : text2);
    }
    return cards ? scrubCards(value) : value;
  }
  encodedJson(value, depth) {
    let out = "";
    let copied = 0;
    let from = 0;
    for (; ; ) {
      ENCODED_JSON.lastIndex = from;
      const found = ENCODED_JSON.exec(value);
      if (found === null) break;
      const begin = found.index + 1;
      let end = value.length;
      for (let i = begin; i < value.length; ) {
        i = indexOf(value, BACKSLASH_OR_DOUBLE, i);
        if (i >= value.length) break;
        if (value[i] === "\\") {
          i += 2;
          continue;
        }
        end = i;
        break;
      }
      const fits = end < value.length && fitsEncoded(value, begin, end);
      out += value.slice(copied, begin) + (fits ? this.escapedText(value.slice(begin, end), depth + 1) : REPLACEMENT);
      copied = end;
      from = Math.min(end + 1, value.length);
    }
    return copied === 0 ? value : out + value.slice(copied);
  }
  escapedText(escaped, depth) {
    if (depth > MAX_TEXT_DEPTH || ++this.decodes > MAX_DECODES) return REPLACEMENT;
    const decoded = escaped.replace(UNESCAPE, (sequence) => UNESCAPES[sequence]);
    const scrubbed2 = this.scrub(decoded, true, depth);
    return scrubbed2 === decoded ? escaped : scrubbed2.replace(/[\\"\n\r\t]/g, (char) => ESCAPES[char]);
  }
  secretLists(value) {
    const opens = [];
    for (const match of value.matchAll(SECRET_LIST)) {
      if (this.matchesKeyAt(value, match.groups.key, match.index + match.groups.quote.length)) opens.push(match.index + match[0].length - 1);
    }
    if (opens.length === 0) return value;
    let out = "";
    let copied = 0;
    for (const open of opens) {
      if (open < copied) continue;
      out += value.slice(copied, open) + REPLACEMENT;
      copied = afterClosingBracket(value, open);
    }
    return out + value.slice(copied);
  }
  pairs(value, depth) {
    return replaceEach(value, PAIR, ({ text: text2, at, groups }) => {
      const colon = groups.csep !== void 0;
      const separator = (colon ? groups.csep : groups.sep) ?? "";
      const raw = (colon ? groups.cvalue : groups.value) ?? "";
      const key = groups.key;
      const queryOnly = at > 0 && QUERY_SEPARATORS.has(value[at - 1]) && QUERY_ONLY_KEYS.has(normalize(key));
      const quote = QUOTES.has(raw[0] ?? "") ? raw[0] : raw.startsWith("\\u0022") || raw.startsWith("\\u0027") ? raw.slice(0, 6) : "";
      if ((queryOnly || this.matchesKeyAt(value, key, at)) && !/^(?:Bearer|Basic)$/i.test(raw)) {
        return key + separator + quote + REPLACEMENT + quote;
      }
      if (quote === "" || depth >= MAX_TEXT_DEPTH) return text2;
      const inner = truncateUtf8(raw, utf8Bytes(raw) - quote.length).slice(quote.length);
      if (!/[=:[{]/.test(inner)) return text2;
      return key + separator + quote + (inner.includes('\\"') ? this.escapedText(inner, depth + 1) : this.pairs(inner, depth + 1)) + quote;
    });
  }
  colonValuesWithEquals(value) {
    return replaceEach(
      value,
      COLON_VALUE_WITH_EQUALS,
      ({ text: text2, at, groups }) => this.matchesKeyAt(value, groups.key, at) ? groups.key + groups.separator + REPLACEMENT : text2
    );
  }
  matchesKeyAt(value, key, at) {
    return keyAt(value, key, at, (k) => this.matchesKey(k));
  }
  decide(key, parent) {
    if (this.verdicts.size > MAX_VERDICTS) this.verdicts.clear();
    const own = segments(truncateUtf8(key, 128));
    const count = own.length;
    const joined = own.join("");
    const last = own[count - 1] ?? "";
    if (count > 0 && this.keys.has(joined)) return true;
    if (count === 0 || SAFE_PREFIX.has(own[0]) || count > 1 && SAFE_SUFFIX.has(last) || SAFE_KEYS.has(joined)) return false;
    if (TERMINAL.has(last)) return true;
    if (last.length > 3 && last.endsWith("s") && this.keys.has(last.slice(0, -1))) return true;
    const inherited = parent === void 0 ? [] : segments(truncateUtf8(parent, 128)).slice(-2);
    const all = [...inherited, ...own];
    for (let start2 = 0; start2 < all.length; start2++) {
      let run = "";
      for (let end = start2; end < all.length; end++) {
        run += all[end];
        if (end >= inherited.length && this.keys.has(run)) return true;
      }
    }
    return false;
  }
};

// src/core/limits.ts
var LIMITS = {
  attributes: 128,
  attributeKeyChars: 128,
  attributeBytes: 4096,
  contextBytes: 65536,
  messageBytes: 32768,
  stringBytes: 8192,
  nameBytes: 2048,
  chain: 10,
  frames: 100,
  contextDepth: 6,
  contextItems: 200,
  contextNodes: 5e3,
  args: 50,
  capture: 2
};
var CUT_TOKEN_BYTES = 1024;
function utf8Bytes(value) {
  let bytes = 0;
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit < 128) bytes += 1;
    else if (unit < 2048) bytes += 2;
    else if (unit >= 55296 && unit <= 56319 && i + 1 < value.length && (value.charCodeAt(i + 1) & 64512) === 56320) {
      bytes += 4;
      i++;
    } else bytes += 3;
  }
  return bytes;
}
function truncateUtf8(value, bytes) {
  if (value.length <= bytes / 3 || utf8Bytes(value) <= bytes) return value;
  let used = 0;
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    const pair = unit >= 55296 && unit <= 56319 && i + 1 < value.length && (value.charCodeAt(i + 1) & 64512) === 56320;
    const size = unit < 128 ? 1 : unit < 2048 ? 2 : pair ? 4 : 3;
    if (used + size > bytes) return value.slice(0, i);
    used += size;
    if (pair) i++;
  }
  return value;
}
function cutUtf8(value, bytes) {
  if (value.length <= bytes / 3 || utf8Bytes(value) <= bytes) return value;
  if (bytes < REPLACEMENT.length) return "";
  const head = truncateUtf8(value, bytes - REPLACEMENT.length);
  let start2 = head.length;
  while (start2 > 0 && head.length - start2 <= CUT_TOKEN_BYTES && !" 	\r\n".includes(head[start2 - 1])) start2--;
  const partial = Math.min(utf8Bytes(head.slice(start2)), CUT_TOKEN_BYTES);
  return truncateUtf8(head, utf8Bytes(head) - partial) + REPLACEMENT;
}
function attributeKey(key) {
  const normalized = key.replace(/[A-Z]+/g, (upper) => upper.toLowerCase()).replace(/[^a-z0-9_.]+/g, "_").replace(/^_+|_+$/g, "").slice(0, LIMITS.attributeKeyChars);
  return normalized === "" ? null : normalized;
}
function attributes(input, scrubber) {
  const out = {};
  let count = 0;
  for (const [raw, value] of Object.entries(input)) {
    const key = attributeKey(raw);
    const string = attributeString(value);
    if (key === null || string === void 0) continue;
    if (!Object.hasOwn(out, key)) {
      if (count >= LIMITS.attributes) continue;
      count++;
    }
    out[key] = scrubbed(raw, key, string, scrubber);
  }
  return out;
}
function scrubbed(raw, key, value, scrubber) {
  if (scrubber.matchesKey(raw) || scrubber.matchesKey(key)) return REPLACEMENT;
  return truncateUtf8(scrubber.text(value), LIMITS.attributeBytes);
}
function boundAttributes(input) {
  const out = {};
  let count = 0;
  for (const [key, value] of Object.entries(input)) {
    if (count >= LIMITS.attributes) break;
    if (key.length > LIMITS.attributeKeyChars * LIMITS.capture) continue;
    const kept = value === null || value === void 0 || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value);
    out[key] = kept ? value : cutUtf8(attributeString(value), LIMITS.attributeBytes * LIMITS.capture);
    count++;
  }
  return out;
}
function attributeString(value) {
  if (value === null || value === void 0) return void 0;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  return JSON.stringify(toJson(value));
}
function readError(value) {
  if (typeof value !== "object" || value === null) return void 0;
  try {
    const record2 = value;
    const real = value instanceof Error || Object.prototype.toString.call(value) === "[object Error]";
    const { message, stack, code: code2, name, errors } = record2;
    if (!real && !(typeof message === "string" && typeof stack === "string")) return void 0;
    const type = errorType(name, real ? constructorName(value) : void 0, stack);
    return {
      type,
      message: typeof message === "string" ? message : message === void 0 ? "" : safeString(message),
      ...typeof code2 === "string" || typeof code2 === "number" ? { code: String(code2) } : {},
      ...typeof stack === "string" ? { stack } : {},
      cause: record2.cause,
      ...Array.isArray(errors) && (type === "AggregateError" || value instanceof AggregateError) ? { errors } : {}
    };
  } catch {
    return void 0;
  }
}
function errorType(name, constructor, stack) {
  if (typeof name === "string" && name !== "") {
    return name === "Error" && constructor !== void 0 && constructor.length > 2 ? constructor : name;
  }
  if (constructor !== void 0 && constructor.length > 0) return constructor;
  const header = typeof stack === "string" ? /^([A-Za-z_$][\w$.]*)(?::|\n|$)/.exec(stack) : null;
  return header?.[1] ?? "Error";
}
function constructorName(value) {
  const name = value.constructor?.name;
  return typeof name === "string" && name !== "" ? name : void 0;
}
function safeString(value) {
  try {
    return String(value);
  } catch {
    try {
      return Object.prototype.toString.call(value);
    } catch {
      return "[unprintable]";
    }
  }
}
function toJson(value, depth = 0) {
  let budget = LIMITS.contextNodes;
  const path = /* @__PURE__ */ new Set();
  const walk = (current, level) => {
    if (typeof current === "string") return cutUtf8(current, LIMITS.stringBytes * LIMITS.capture);
    if (typeof current === "number") return Number.isFinite(current) ? current : String(current);
    if (typeof current === "boolean" || current === null) return current;
    if (typeof current === "bigint") return String(current);
    if (typeof current !== "object") return void 0;
    if (budget-- <= 0) return "[truncated]";
    if (path.has(current)) return "[Circular]";
    if (level >= LIMITS.contextDepth) return `[${className(current)}]`;
    const error = readError(current);
    if (error) return errorSummary(error);
    if (current instanceof Date) return Number.isNaN(current.getTime()) ? "Invalid Date" : current.toISOString();
    if (current instanceof ArrayBuffer || ArrayBuffer.isView(current)) return `[${className(current)}]`;
    path.add(current);
    try {
      return children(current, level);
    } catch {
      return `[${className(current)}]`;
    } finally {
      path.delete(current);
    }
  };
  const children = (current, level) => {
    if (Array.isArray(current)) return current.slice(0, LIMITS.contextItems).map((item) => walk(item, level + 1) ?? null);
    if (current instanceof Set) return Array.from(current).slice(0, LIMITS.contextItems).map((item) => walk(item, level + 1) ?? null);
    if (current instanceof Map) return object(Array.from(current).map(([key, item]) => [safeString(key), item]), level);
    const toJSON = current.toJSON;
    if (typeof toJSON === "function") return walk(toJSON.call(current), level + 1);
    return object(Object.keys(current).map((key) => [key, current[key]]), level);
  };
  const object = (entries, level) => {
    const out = [];
    for (const [key, item] of entries.slice(0, LIMITS.contextItems)) {
      const json2 = walk(item, level + 1);
      if (json2 !== void 0) out.push([key, json2]);
    }
    return Object.fromEntries(out);
  };
  return walk(value, depth) ?? null;
}
function errorSummary(error) {
  return {
    type: cutUtf8(error.type, LIMITS.nameBytes * LIMITS.capture),
    message: cutUtf8(error.message, LIMITS.stringBytes * LIMITS.capture),
    ...error.code === void 0 ? {} : { code: cutUtf8(error.code, LIMITS.nameBytes * LIMITS.capture) }
  };
}
function className(value) {
  if (Array.isArray(value)) return "Array";
  try {
    return constructorName(value) ?? "Object";
  } catch {
    return "Object";
  }
}
function boundContext(context) {
  return fitJson(truncateStrings(context), LIMITS.contextBytes);
}
function fitJson(value, bytes) {
  return fit(value, bytes)[0];
}
function truncateStrings(value) {
  if (typeof value === "string") return truncateUtf8(value, LIMITS.stringBytes);
  if (Array.isArray(value)) return value.map((item) => truncateStrings(item));
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, truncateStrings(item)]));
  return value;
}
function jsonBytes(value) {
  return utf8Bytes(JSON.stringify(value));
}
function fit(data, limit) {
  const size = jsonBytes(data);
  if (size <= limit) return [data, size];
  const list = Array.isArray(data);
  const entries = list ? data.map((item, i) => [String(i), item]) : Object.entries(data);
  const keyCost = (key) => list ? 0 : jsonBytes(key) + 1;
  const costs = entries.map(([key, value], index) => ({ key, value, index, cost: jsonBytes(value) + 1 + keyCost(key) })).sort((a, b) => a.cost - b.cost);
  const budget = limit - 48;
  let used = 2;
  let dropped = 0;
  const kept = /* @__PURE__ */ new Map();
  for (const { key, value, index, cost } of costs) {
    if (used + cost <= budget) {
      kept.set(index, value);
      used += cost;
      continue;
    }
    const overhead = 1 + keyCost(key);
    const room = budget - used - overhead;
    if (room >= 64 && value !== null && typeof value === "object") {
      const [fitted, fittedBytes] = fit(value, room);
      kept.set(index, fitted);
      used += overhead + fittedBytes;
    } else if (room >= 64 && typeof value === "string") {
      kept.set(index, truncateEncoded(value, room));
      used += overhead + room;
    } else {
      dropped++;
    }
  }
  const ordered = entries.flatMap(([key], index) => kept.has(index) ? [[key, kept.get(index)]] : []);
  let result;
  if (list) {
    result = ordered.map(([, value]) => value);
    if (dropped > 0) result.push(`[${dropped} truncated]`);
  } else {
    result = Object.fromEntries(dropped > 0 ? [...ordered, ["observe.truncated", dropped]] : ordered);
  }
  const resultBytes = jsonBytes(result);
  if (resultBytes <= limit) return [result, resultBytes];
  const fallback = list ? [`[${entries.length} truncated]`] : { "observe.truncated": entries.length };
  return [fallback, jsonBytes(fallback)];
}
function truncateEncoded(value, room) {
  let bytes = room - 2;
  let cut = cutUtf8(value, bytes);
  while (cut !== "" && jsonBytes(cut) > room) {
    bytes = Math.floor(bytes * 2 / 3);
    cut = cutUtf8(value, bytes);
  }
  return cut;
}

// src/core/model.ts
var LEVELS = ["trace", "debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"];

// src/core/stack.ts
var FRAME = /^\s*at (?:(.+?) \((.+)\)|(.+))$/;
var STACK_CHARS = 65536;
var LINE_CHARS = 2048;
function parseV8Stack(stack) {
  const frames = [];
  for (const line of stack.slice(0, STACK_CHARS).split(/\r?\n/)) {
    if (frames.length >= LIMITS.frames) break;
    if (line.length > LINE_CHARS) continue;
    const frame2 = parseLine(line);
    if (frame2) frames.push(frame2);
  }
  return frames;
}
function parseLine(line) {
  const match = FRAME.exec(line);
  if (!match) return void 0;
  const [, named, inParens, bare] = match;
  const fn = named?.trim() || "<anonymous>";
  const place2 = location(inParens ?? bare.replace(/^async /, ""));
  return place2 && { function: fn, ...place2 };
}
function location(raw) {
  let place2 = raw.trim();
  for (let evalAt = /^eval at .*? \((.*)\), .*$/.exec(place2); evalAt; evalAt = /^eval at .*? \((.*)\), .*$/.exec(place2)) {
    place2 = evalAt[1];
  }
  if (place2 === "native" || place2 === "<anonymous>") return {};
  const position = /^(.+):(\d+):(\d+)$/.exec(place2) ?? /^(.+):(\d+)$/.exec(place2);
  if (!position) return void 0;
  const [, file, line, column] = position;
  if (file === "<anonymous>") return {};
  return { file, line: Number(line), ...column === void 0 ? {} : { column: Number(column) } };
}
function normalizeFrame(frame2, roots) {
  const placed = frame2.file === void 0 ? void 0 : place(frame2.file, roots);
  return {
    function: frame2.function,
    ...placed === void 0 ? {} : { file: placed.file },
    ...frame2.line === void 0 ? {} : { line: frame2.line },
    ...frame2.column === void 0 ? {} : { column: frame2.column },
    in_app: placed?.inApp ?? false
  };
}
var URL_PATH = /^([a-z][a-z0-9+.-]*):\/\/[^/?#]*([^?#]*)/i;
var ARCHIVE = /\/app\.asar(?:\.unpacked)?\//;
function place(raw, roots) {
  const slashed = raw.replace(/\\/g, "/");
  if (slashed.startsWith("node:") || slashed.startsWith("electron/js2c/")) return { file: slashed, inApp: false };
  const url = URL_PATH.exec(slashed);
  const web = url !== null && url[1].toLowerCase() !== "file";
  const path = url ? decode(url[2] || "/").replace(/^\/([A-Za-z]:\/)/, "$1") : slashed;
  const archive = ARCHIVE.exec(path);
  if (archive) return inApp(path.slice(archive.index + archive[0].length));
  for (const root of roots) {
    const rest = underRoot(path, root.replace(/\\/g, "/").replace(/\/+$/, ""));
    if (rest !== void 0) return inApp(rest);
  }
  if (web) return inApp(path.replace(/^\/+/, ""));
  return { file: path.slice(path.lastIndexOf("/") + 1), inApp: false };
}
function underRoot(path, root) {
  if (root === "") return void 0;
  const drive = /^[A-Za-z]:\//.test(root);
  const prefix = `${root}/`;
  const matches = drive ? path.toLowerCase().startsWith(prefix.toLowerCase()) : path.startsWith(prefix);
  return matches ? path.slice(prefix.length) : void 0;
}
function inApp(file) {
  return { file, inApp: !/(?:^|\/)node_modules\//.test(file) && !file.startsWith("node:") && !file.includes("electron/js2c/") };
}
function decode(path) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

// src/core/capture.ts
function errorDraft(error, how, env2) {
  const wall = env2.clock.wallMs();
  const context = contextOf(how.context);
  const fields = readError(error);
  const exceptions = fields ? chain(error, fields, context) : thrown(error, how.mechanism, context);
  return {
    kind: "error",
    id: uuidv7(wall),
    time_us: micros(wall),
    handled: how.handled,
    mechanism: how.mechanism,
    exceptions,
    ...how.groupingKey === void 0 ? {} : { grouping_key: cutUtf8(how.groupingKey, LIMITS.nameBytes * LIMITS.capture) },
    attributes: boundAttributes(how.attributes ?? {}),
    context: fitJson(context, LIMITS.contextBytes * LIMITS.capture)
  };
}
function chain(error, first, context) {
  const exceptions = [exception(first)];
  const seen = /* @__PURE__ */ new Set([error]);
  const aggregate = [];
  let current = first;
  while (exceptions.length < LIMITS.chain) {
    const next = current.errors ? current.errors[0] : current.cause;
    for (const other of current.errors?.slice(1, LIMITS.contextItems) ?? []) aggregate.push(summary(other));
    if (next === void 0 || next === null || seen.has(next)) break;
    seen.add(next);
    const fields = readError(next);
    if (!fields) {
      context.cause = toJson(next, 1);
      break;
    }
    exceptions.push(exception(fields));
    current = fields;
  }
  if (aggregate.length > 0) context.aggregate = aggregate;
  return exceptions;
}
function exception(fields) {
  return {
    type: cutUtf8(fields.type, LIMITS.nameBytes * LIMITS.capture),
    message: cutUtf8(fields.message, LIMITS.messageBytes * LIMITS.capture),
    ...fields.code === void 0 ? {} : { code: cutUtf8(fields.code, LIMITS.nameBytes * LIMITS.capture) },
    frames: fields.stack === void 0 ? [] : parseV8Stack(fields.stack)
  };
}
function summary(value) {
  const fields = readError(value);
  return fields ? errorSummary(fields) : { type: "NonErrorThrow", message: cutUtf8(safeString(value), LIMITS.stringBytes * LIMITS.capture) };
}
function thrown(value, mechanism, context) {
  context.thrown = toJson(value, 1);
  return [
    {
      type: mechanism === "unhandledrejection" ? "UnhandledRejection" : "NonErrorThrow",
      message: cutUtf8(safeString(value), LIMITS.messageBytes * LIMITS.capture),
      frames: []
    }
  ];
}
function contextOf(context) {
  if (context === void 0) return {};
  const json2 = toJson(context);
  return json2 !== null && typeof json2 === "object" && !Array.isArray(json2) ? json2 : { value: json2 };
}
var SEVERE = LEVELS.indexOf("error");
function fromLogCall(call, env2) {
  const wall = call.wallMs ?? env2.clock.wallMs();
  const severe = LEVELS.indexOf(call.level) >= SEVERE;
  const text2 = [];
  const args = [];
  let error;
  for (const arg of call.args) {
    if (typeof arg === "function") continue;
    if (typeof arg !== "object" || arg === null) {
      text2.push(safeString(arg));
      continue;
    }
    const fields = severe && error === void 0 ? readError(arg) : void 0;
    if (fields) {
      error = arg;
      text2.push(fields.message);
    } else if (args.length < LIMITS.args) {
      args.push(toJson(arg));
    }
  }
  const firstString = call.args.find((arg) => typeof arg === "string");
  const explicit = call.channel === void 0 ? void 0 : cutUtf8(call.channel, LIMITS.nameBytes * LIMITS.capture);
  const channel = explicit ?? (firstString === void 0 ? void 0 : channelOf(firstString));
  const linked = error === void 0 ? void 0 : errorDraft(
    error,
    { mechanism: "log", handled: true, attributes: call.attributes, context: call.context },
    { clock: { wallMs: () => wall, monoMs: () => env2.clock.monoMs() } }
  );
  const log2 = {
    kind: "log",
    id: uuidv7(wall),
    time_us: micros(wall),
    level: call.level,
    message: cutUtf8(text2.join(" "), LIMITS.messageBytes * LIMITS.capture),
    ...args.length > 0 ? { args: fitJson(args, LIMITS.messageBytes * LIMITS.capture) } : {},
    ...channel === void 0 ? {} : { channel },
    ...linked === void 0 ? {} : { error_id: linked.id },
    attributes: boundAttributes(call.attributes ?? {}),
    context: fitJson(contextOf(call.context), LIMITS.contextBytes * LIMITS.capture)
  };
  return linked === void 0 ? [log2] : [log2, linked];
}
function channelOf(message) {
  const tag = /^\s*\[([A-Za-z0-9_.:-]{1,64})\]/.exec(message)?.[1];
  return tag !== void 0 && /[A-Za-z]/.test(tag) ? tag.toLowerCase() : void 0;
}

// src/core/journal.ts
var SUFFIX = { open: "open", sealed: "seg" };
function segmentKey(name, state) {
  return `${name.batchId}.${name.class}.${SUFFIX[state]}`;
}
function parseSegmentKey(key) {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  const [batchId, cls, suffix] = parts;
  if (uuidv7Ms(batchId) === null) return null;
  if (cls !== "errors" && cls !== "logs") return null;
  const state = suffix === "open" ? "open" : suffix === "seg" ? "sealed" : null;
  if (state === null) return null;
  return { name: { batchId, class: cls }, state };
}
var FORMAT_VERSION = 1;
function parseObject(text2) {
  try {
    const value = JSON.parse(text2);
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
function readBatch(name, text2) {
  const [first = "", ...rest] = text2.split("\n");
  const header = parseObject(first);
  if (header === null) return { kind: "corrupt" };
  if (typeof header.v === "number" && header.v > FORMAT_VERSION) return { kind: "future" };
  const resource = header.resource;
  if (header.v !== FORMAT_VERSION || header.batch_id !== name.batchId || typeof resource !== "object" || resource === null || Array.isArray(resource)) {
    return { kind: "corrupt" };
  }
  if (rest.at(-1) === "") rest.pop();
  const lines = [];
  let skipped = 0;
  for (const line of rest) {
    if (parseObject(line) === null) skipped++;
    else lines.push(line);
  }
  return { kind: "batch", batch: { name, resourceJson: JSON.stringify(resource), lines, skipped } };
}
function encodeEnvelope(batch, sentAtUs) {
  return `{"batch_id":"${batch.name.batchId}","sent_at_us":${sentAtUs},"resource":${batch.resourceJson},"${batch.name.class}":[${batch.lines.join(",")}]}`;
}
var JOURNAL_POLICY = {
  sealAfterMs: { errors: 1e3, logs: 3e4 },
  maxItems: 500,
  maxSegmentBytes: 512 * 1024,
  syncEveryMs: 5e3,
  orphanAfterMs: 3e4,
  maxAgeMs: 6 * 864e5,
  capBytes: 50 * 1024 * 1024,
  capFiles: 2e3
};
var EVICTION_ORDER = ["logs", "errors"];
var SEND_ORDER = { errors: 0, logs: 1 };
function noDrops() {
  return { evicted: 0, expired: 0, corrupt: 0, failed: 0 };
}
var Journal = class {
  constructor(store, resourceJson, policy, clock) {
    this.store = store;
    this.resourceJson = resourceJson;
    this.policy = policy;
    this.clock = clock;
  }
  open = /* @__PURE__ */ new Map();
  mine = /* @__PURE__ */ new Set();
  held = /* @__PURE__ */ new Set();
  future = /* @__PURE__ */ new Set();
  sealing = /* @__PURE__ */ new Map();
  bornMono = /* @__PURE__ */ new Map();
  torn = /* @__PURE__ */ new Map();
  maintaining = null;
  drops = noDrops();
  append(cls, line) {
    const text2 = `${line}
`;
    const bytes = utf8Bytes(text2);
    const current = this.open.get(cls);
    if (current && current.bytes + bytes > this.policy.maxSegmentBytes) void this.seal(cls);
    let segment = this.open.get(cls);
    try {
      segment ??= this.create(cls);
      segment.writer.append(text2);
    } catch {
      this.drops.failed++;
      if (segment) void this.seal(cls);
      return;
    }
    segment.items++;
    segment.bytes += bytes;
    segment.dirty = true;
    if (cls === "errors") this.scheduleSync(segment);
    if (segment.items >= this.policy.maxItems || segment.bytes >= this.policy.maxSegmentBytes) void this.seal(cls);
  }
  tick() {
    const now = this.clock.monoMs();
    for (const [cls, segment] of [...this.open]) {
      if (now - segment.openedMono >= this.policy.sealAfterMs[cls]) void this.seal(cls);
      else if (segment.dirty && now - segment.lastSyncMono >= this.policy.syncEveryMs) void this.sync(segment);
    }
  }
  async sealAll() {
    for (const cls of [...this.open.keys()]) void this.seal(cls);
    await Promise.all(this.sealing.values());
  }
  syncAllNow() {
    for (const segment of [...this.open.values(), ...this.sealing.keys()]) {
      try {
        segment.writer.syncNow();
        segment.dirty = false;
        segment.lastSyncMono = this.clock.monoMs();
      } catch {
      }
    }
  }
  maintain(orphanAfterMs) {
    this.maintaining ??= this.sweep(orphanAfterMs).finally(() => {
      this.maintaining = null;
    });
    return this.maintaining;
  }
  async sendable() {
    const segments2 = [];
    for (const key of await this.store.names()) {
      const parsed = parseSegmentKey(key);
      if (parsed?.state === "sealed" && !this.future.has(key)) segments2.push({ key, ...parsed });
    }
    return segments2.sort((a, b) => SEND_ORDER[a.name.class] - SEND_ORDER[b.name.class] || (a.key < b.key ? -1 : 1));
  }
  hold(segment) {
    this.held.add(segment.key);
  }
  release(segment) {
    this.held.delete(segment.key);
  }
  async load(segment) {
    const text2 = await this.store.read(segment.key);
    if (text2 === null) return null;
    const result = readBatch(segment.name, text2);
    switch (result.kind) {
      case "future":
        this.future.add(segment.key);
        return null;
      case "corrupt":
        await this.remove(segment);
        this.drops.corrupt++;
        return null;
      case "batch":
        if (result.batch.skipped > 0) this.torn.set(segment.name.batchId, result.batch.skipped);
        if (result.batch.lines.length > 0) return result.batch;
        await this.remove(segment);
        return null;
    }
  }
  async remove(segment) {
    await this.store.remove(segment.key);
    this.drops.corrupt += this.torn.get(segment.name.batchId) ?? 0;
    this.forget(segment.name.batchId);
  }
  takeDrops() {
    const drops = this.drops;
    this.drops = noDrops();
    return drops;
  }
  create(cls) {
    const name = { batchId: uuidv7(this.clock.wallMs()), class: cls };
    const key = segmentKey(name, "open");
    const header = `{"v":${FORMAT_VERSION},"batch_id":"${name.batchId}","resource":${this.resourceJson}}
`;
    const writer = this.store.create(key, header);
    const now = this.clock.monoMs();
    const segment = { key, name, writer, openedMono: now, items: 0, bytes: utf8Bytes(header), dirty: false, syncQueued: false, lastSyncMono: now };
    this.open.set(cls, segment);
    this.mine.add(key);
    this.bornMono.set(name.batchId, now);
    return segment;
  }
  scheduleSync(segment) {
    if (segment.syncQueued) return;
    segment.syncQueued = true;
    queueMicrotask(() => {
      segment.syncQueued = false;
      void this.sync(segment);
    });
  }
  async sync(segment) {
    if (this.open.get(segment.name.class) !== segment) return;
    segment.dirty = false;
    segment.lastSyncMono = this.clock.monoMs();
    try {
      await segment.writer.sync();
    } catch {
      segment.dirty = true;
    }
  }
  seal(cls) {
    const segment = this.open.get(cls);
    if (!segment) return Promise.resolve();
    this.open.delete(cls);
    const done = this.finishSeal(segment).finally(() => {
      this.sealing.delete(segment);
      this.mine.delete(segment.key);
    });
    this.sealing.set(segment, done);
    return done;
  }
  async finishSeal(segment) {
    try {
      await segment.writer.sync();
    } catch {
    }
    try {
      await segment.writer.close();
    } catch {
    }
    try {
      await this.store.rename(segment.key, segmentKey(segment.name, "sealed"));
    } catch {
    }
  }
  forget(batchId) {
    this.bornMono.delete(batchId);
    this.torn.delete(batchId);
  }
  owned(key) {
    return this.mine.has(key) || this.held.has(key);
  }
  async sweep(orphanAfterMs) {
    let listing;
    try {
      listing = await this.store.list();
    } catch {
      return;
    }
    const now = this.clock.wallMs();
    const mono = this.clock.monoMs();
    const live = [];
    for (const { key, bytes: bytes2 } of listing) {
      const parsed = parseSegmentKey(key);
      if (parsed) live.push({ key, bytes: bytes2, ...parsed, bornMs: uuidv7Ms(parsed.name.batchId) ?? now });
    }
    const listed = new Set(live.map((entry) => entry.key));
    for (const key of this.future) if (!listed.has(key)) this.future.delete(key);
    const age = (entry) => {
      const born = this.bornMono.get(entry.name.batchId);
      return born === void 0 ? now - entry.bornMs : mono - born;
    };
    const orphaned = (entry) => entry.state === "sealed" || orphanAfterMs <= 0 || now - entry.bornMs >= orphanAfterMs;
    const kept = [];
    for (const entry of live) {
      if (this.owned(entry.key) || !orphaned(entry)) {
        kept.push(entry);
        continue;
      }
      const doomed = entry.bytes === 0 ? "corrupt" : age(entry) > this.policy.maxAgeMs ? "expired" : null;
      if (doomed) {
        if (await this.discard(entry)) this.drops[doomed]++;
        else kept.push(entry);
        continue;
      }
      if (entry.state === "open" && !await this.adopt(entry)) continue;
      kept.push(entry);
    }
    let bytes = kept.reduce((sum, entry) => sum + entry.bytes, 0);
    let files = kept.length;
    const candidates = EVICTION_ORDER.flatMap(
      (cls) => kept.filter((entry) => entry.name.class === cls && entry.state === "sealed").sort((a, b) => a.key < b.key ? -1 : 1)
    );
    for (const entry of candidates) {
      if (bytes <= this.policy.capBytes && files <= this.policy.capFiles) break;
      if (await this.discard(entry)) {
        this.drops.evicted++;
        bytes -= entry.bytes;
        files--;
      }
    }
  }
  async discard(entry) {
    if (this.owned(entry.key)) return false;
    try {
      await this.store.remove(entry.key);
      this.forget(entry.name.batchId);
      return true;
    } catch {
      return false;
    }
  }
  async adopt(entry) {
    const sealed = segmentKey(entry.name, "sealed");
    try {
      if (await this.store.rename(entry.key, sealed) === "missing") return false;
    } catch {
      return true;
    }
    entry.key = sealed;
    entry.state = "sealed";
    return true;
  }
};

// src/core/delivery.ts
function classify(reply) {
  if (reply === "network-error") return { kind: "failed" };
  const { status, retryAfterSeconds: seconds } = reply;
  switch (status) {
    case 202:
      return { kind: "accepted" };
    case 400:
    case 413:
    case 422:
      return { kind: "rejected", status };
    case 401:
    case 403:
      return { kind: "unauthorized" };
    case 429:
    case 503:
      return { kind: "throttled", retryAfterMs: seconds !== void 0 && Number.isFinite(seconds) && seconds >= 0 ? seconds * 1e3 : void 0 };
    default:
      return { kind: "failed" };
  }
}
var DELIVERY_POLICY = {
  baseBackoffMs: 5e3,
  maxBackoffMs: 3e5,
  unauthorizedPauseMs: 36e5,
  maxRetryAfterMs: 36e5,
  timeoutMs: 15e3
};
var MIN_RETRY_AFTER_MS = 1e3;
var MAX_TIMER_MS = 2 ** 31 - 1;
var RELIST_AFTER_MS = 1e4;
function backoffMs(failures, policy) {
  return Math.min(policy.maxBackoffMs, policy.baseBackoffMs * 2 ** Math.min(10, failures));
}
function nextHealth(health, outcome, nowMs, jitter, policy) {
  const failures = health.kind === "healthy" ? 0 : health.failures;
  switch (outcome.kind) {
    case "accepted":
      return { kind: "healthy" };
    case "rejected":
      return health;
    case "failed":
      return { kind: "backing-off", failures: failures + 1, untilMs: nowMs + backoffMs(failures, policy) * jitter };
    case "unauthorized":
      return { kind: "paused", reason: "unauthorized", failures, untilMs: nowMs + policy.unauthorizedPauseMs };
    case "throttled":
      if (outcome.retryAfterMs === void 0) {
        return { kind: "paused", reason: "throttled", failures: failures + 1, untilMs: nowMs + backoffMs(failures, policy) * jitter };
      }
      return {
        kind: "paused",
        reason: "throttled",
        failures,
        untilMs: nowMs + Math.min(Math.max(outcome.retryAfterMs, MIN_RETRY_AFTER_MS), policy.maxRetryAfterMs)
      };
  }
}
var Delivery = class {
  constructor(journal, transport, connectivity, policy, clock, random) {
    this.journal = journal;
    this.transport = transport;
    this.connectivity = connectivity;
    this.policy = policy;
    this.clock = clock;
    this.random = random;
  }
  health = { kind: "healthy" };
  running = null;
  rerun = null;
  offline = false;
  rejected = 0;
  spacing = /* @__PURE__ */ new Map();
  tick() {
    if (this.running) return;
    if (!this.connectivity.online()) {
      this.offline = true;
      return;
    }
    if (this.offline) {
      this.offline = false;
      this.wake();
    }
    if (this.allowed()) void this.start();
  }
  wake() {
    if (this.health.kind === "backing-off") this.health = { kind: "healthy" };
    this.spacing.clear();
  }
  drain(deadlineMs) {
    return this.untilDeadline(this.fresh(), deadlineMs);
  }
  takeRejected() {
    const rejected = this.rejected;
    this.rejected = 0;
    return rejected;
  }
  allowed() {
    return this.health.kind === "healthy" || this.clock.monoMs() >= this.health.untilMs;
  }
  // A pass already running may have listed the queue before the caller's last seal, so callers share the next pass.
  fresh() {
    if (!this.running) return this.start();
    this.rerun ??= this.running.then(() => {
      this.rerun = null;
      return this.running ?? this.start();
    });
    return this.rerun;
  }
  start() {
    const run = this.pump().finally(() => {
      this.running = null;
    });
    this.running = run;
    return run;
  }
  untilDeadline(run, deadlineMs) {
    const remaining = deadlineMs - this.clock.monoMs();
    if (remaining <= 0) return Promise.resolve(false);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), Math.min(remaining, MAX_TIMER_MS));
      void run.then((emptied) => {
        clearTimeout(timer);
        resolve(emptied);
      });
    });
  }
  async pump() {
    try {
      for (; ; ) {
        if (!this.sending()) return false;
        const segments2 = await this.journal.sendable();
        if (segments2.length === 0) return true;
        const listed = new Set(segments2.map((segment) => segment.key));
        for (const key of this.spacing.keys()) if (!listed.has(key)) this.spacing.delete(key);
        const listedMs = this.clock.monoMs();
        let attempted = false;
        for (const segment of segments2) {
          if (!this.sending()) return false;
          if ((this.spacing.get(segment.key)?.untilMs ?? 0) > this.clock.monoMs()) continue;
          await this.attempt(segment);
          attempted = true;
          if (this.clock.monoMs() - listedMs >= RELIST_AFTER_MS) break;
        }
        if (!attempted) return false;
      }
    } catch {
      return false;
    }
  }
  sending() {
    if (this.connectivity.online()) return this.allowed();
    this.offline = true;
    return false;
  }
  async attempt(segment) {
    this.journal.hold(segment);
    try {
      const batch = await this.journal.load(segment);
      if (batch === null) return;
      const outcome = await this.post(batch);
      this.health = nextHealth(this.health, outcome, this.clock.monoMs(), 0.8 + 0.4 * this.random(), this.policy);
      if (outcome.kind === "rejected") this.rejected++;
      if (outcome.kind === "accepted" || outcome.kind === "rejected") {
        this.spacing.delete(segment.key);
        await this.journal.remove(segment);
      } else this.space(segment);
    } catch {
      this.space(segment);
    } finally {
      this.journal.release(segment);
    }
  }
  async post(batch) {
    const json2 = encodeEnvelope(batch, micros(this.clock.wallMs()));
    try {
      return classify(await this.transport.post(json2, this.policy.timeoutMs));
    } catch {
      return classify("network-error");
    }
  }
  // Spacing runs from the end of any pause and starts at twice the first health backoff, so the next probe picks another segment.
  space(segment) {
    const attempts = (this.spacing.get(segment.key)?.attempts ?? 0) + 1;
    const fromMs = this.health.kind === "paused" ? this.health.untilMs : this.clock.monoMs();
    this.spacing.set(segment.key, { attempts, untilMs: fromMs + backoffMs(attempts, this.policy) });
  }
};

// src/core/hub.ts
var MAX_PENDING = 100;
var REGISTRY_KEY = Symbol.for("observe-js.hub");
function registry() {
  const slot = globalThis;
  let current = slot[REGISTRY_KEY];
  if (!current) {
    current = { hub: null, pending: [] };
    slot[REGISTRY_KEY] = current;
  }
  return current;
}
var preInitHub = {
  submit(draft) {
    return defer((hub) => hub.submit(draft));
  },
  setAttributes(attributes2) {
    defer((hub) => hub.setAttributes(attributes2));
  },
  flush() {
    return Promise.resolve(false);
  }
};
function defer(call) {
  const { pending } = registry();
  if (pending.length >= MAX_PENDING) return false;
  pending.push(call);
  return true;
}
var disabledHub = {
  submit: () => false,
  setAttributes: () => {
  },
  flush: () => Promise.resolve(false)
};
function installHub(hub) {
  const current = registry();
  if (current.hub) return false;
  current.hub = hub;
  for (const call of current.pending.splice(0)) {
    try {
      call(hub);
    } catch {
    }
  }
  return true;
}
function currentHub() {
  return registry().hub ?? preInitHub;
}
var env = { clock: systemClock };
function captureError(error, how, hub = currentHub()) {
  try {
    const draft = errorDraft(error, how, env);
    return hub.submit(draft) ? draft.id : void 0;
  } catch {
    return void 0;
  }
}
function captureException(error, options) {
  return captureError(error, {
    mechanism: "report",
    handled: options?.handled ?? true,
    attributes: options?.attributes,
    context: options?.context,
    groupingKey: options?.groupingKey
  });
}
function submitLog(submit, [log2, linked]) {
  if (linked === void 0 || submit(linked)) {
    submit(log2);
    return;
  }
  const { error_id: _, ...unlinked } = log2;
  submit(unlinked);
}
function log(level, message, options) {
  try {
    const hub = currentHub();
    submitLog((draft) => hub.submit(draft), fromLogCall({ level, args: [message], channel: options?.channel, attributes: options?.attributes, context: options?.context }, env));
  } catch {
  }
}
function setAttributes(attributes2) {
  try {
    currentHub().setAttributes({ ...attributes2 });
  } catch {
  }
}
function flush(options) {
  try {
    return currentHub().flush(options ?? {}).catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

// src/core/prepare.ts
function prepare(process2, draft, ctx) {
  const shared = {
    attributes: mergedAttributes(process2, draft, ctx),
    context: boundContext(asObject(ctx.scrubber.keyed(draft.context)))
  };
  const item = draft.kind === "error" ? errorItem(draft, ctx) : logItem(draft, ctx.scrubber);
  return JSON.stringify({ ...item, ...shared });
}
function mergedAttributes(process2, draft, ctx) {
  const entries = [["process.kind", process2]];
  for (const source of [ctx.scope, draft.attributes]) {
    for (const [key, value] of Object.entries(source)) {
      if (attributeKey(key) !== "process.kind") entries.push([key, value]);
    }
  }
  return attributes(Object.fromEntries(entries), ctx.scrubber);
}
function errorItem(draft, ctx) {
  return {
    id: draft.id,
    time_us: draft.time_us,
    handled: draft.handled,
    mechanism: draft.mechanism,
    exceptions: draft.exceptions.slice(0, LIMITS.chain).map((exception3) => exceptionItem(exception3, ctx)),
    ...draft.grouping_key === void 0 ? {} : { grouping_key: truncateUtf8(ctx.scrubber.text(draft.grouping_key), LIMITS.nameBytes) }
  };
}
function exceptionItem(exception3, ctx) {
  return {
    type: truncateUtf8(ctx.scrubber.text(exception3.type), LIMITS.nameBytes),
    message: truncateUtf8(ctx.scrubber.text(exception3.message), LIMITS.messageBytes),
    ...exception3.code === void 0 ? {} : { code: truncateUtf8(ctx.scrubber.text(exception3.code), LIMITS.nameBytes) },
    frames: exception3.frames.slice(0, LIMITS.frames).map((frame2) => frameItem(frame2, ctx))
  };
}
function frameItem(raw, ctx) {
  const frame2 = normalizeFrame(raw, ctx.roots);
  return {
    function: truncateUtf8(frame2.function, LIMITS.nameBytes),
    ...frame2.file === void 0 ? {} : { file: truncateUtf8(ctx.scrubber.url(frame2.file), LIMITS.nameBytes) },
    ...frame2.line === void 0 ? {} : { line: frame2.line },
    ...frame2.column === void 0 ? {} : { column: frame2.column },
    in_app: frame2.in_app
  };
}
function logItem(draft, scrubber) {
  const args = (draft.args ?? []).map((arg) => JSON.stringify(scrubber.keyed(arg)));
  const message = [scrubber.text(draft.message), ...args].filter((part) => part !== "").join(" ");
  const channel = draft.channel === void 0 || scrubber.text(draft.channel) !== draft.channel ? void 0 : truncateUtf8(draft.channel, LIMITS.nameBytes);
  return {
    id: draft.id,
    time_us: draft.time_us,
    level: draft.level,
    message: truncateUtf8(message, LIMITS.messageBytes),
    ...channel === void 0 ? {} : { channel },
    ...draft.error_id === void 0 ? {} : { error_id: draft.error_id }
  };
}
function asObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}

// src/core/client.ts
var CLIENT_POLICY = {
  errors: { burst: 20, perSecond: 1 },
  logs: { burst: 500, perSecond: 50 },
  duplicateWindowMs: 2e3,
  maintainEveryMs: 3e4,
  orphanAfterMs: 3e4,
  dropReportEveryMs: 6e4,
  warnEveryMs: 6e4,
  flushTimeoutMs: 3e3
};
var DROP_KINDS = ["evicted", "expired", "corrupt", "failed", "rejected"];
var Client = class {
  constructor(deps) {
    this.deps = deps;
    this.policy = deps.policy ?? CLIENT_POLICY;
    this.prepareLine = deps.prepare ?? prepare;
    this.env = { clock: deps.clock };
    this.lastMaintainMs = deps.clock.monoMs();
    this.scope = this.buildScope(deps.scope ?? {});
  }
  policy;
  prepareLine;
  scopeInput = /* @__PURE__ */ new Map();
  scope;
  buckets = /* @__PURE__ */ new Map();
  recent = /* @__PURE__ */ new Map();
  drops = { evicted: 0, expired: 0, corrupt: 0, failed: 0, rejected: 0 };
  lastDropReportMs = -Infinity;
  lastMaintainMs;
  lastWarnMs = -Infinity;
  env;
  record(process2, draft) {
    try {
      const admitted = this.guard(process2, draft);
      if (!admitted) return false;
      this.write(process2, admitted);
      return true;
    } catch (error) {
      this.warn("Observe could not record an item", error);
      return false;
    }
  }
  submit(draft) {
    return this.record("main", draft);
  }
  captureError(process2, error, how) {
    try {
      const draft = errorDraft(error, how, this.env);
      return this.record(process2, draft) ? draft.id : void 0;
    } catch (error2) {
      this.warn("Observe could not capture an error", error2);
      return void 0;
    }
  }
  logCall(process2, call) {
    try {
      submitLog((draft) => this.record(process2, draft), fromLogCall(call, this.env));
    } catch (error) {
      this.warn("Observe could not record a log", error);
    }
  }
  setAttributes(input) {
    try {
      this.scope = this.buildScope(input);
    } catch (error) {
      this.warn("Observe could not set attributes", error);
    }
  }
  syncNow() {
    try {
      this.deps.journal.syncAllNow();
    } catch (error) {
      this.warn("Observe could not sync the queue", error);
    }
  }
  tick() {
    try {
      this.deps.journal.tick();
      this.deps.delivery.tick();
      const now = this.deps.clock.monoMs();
      if (now - this.lastMaintainMs >= this.policy.maintainEveryMs) {
        this.lastMaintainMs = now;
        this.deps.journal.maintain(this.policy.orphanAfterMs).catch((error) => this.warn("Observe could not maintain the queue", error));
      }
      this.collectDrops(now);
    } catch (error) {
      this.warn("Observe tick failed", error);
    }
  }
  async flush(options = {}) {
    const timeoutMs = options.timeoutMs ?? this.policy.flushTimeoutMs;
    let timer;
    const expired = new Promise((resolve) => {
      timer = setTimeout(() => resolve(false), Math.min(timeoutMs, MAX_TIMER_MS));
    });
    const work = (async () => {
      await this.deps.journal.sealAll();
      if (options.send === false) return true;
      return this.deps.delivery.drain(this.deps.clock.monoMs() + timeoutMs);
    })();
    try {
      return await Promise.race([work, expired]);
    } catch (error) {
      this.warn("Observe flush failed", error);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
  buildScope(input) {
    for (const [key, value] of Object.entries(input)) {
      if (value === null || value === void 0) this.scopeInput.delete(key);
      else if (this.scopeInput.has(key) || this.scopeInput.size < LIMITS.attributes) this.scopeInput.set(key, value);
    }
    return attributes(Object.fromEntries(this.scopeInput), this.deps.scrubber);
  }
  write(process2, draft) {
    const line = this.prepareLine(process2, draft, { scope: this.scope, scrubber: this.deps.scrubber, roots: this.deps.roots });
    this.deps.journal.append(draft.kind === "error" ? "errors" : "logs", line);
  }
  guard(process2, draft) {
    const now = this.deps.clock.monoMs();
    const signature = draft.kind === "error" ? errorSignature(draft) : null;
    if (signature !== null) {
      const seen = this.recent.get(signature);
      if (seen !== void 0 && now - seen < this.policy.duplicateWindowMs) return null;
    }
    const key = `${process2}/${draft.kind === "error" && !draft.handled ? "crash" : draft.kind}`;
    const bucket = draft.kind === "error" ? this.policy.errors : this.policy.logs;
    let state = this.buckets.get(key);
    if (!state) {
      state = { tokens: bucket.burst, atMs: now, suppressed: 0 };
      this.buckets.set(key, state);
    }
    state.tokens = Math.min(bucket.burst, state.tokens + (now - state.atMs) / 1e3 * bucket.perSecond);
    state.atMs = now;
    if (state.tokens < 1) {
      state.suppressed++;
      return null;
    }
    state.tokens--;
    if (signature !== null) this.remember(signature, now);
    if (state.suppressed === 0) return draft;
    const suppressed = state.suppressed;
    state.suppressed = 0;
    return { ...draft, attributes: { ...draft.attributes, "observe.suppressed": String(suppressed) } };
  }
  remember(signature, now) {
    if (this.recent.size >= 256) {
      for (const [key, at] of this.recent) if (now - at >= this.policy.duplicateWindowMs) this.recent.delete(key);
    }
    this.recent.set(signature, now);
  }
  collectDrops(now) {
    const drops = this.deps.journal.takeDrops();
    const rejected = this.deps.delivery.takeRejected();
    this.drops = {
      evicted: this.drops.evicted + drops.evicted,
      expired: this.drops.expired + drops.expired,
      corrupt: this.drops.corrupt + drops.corrupt,
      failed: this.drops.failed + drops.failed,
      rejected: this.drops.rejected + rejected
    };
    if (DROP_KINDS.every((kind) => this.drops[kind] === 0)) return;
    if (now - this.lastDropReportMs < this.policy.dropReportEveryMs) return;
    this.lastDropReportMs = now;
    const wallMs = this.deps.clock.wallMs();
    this.write("main", {
      kind: "log",
      id: uuidv7(wallMs),
      time_us: micros(wallMs),
      level: "warning",
      message: "Observe dropped queued data",
      attributes: Object.fromEntries(DROP_KINDS.map((kind) => [`observe.dropped.${kind}`, String(this.drops[kind])])),
      context: {}
    });
    this.drops = { evicted: 0, expired: 0, corrupt: 0, failed: 0, rejected: 0 };
  }
  warn(message, error) {
    const now = this.deps.clock.monoMs();
    if (now - this.lastWarnMs < this.policy.warnEveryMs) return;
    this.lastWarnMs = now;
    try {
      this.deps.warn(message, error);
    } catch {
    }
  }
};
function errorSignature(draft) {
  const outer = draft.exceptions[0];
  const frame2 = outer.frames[0];
  const where = frame2 ? [frame2.function, frame2.file ?? "", frame2.line ?? 0, frame2.column ?? 0] : [draft.context.url ?? null, draft.context.name ?? null];
  return JSON.stringify([draft.handled, draft.mechanism, outer.type, outer.message, ...where]);
}

// src/node/fs-store.ts
var import_node_fs = require("node:fs");
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");
var import_node_util = require("node:util");
var fdatasyncAsync = (0, import_node_util.promisify)(import_node_fs.fdatasync);
var closeAsync = (0, import_node_util.promisify)(import_node_fs.close);
function code(error) {
  return error?.code;
}
function writeAll(fd, text2) {
  const bytes = Buffer.from(text2, "utf8");
  const written = (0, import_node_fs.writeSync)(fd, bytes);
  if (written !== bytes.length) throw new Error(`short write: ${written} of ${bytes.length} bytes`);
}
var FsSegmentWriter = class {
  constructor(fd) {
    this.fd = fd;
  }
  closed = false;
  queue = Promise.resolve();
  append(text2) {
    if (this.closed) throw new Error("segment writer is closed");
    writeAll(this.fd, text2);
  }
  sync() {
    return this.serial(() => this.closed ? void 0 : fdatasyncAsync(this.fd));
  }
  syncNow() {
    if (!this.closed) (0, import_node_fs.fdatasyncSync)(this.fd);
  }
  close() {
    return this.serial(() => {
      if (this.closed) return;
      this.closed = true;
      return closeAsync(this.fd);
    });
  }
  // Closing while an fdatasync is still on the thread pool would let the fd number be reused under it.
  serial(op) {
    const next = this.queue.then(op);
    this.queue = next.catch(() => {
    });
    return next;
  }
};
var FsSegmentStore = class {
  constructor(dir) {
    this.dir = dir;
  }
  create(key, firstLine) {
    (0, import_node_fs.mkdirSync)(this.dir, { recursive: true });
    const path = (0, import_node_path.join)(this.dir, key);
    const fd = (0, import_node_fs.openSync)(path, "ax");
    try {
      writeAll(fd, firstLine);
    } catch (error) {
      (0, import_node_fs.closeSync)(fd);
      try {
        (0, import_node_fs.unlinkSync)(path);
      } catch {
      }
      throw error;
    }
    return new FsSegmentWriter(fd);
  }
  async names() {
    let names;
    try {
      names = await (0, import_promises.readdir)(this.dir);
    } catch (error) {
      if (code(error) === "ENOENT") return [];
      throw error;
    }
    return names.filter((key) => parseSegmentKey(key) !== null);
  }
  async list() {
    const listed = [];
    for (const key of await this.names()) {
      try {
        listed.push({ key, bytes: (await (0, import_promises.stat)((0, import_node_path.join)(this.dir, key))).size });
      } catch {
      }
    }
    return listed;
  }
  async read(key) {
    try {
      return await (0, import_promises.readFile)((0, import_node_path.join)(this.dir, key), "utf8");
    } catch (error) {
      if (code(error) === "ENOENT") return null;
      throw error;
    }
  }
  async rename(from, to) {
    try {
      await (0, import_promises.rename)((0, import_node_path.join)(this.dir, from), (0, import_node_path.join)(this.dir, to));
      return "done";
    } catch (error) {
      if (code(error) === "ENOENT") return "missing";
      throw error;
    }
  }
  async remove(key) {
    try {
      await (0, import_promises.unlink)((0, import_node_path.join)(this.dir, key));
    } catch (error) {
      if (code(error) !== "ENOENT") throw error;
    }
  }
};
var UUID2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function readOrCreateInstallId(dir) {
  const path = (0, import_node_path.join)(dir, "install-id");
  try {
    const existing = (0, import_node_fs.readFileSync)(path, "utf8").trim();
    if (UUID2.test(existing)) return existing;
  } catch {
  }
  const id = uuidv4();
  (0, import_node_fs.mkdirSync)(dir, { recursive: true });
  const temp = `${path}.${uuidv4()}.tmp`;
  const fd = (0, import_node_fs.openSync)(temp, "w");
  try {
    writeAll(fd, id);
    (0, import_node_fs.fsyncSync)(fd);
  } finally {
    (0, import_node_fs.closeSync)(fd);
  }
  (0, import_node_fs.renameSync)(temp, path);
  return id;
}

// src/electron/bridge.ts
var CHANNEL = {
  post: "observe:v1:post",
  hello: "observe:v1:hello",
  flush: "observe:v1:flush"
};
var MAX_MESSAGE_BYTES = 1024 * 1024;
var MAX_FLUSH_TIMEOUT_MS = 6e4;
var RENDERER_MECHANISMS = /* @__PURE__ */ new Set(["report", "unhandledrejection", "onerror", "error_boundary", "log"]);
var LEVEL_SET = new Set(LEVELS);
var UUID3 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function fail() {
  throw new Error("invalid bridge message");
}
function spend(budget, bytes) {
  budget.bytes -= bytes;
  if (budget.bytes < 0) fail();
}
function record(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail();
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) fail();
  return value;
}
function text(value, maxBytes, budget) {
  if (typeof value !== "string") fail();
  const kept = cutUtf8(value, maxBytes * LIMITS.capture);
  spend(budget, kept.length);
  return kept;
}
function optionalText(value, maxBytes, budget) {
  return value === void 0 ? void 0 : text(value, maxBytes, budget);
}
function uuid(value) {
  if (typeof value !== "string" || !UUID3.test(value)) fail();
  return value;
}
function int(value) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) fail();
  return value;
}
function optionalInt(value) {
  return value === void 0 ? void 0 : int(value);
}
function json(value, depth, budget) {
  spend(budget, 1);
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : fail();
  if (typeof value === "string") return text(value, LIMITS.stringBytes, budget);
  if (depth <= 0) fail();
  if (Array.isArray(value)) return value.map((item) => json(item, depth - 1, budget));
  return jsonObject(value, depth, budget);
}
function jsonObject(value, depth, budget) {
  const out = {};
  for (const [key, item] of Object.entries(record(value))) {
    spend(budget, key.length);
    if (item !== void 0) out[key] = json(item, depth - 1, budget);
  }
  return out;
}
function attributeInput(value, budget) {
  const out = boundAttributes(record(value));
  for (const [key, item] of Object.entries(out)) spend(budget, key.length + (typeof item === "string" ? item.length : 1));
  return out;
}
function frame(value, budget) {
  const raw = record(value);
  const file = optionalText(raw.file, LIMITS.nameBytes, budget);
  const line = optionalInt(raw.line);
  const column = optionalInt(raw.column);
  return {
    function: text(raw.function, LIMITS.nameBytes, budget),
    ...file !== void 0 && { file },
    ...line !== void 0 && { line },
    ...column !== void 0 && { column }
  };
}
function exception2(value, budget) {
  const raw = record(value);
  if (!Array.isArray(raw.frames) || raw.frames.length > LIMITS.frames) fail();
  const code2 = optionalText(raw.code, LIMITS.nameBytes, budget);
  return {
    type: text(raw.type, LIMITS.nameBytes, budget),
    message: text(raw.message, LIMITS.messageBytes, budget),
    ...code2 !== void 0 && { code: code2 },
    frames: raw.frames.map((item) => frame(item, budget))
  };
}
function micros2(value) {
  return int(value);
}
function errorDraft2(raw, budget) {
  if (typeof raw.handled !== "boolean") fail();
  if (typeof raw.mechanism !== "string" || !RENDERER_MECHANISMS.has(raw.mechanism)) fail();
  if (!Array.isArray(raw.exceptions) || raw.exceptions.length < 1 || raw.exceptions.length > LIMITS.chain) fail();
  const [first, ...rest] = raw.exceptions.map((item) => exception2(item, budget));
  const groupingKey = optionalText(raw.grouping_key, LIMITS.nameBytes, budget);
  return {
    kind: "error",
    id: uuid(raw.id),
    time_us: micros2(raw.time_us),
    handled: raw.handled,
    mechanism: raw.mechanism,
    exceptions: [first, ...rest],
    ...groupingKey !== void 0 && { grouping_key: groupingKey },
    attributes: attributeInput(raw.attributes, budget),
    context: jsonObject(raw.context, LIMITS.contextDepth, budget)
  };
}
function logDraft(raw, budget) {
  if (typeof raw.level !== "string" || !LEVEL_SET.has(raw.level)) fail();
  let args;
  if (raw.args !== void 0) {
    if (!Array.isArray(raw.args) || raw.args.length > LIMITS.args) fail();
    args = raw.args.map((item) => json(item, LIMITS.contextDepth, budget));
  }
  const channel = optionalText(raw.channel, LIMITS.nameBytes, budget);
  const errorId = raw.error_id === void 0 ? void 0 : uuid(raw.error_id);
  return {
    kind: "log",
    id: uuid(raw.id),
    time_us: micros2(raw.time_us),
    level: raw.level,
    message: text(raw.message, LIMITS.messageBytes, budget),
    ...args !== void 0 && { args },
    ...channel !== void 0 && { channel },
    ...errorId !== void 0 && { error_id: errorId },
    attributes: attributeInput(raw.attributes, budget),
    context: jsonObject(raw.context, LIMITS.contextDepth, budget)
  };
}
function parseBridgeMessage(value) {
  const budget = { bytes: MAX_MESSAGE_BYTES };
  try {
    const message = record(value);
    if (message.t === "attributes") return { t: "attributes", attributes: attributeInput(message.attributes, budget) };
    if (message.t !== "draft") return null;
    const draft = record(message.draft);
    if (draft.kind === "error") return { t: "draft", draft: errorDraft2(draft, budget) };
    if (draft.kind === "log") return { t: "draft", draft: logDraft(draft, budget) };
    return null;
  } catch {
    return null;
  }
}
function parseFlushOptions(value) {
  if (typeof value !== "object" || value === null) return {};
  const raw = value;
  const timeoutMs = typeof raw.timeoutMs === "number" && Number.isFinite(raw.timeoutMs) ? Math.min(Math.max(0, raw.timeoutMs), MAX_FLUSH_TIMEOUT_MS) : void 0;
  return { ...timeoutMs !== void 0 && { timeoutMs }, ...raw.send === false && { send: false } };
}

// src/electron/hooks.ts
function rejectionsAreStrict(proc) {
  const flags = [...proc.execArgv, ...(proc.env.NODE_OPTIONS ?? "").split(/\s+/)];
  return flags.some((flag) => /^--unhandled-rejections=(strict|throw)$/.test(flag));
}
function installProcessHandlers(client, proc, warn2) {
  proc.on("uncaughtExceptionMonitor", (error, origin) => {
    client.captureError("main", error, { mechanism: origin === "unhandledRejection" ? "unhandledrejection" : "uncaught", handled: false });
    client.syncNow();
  });
  if (rejectionsAreStrict(proc)) return;
  let rejections = 0;
  proc.on("unhandledRejection", (reason) => {
    client.captureError("main", reason, { mechanism: "unhandledrejection", handled: false });
    rejections++;
    try {
      const detail = reason instanceof Error ? reason.stack ?? String(reason) : String(reason);
      warn2(`(node:${proc.pid}) UnhandledPromiseRejectionWarning: ${detail}
(node:${proc.pid}) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: ${rejections})`);
    } catch {
    }
  });
}
function goneDraft(type, message, exitCode, context) {
  const wallMs = Date.now();
  return {
    kind: "error",
    id: uuidv7(wallMs),
    time_us: micros(wallMs),
    handled: false,
    mechanism: "process_gone",
    exceptions: [{ type, message, code: String(exitCode), frames: [] }],
    attributes: {},
    context
  };
}
function installAppHandlers(client, app2) {
  app2.on("render-process-gone", (_event, contents, details) => {
    if (details.reason === "clean-exit") return;
    let url = "";
    try {
      url = contents.getURL();
    } catch {
    }
    client.record("renderer", goneDraft("RenderProcessGone", details.reason, details.exitCode, { url }));
  });
  app2.on("child-process-gone", (_event, details) => {
    if (details.reason === "clean-exit") return;
    const context = {};
    if (details.name !== void 0) context.name = details.name;
    if (details.serviceName !== void 0) context.service_name = details.serviceName;
    client.record("main", goneDraft("ChildProcessGone", `${details.type} ${details.reason}`, details.exitCode, context));
  });
}
var ELECTRON_LOG_LEVELS = {
  silly: "trace",
  verbose: "debug",
  debug: "debug",
  info: "info",
  warn: "warning",
  error: "error"
};
var STACK = /^([A-Za-z_$][\w$.]*(?:Error|Exception)|Error)(?:: ([^\n]*))?\n\s+at /;
function reviveStack(value) {
  if (typeof value !== "string") return value;
  const match = STACK.exec(value);
  if (!match) return value;
  return { name: match[1], message: match[2] ?? "", stack: value };
}
function wallMsOf(date) {
  if (date instanceof Date) return date.getTime();
  if (typeof date === "string" || typeof date === "number") {
    const ms = new Date(date).getTime();
    return Number.isNaN(ms) ? void 0 : ms;
  }
  return void 0;
}
function attachElectronLog(client, log2, level = "info") {
  const transport = (message) => {
    try {
      const process2 = message.variables?.processType === "renderer" ? "renderer" : "main";
      const data = Array.isArray(message.data) ? message.data : [];
      client.logCall(process2, {
        level: ELECTRON_LOG_LEVELS[String(message.level)] ?? "info",
        args: process2 === "renderer" ? data.map(reviveStack) : data,
        channel: typeof message.scope === "string" && message.scope !== "" ? message.scope : void 0,
        wallMs: wallMsOf(message.date)
      });
    } catch {
    }
  };
  log2.transports.observe = Object.assign(transport, { level, transforms: [] });
}
var CONSOLE_METHODS = [
  ["debug", "debug"],
  ["log", "info"],
  ["info", "info"],
  ["warn", "warning"],
  ["error", "error"]
];
var DEFAULT_CONSOLE_LEVELS = ["info", "warning", "error"];
function captureConsole(target, sink, levels = DEFAULT_CONSOLE_LEVELS) {
  const wanted = new Set(levels);
  let inside = false;
  for (const [method, level] of CONSOLE_METHODS) {
    if (!wanted.has(level)) continue;
    const original = target[method];
    if (typeof original !== "function") continue;
    target[method] = function(...args) {
      if (!inside) {
        inside = true;
        try {
          sink({ level, args });
        } catch {
        }
        inside = false;
      }
      return original.apply(this, args);
    };
  }
}

// src/electron/transport.ts
var import_node_util2 = require("node:util");
var import_node_zlib = require("node:zlib");
var gzipAsync = (0, import_node_util2.promisify)(import_node_zlib.gzip);
function parseRetryAfter(value, nowMs) {
  if (value === null) return void 0;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return void 0;
  return Math.max(0, Math.ceil((date - nowMs) / 1e3));
}
function sessionTransport(endpoint, key, fetcher) {
  let ready;
  return {
    async post(json2, timeoutMs) {
      try {
        ready ??= fetcher().catch((error) => {
          ready = void 0;
          throw error;
        });
        const fetch = await ready;
        const body = await gzipAsync(Buffer.from(json2, "utf8"));
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Content-Encoding": "gzip" },
          body: new Uint8Array(body.buffer, body.byteOffset, body.byteLength),
          signal: AbortSignal.timeout(timeoutMs),
          redirect: "manual"
        });
        await response.arrayBuffer().catch(() => void 0);
        const retryAfterSeconds = parseRetryAfter(response.headers.get("retry-after"), Date.now());
        return retryAfterSeconds === void 0 ? { status: response.status } : { status: response.status, retryAfterSeconds };
      } catch {
        return { status: 0 };
      }
    }
  };
}

// src/electron/main.ts
var warn = console.warn.bind(console);
var MAX_POSTS_PER_SECOND = 200;
var initialised = false;
function init(options) {
  if (initialised) {
    warn("Observe init was called twice; the second call is ignored");
    return;
  }
  initialised = true;
  try {
    if (!options.endpoint || !options.key) {
      installHub(disabledHub);
      registerDisabledIpc();
      return;
    }
    start(options);
  } catch (error) {
    installHub(disabledHub);
    warn("Observe could not start", error);
  }
}
function registerDisabledIpc() {
  const hello = { enabled: false, console: null };
  import_electron.ipcMain.handle(CHANNEL.hello, () => hello);
  import_electron.ipcMain.handle(CHANNEL.flush, () => false);
}
function start(options) {
  Error.stackTraceLimit = Math.max(Error.stackTraceLimit, 50);
  const dir = options.dir ?? (0, import_node_path2.join)(import_electron.app.getPath("userData"), "observe");
  const scrubber = Scrubber.withDefaults(options.scrub?.keys ?? []);
  const resource = {
    platform: "javascript",
    service: options.service,
    release: options.release ?? import_electron.app.getVersion(),
    host: readOrCreateInstallId(dir),
    sdk: { name: "observe-js", version: "0.1.0" },
    runtime: { name: "electron", version: process.versions.electron ?? "" },
    attributes: attributes(
      {
        "os.name": (0, import_node_os.platform)(),
        "os.version": process.getSystemVersion(),
        "os.arch": (0, import_node_os.arch)(),
        "node.version": process.versions.node,
        "chrome.version": process.versions.chrome,
        "session.id": uuidv4(),
        "release.channel": options.channel,
        "vcs.revision": options.revision
      },
      scrubber
    )
  };
  const journal = new Journal(new FsSegmentStore((0, import_node_path2.join)(dir, "queue")), JSON.stringify(resource), JOURNAL_POLICY, systemClock);
  let ready = false;
  const transport = sessionTransport(options.endpoint, options.key, () => import_electron.app.whenReady().then(ingestFetch));
  const delivery = new Delivery(journal, transport, { online: () => ready && import_electron.net.isOnline() }, DELIVERY_POLICY, systemClock, Math.random);
  const client = new Client({ journal, delivery, scrubber, roots: [import_electron.app.getAppPath()], clock: systemClock, scope: options.attributes ?? {}, warn });
  installHub(client);
  installProcessHandlers(client, process, warn);
  const consoleLevels = options.logs?.from === "console" ? options.logs.levels ?? DEFAULT_CONSOLE_LEVELS : null;
  registerIpc(client, { enabled: true, console: consoleLevels });
  installAppHandlers(client, import_electron.app);
  if (options.logs?.from === "electron-log") attachElectronLog(client, options.logs.log, options.logs.level);
  if (consoleLevels) captureConsole(console, (call) => client.logCall("main", call), consoleLevels);
  import_electron.app.on("will-quit", () => client.syncNow());
  import_electron.app.whenReady().then(async () => {
    ready = true;
    import_electron.powerMonitor.on("resume", () => delivery.wake());
    import_electron.powerMonitor.on("suspend", () => void journal.sealAll().catch((error) => warn("Observe could not seal the queue", error)));
    await journal.maintain(0).catch((error) => warn("Observe could not recover the queue", error));
    setInterval(() => client.tick(), 1e3).unref();
  }).catch((error) => warn("Observe could not start sending", error));
}
function ingestFetch() {
  const ses = import_electron.session.fromPartition("observe-ingest");
  if (typeof ses.fetch === "function") return ses.fetch.bind(ses);
  return globalThis.fetch;
}
function registerIpc(client, hello) {
  const windows = /* @__PURE__ */ new Map();
  const allow = (sender) => {
    const now = systemClock.monoMs();
    let window = windows.get(sender.id);
    if (!window) {
      window = { startMs: now, count: 0 };
      windows.set(sender.id, window);
      const id = sender.id;
      sender.once("destroyed", () => windows.delete(id));
    }
    if (now - window.startMs >= 1e3) {
      window.startMs = now;
      window.count = 0;
    }
    window.count++;
    return window.count <= MAX_POSTS_PER_SECOND;
  };
  import_electron.ipcMain.on(CHANNEL.post, (event, value) => {
    try {
      if (!allow(event.sender)) return;
      const message = parseBridgeMessage(value);
      if (!message) return;
      if (message.t === "draft") client.record("renderer", message.draft);
      else client.setAttributes(message.attributes);
    } catch (error) {
      warn("Observe could not accept a renderer message", error);
    }
  });
  import_electron.ipcMain.handle(CHANNEL.hello, () => hello);
  import_electron.ipcMain.handle(CHANNEL.flush, (event, value) => allow(event.sender) ? client.flush(parseFlushOptions(value)) : false);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  captureException,
  flush,
  init,
  log,
  setAttributes
});
