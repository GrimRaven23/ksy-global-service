type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
  error?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL = LOG_LEVELS[process.env.NODE_ENV === "production" ? "warn" : "debug"];

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const ctx = entry.context ? ` [${entry.context}]` : "";
  let msg = `${base}${ctx} ${entry.message}`;
  if (entry.data) msg += ` ${JSON.stringify(entry.data)}`;
  if (entry.error) msg += `\n  Error: ${entry.error}`;
  return msg;
}

function log(level: LogLevel, message: string, context?: string, data?: unknown, error?: unknown) {
  if (LOG_LEVELS[level] < MIN_LEVEL) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data,
    error: error instanceof Error ? error.stack : error ? String(error) : undefined,
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case "debug": console.debug(formatted); break;
    case "info": console.info(formatted); break;
    case "warn": console.warn(formatted); break;
    case "error": console.error(formatted); break;
  }

  if (process.env.NODE_ENV === "production" && level === "error") {
    structuredError(entry);
  }
}

function structuredError(entry: LogEntry) {
  const structured: Record<string, unknown> = {
    severity: entry.level.toUpperCase(),
    message: entry.message,
    "logging.googleapis.com/trace": `projects/${process.env.VERCEL_PROJECT_ID || "ksy"}/traces/${entry.timestamp}`,
  };
  if (entry.data && typeof entry.data === "object") {
    Object.assign(structured, entry.data);
  }
  console.log(JSON.stringify(structured));
}

export const logger = {
  debug: (msg: string, ctx?: string, data?: unknown) => log("debug", msg, ctx, data),
  info: (msg: string, ctx?: string, data?: unknown) => log("info", msg, ctx, data),
  warn: (msg: string, ctx?: string, data?: unknown) => log("warn", msg, ctx, data),
  error: (msg: string, ctx?: string, data?: unknown, err?: unknown) => log("error", msg, ctx, data, err),
};
