type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[(process.env.LOG_LEVEL as Level) ?? "info"] ?? LEVELS.info;

function write(level: Level, message: string): void {
  if (LEVELS[level] < threshold) return;
  const line = `[${new Date().toISOString()}] [${level.toUpperCase().padEnd(5)}] [pid ${process.pid}] ${message}`;
  (level === "error" ? console.error : console.log)(line);
}

export const logger = {
  debug: (message: string) => write("debug", message),
  info: (message: string) => write("info", message),
  warn: (message: string) => write("warn", message),
  error: (message: string) => write("error", message),
  step: (message: string) => write("info", `  step: ${message}`),
};
