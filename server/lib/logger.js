const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || "info"] ?? LOG_LEVELS.info;

function log(level, obj, msg) {
  if (LOG_LEVELS[level] > currentLevel) return;
  const entry = {
    level,
    time: new Date().toISOString(),
    ...(typeof obj === "string" ? { msg: obj } : { ...obj, msg: msg || obj.msg }),
  };
  // Clean up error serialisation
  if (entry.err && entry.err instanceof Error) {
    entry.err = { message: entry.err.message, stack: entry.err.stack };
  }
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  error: (obj, msg) => log("error", obj, msg),
  warn: (obj, msg) => log("warn", obj, msg),
  info: (obj, msg) => log("info", obj, msg),
  debug: (obj, msg) => log("debug", obj, msg),
  child: (bindings) => ({
    error: (obj, msg) => log("error", { ...bindings, ...(typeof obj === "string" ? { msg: obj } : obj) }, msg),
    warn: (obj, msg) => log("warn", { ...bindings, ...(typeof obj === "string" ? { msg: obj } : obj) }, msg),
    info: (obj, msg) => log("info", { ...bindings, ...(typeof obj === "string" ? { msg: obj } : obj) }, msg),
    debug: (obj, msg) => log("debug", { ...bindings, ...(typeof obj === "string" ? { msg: obj } : obj) }, msg),
  }),
};
