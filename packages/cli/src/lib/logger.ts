import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ── Types ───────────────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  step?: string;
  message: string;
  data?: Record<string, unknown>;
}

// ── Logger ──────────────────────────────────────────────────────────────────

export class Logger {
  private entries: LogEntry[] = [];
  private stepStack: string[] = [];

  // ── Step tracking ───────────────────────────────────────────────────────

  beginStep(name: string): void {
    this.stepStack.push(name);
    this.add("info", `▶ ${name} started`);
  }

  endStep(name: string): void {
    const idx = this.stepStack.lastIndexOf(name);
    if (idx !== -1) {
      this.stepStack.splice(idx, 1);
    }
    this.add("info", `◀ ${name} completed`);
  }

  // ── Log methods ─────────────────────────────────────────────────────────

  debug(message: string, data?: Record<string, unknown>): void {
    this.add("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.add("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.add("warn", message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.add("error", message, data);
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Discard all buffered log entries without output.
   * Call this on the success path.
   */
  clear(): void {
    this.entries = [];
    this.stepStack = [];
  }

  /**
   * Dump all buffered logs to stderr and optionally persist to a log file.
   * Call this on the failure path.
   */
  fail(cause: unknown): void {
    const report = this.formatReport(cause);
    process.stderr.write(report);

    try {
      const logDir = path.join(os.homedir(), ".cnma");
      fs.mkdirSync(logDir, { recursive: true });
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const logPath = path.join(logDir, `cnma-error-${ts}.log`);
      fs.writeFileSync(logPath, report, "utf8");
    } catch {
      // Best-effort file persistence; never let log-writing hide the real error.
    }

    this.clear();
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private currentStep(): string | undefined {
    return this.stepStack.length > 0 ? this.stepStack[this.stepStack.length - 1] : undefined;
  }

  private add(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    this.entries.push({
      timestamp: new Date(),
      level,
      step: this.currentStep(),
      message,
      data,
    });
  }

  private formatReport(cause: unknown): string {
    const lines: string[] = [];

    lines.push("═══════════════════════════════════════════════════════════");
    lines.push("  CNMA — Error Report");
    lines.push("═══════════════════════════════════════════════════════════");

    if (cause instanceof Error) {
      lines.push(`  Error: ${cause.message}`);
      if (cause.stack) {
        for (const frame of cause.stack.split("\n").slice(1)) {
          lines.push(`         ${frame.trim()}`);
        }
      }
    } else if (cause !== undefined && cause !== null) {
      lines.push(`  Error: ${JSON.stringify(cause)}`);
    }

    lines.push(`  Time:  ${new Date().toISOString()}`);
    lines.push("───────────────────────────────────────────────────────────");

    if (this.entries.length === 0) {
      lines.push("  (no log entries recorded)");
    } else {
      let prevStep: string | undefined;
      for (const entry of this.entries) {
        // Print step header on first entry of a new step
        if (entry.step !== prevStep) {
          if (entry.step) {
            lines.push(`  ── ${entry.step} ──`);
          }
          prevStep = entry.step;
        }

        const ts = this.formatTimestamp(entry.timestamp);
        const level = entry.level.toUpperCase().padEnd(5);
        lines.push(`  [${ts}] [${level}] ${entry.message}`);

        if (entry.data) {
          const dataStr = JSON.stringify(entry.data, null, 2);
          for (const dataLine of dataStr.split("\n")) {
            lines.push(`           ${dataLine}`);
          }
        }
      }
    }

    lines.push("═══════════════════════════════════════════════════════════");
    return lines.join("\n") + "\n";
  }

  private formatTimestamp(date: Date): string {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    const ms = String(date.getMilliseconds()).padStart(3, "0");
    return `${h}:${m}:${s}.${ms}`;
  }
}

// ── Factory ─────────────────────────────────────────────────────────────────

export function createLogger(): Logger {
  return new Logger();
}

// ── Shared singleton ────────────────────────────────────────────────────────

/**
 * Default logger instance shared across all modules.
 * A single CLI invocation uses exactly one logger.
 */
export const logger = createLogger();
