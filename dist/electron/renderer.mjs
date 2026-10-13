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
function micros(wallMs) {
  return Math.round(wallMs * 1e3);
}
var systemClock = {
  wallMs: () => Date.now(),
  monoMs: () => globalThis.performance.now()
};

// src/core/scrub.ts
var REPLACEMENT = "[scrubbed]";
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
var URL = new RegExp(String.raw`\b[a-z][a-z0-9+.\-]{0,20}:\/\/[^${WS}"'\x60<>\[\](){}]+`, "gi");
var PATH_PROBE = new RegExp(String.raw`(?:^|[${WS}"'\x60(=])\/[^${WS}\/]+\/(?<run>[^${WS}"'\x60<>]{1,16})`, "g");
var PATH = new RegExp(String.raw`(?<=^|[${WS}"'\x60(=])\/(?!\/)[^${WS}"'\x60<>\[\](){}]+`, "g");
var URL_PREFIX = new RegExp(String.raw`^(?<scheme>[a-z][a-z0-9+.\-]*:\/\/)?(?:(?<user>[^\/?#@:${WS}]{0,128}):(?<pass>[^\/?#@${WS}]{1,256})@)?`, "i");
var ESCAPED_KEY_PREFIX = new RegExp(`^(?:[nrt]|${HEX_ESCAPE})`);

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
  let start = head.length;
  while (start > 0 && head.length - start <= CUT_TOKEN_BYTES && !" 	\r\n".includes(head[start - 1])) start--;
  const partial = Math.min(utf8Bytes(head.slice(start)), CUT_TOKEN_BYTES);
  return truncateUtf8(head, utf8Bytes(head) - partial) + REPLACEMENT;
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
    const { message, stack, code, name, errors } = record2;
    if (!real && !(typeof message === "string" && typeof stack === "string")) return void 0;
    const type = errorType(name, real ? constructorName(value) : void 0, stack);
    return {
      type,
      message: typeof message === "string" ? message : message === void 0 ? "" : safeString(message),
      ...typeof code === "string" || typeof code === "number" ? { code: String(code) } : {},
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
function fitJson(value, bytes) {
  return fit(value, bytes)[0];
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
  const place = location(inParens ?? bare.replace(/^async /, ""));
  return place && { function: fn, ...place };
}
function location(raw) {
  let place = raw.trim();
  for (let evalAt = /^eval at .*? \((.*)\), .*$/.exec(place); evalAt; evalAt = /^eval at .*? \((.*)\), .*$/.exec(place)) {
    place = evalAt[1];
  }
  if (place === "native" || place === "<anonymous>") return {};
  const position = /^(.+):(\d+):(\d+)$/.exec(place) ?? /^(.+):(\d+)$/.exec(place);
  if (!position) return void 0;
  const [, file, line, column] = position;
  if (file === "<anonymous>") return {};
  return { file, line: Number(line), ...column === void 0 ? {} : { column: Number(column) } };
}

// src/core/capture.ts
function errorDraft(error, how, env3) {
  const wall = env3.clock.wallMs();
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
function fromLogCall(call, env3) {
  const wall = call.wallMs ?? env3.clock.wallMs();
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
    { clock: { wallMs: () => wall, monoMs: () => env3.clock.monoMs() } }
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
  setAttributes(attributes) {
    defer((hub) => hub.setAttributes(attributes));
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
function setAttributes(attributes) {
  try {
    currentHub().setAttributes({ ...attributes });
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

// src/electron/bridge.ts
var BRIDGE_GLOBAL = "__observe";
var MAX_MESSAGE_BYTES = 1024 * 1024;
var RENDERER_MECHANISMS = /* @__PURE__ */ new Set(["report", "unhandledrejection", "onerror", "error_boundary", "log"]);
var LEVEL_SET = new Set(LEVELS);
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
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
  if (typeof value !== "string" || !UUID.test(value)) fail();
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
  const code = optionalText(raw.code, LIMITS.nameBytes, budget);
  return {
    type: text(raw.type, LIMITS.nameBytes, budget),
    message: text(raw.message, LIMITS.messageBytes, budget),
    ...code !== void 0 && { code },
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

// src/electron/hooks.ts
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

// src/electron/renderer.ts
var warn = console.warn.bind(console);
var env2 = { clock: systemClock };
var RemoteHub = class {
  constructor(bridge) {
    this.bridge = bridge;
  }
  state = { kind: "waiting", held: [] };
  submit(draft) {
    return this.send({ t: "draft", draft });
  }
  setAttributes(attributes) {
    this.send({ t: "attributes", attributes });
  }
  flush(options) {
    if (this.state.kind === "inert") return Promise.resolve(false);
    return this.bridge.flush(options).catch(() => false);
  }
  open(hello) {
    if (this.state.kind !== "waiting") return;
    if (!hello.enabled) {
      this.state = { kind: "inert" };
      return;
    }
    const held = this.state.held;
    this.state = { kind: "open" };
    for (const message of held) this.send(message);
  }
  close() {
    this.state = { kind: "inert" };
  }
  send(raw) {
    const message = parseBridgeMessage(raw);
    if (!message) return false;
    switch (this.state.kind) {
      case "waiting":
        if (this.state.held.length >= MAX_PENDING) return false;
        this.state.held.push(message);
        return true;
      case "open":
        try {
          this.bridge.post(message);
          return true;
        } catch {
          return false;
        }
      case "inert":
        return false;
    }
  }
};
var initialised = false;
function init() {
  if (initialised) return;
  initialised = true;
  try {
    Error.stackTraceLimit = Math.max(Error.stackTraceLimit, 50);
    const bridge = globalThis[BRIDGE_GLOBAL];
    if (!bridge || bridge.version !== 1) {
      installHub(disabledHub);
      warn("Observe is off in this window: exposeObserve() did not run in the preload");
      return;
    }
    const hub = new RemoteHub(bridge);
    installHub(hub);
    window.addEventListener("error", (event) => {
      if (event.error === void 0 && !event.message) return;
      captureError(event.error ?? event.message, { mechanism: "onerror", handled: false });
    });
    window.addEventListener("unhandledrejection", (event) => {
      captureError(event.reason, { mechanism: "unhandledrejection", handled: false });
    });
    bridge.hello().then((hello) => {
      hub.open(hello);
      if (hello.enabled && hello.console) {
        captureConsole(
          console,
          (call) => {
            const target = currentHub();
            submitLog((draft) => target.submit(draft), fromLogCall(call, env2));
          },
          hello.console
        );
      }
    }).catch(() => {
      hub.close();
      warn("Observe is off in this window: observe.init() did not run in the main process");
    });
  } catch (error) {
    warn("Observe could not start in this window", error);
  }
}
export {
  captureException,
  flush,
  init,
  log,
  setAttributes
};
