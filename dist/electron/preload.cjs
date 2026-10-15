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

// src/electron/preload.ts
var preload_exports = {};
__export(preload_exports, {
  exposeObserve: () => exposeObserve
});
module.exports = __toCommonJS(preload_exports);
var import_electron = require("electron");

// src/core/model.ts
var LEVELS = ["trace", "debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"];

// src/electron/bridge.ts
var CHANNEL = {
  post: "observe:v1:post",
  hello: "observe:v1:hello",
  flush: "observe:v1:flush",
  clock: "observe:v1:clock"
};
var BRIDGE_GLOBAL = "__observe";
var MAX_MESSAGE_BYTES = 1024 * 1024;
var LEVEL_SET = new Set(LEVELS);

// src/electron/preload.ts
function exposeObserve() {
  const bridge = {
    version: 1,
    post: (message) => import_electron.ipcRenderer.send(CHANNEL.post, message),
    hello: () => import_electron.ipcRenderer.invoke(CHANNEL.hello),
    flush: (options) => import_electron.ipcRenderer.invoke(CHANNEL.flush, options),
    onClock: (listener) => {
      import_electron.ipcRenderer.on(CHANNEL.clock, (_event, offsetMs) => {
        if (typeof offsetMs === "number" && Number.isFinite(offsetMs)) listener(offsetMs);
      });
    }
  };
  if (process.contextIsolated) import_electron.contextBridge.exposeInMainWorld(BRIDGE_GLOBAL, bridge);
  else globalThis[BRIDGE_GLOBAL] = bridge;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  exposeObserve
});
