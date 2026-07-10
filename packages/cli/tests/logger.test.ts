import { expect, test } from "vite-plus/test";
import { createLogger } from "../src/lib/logger.ts";

/**
 * Captures everything written to process.stderr during the callback.
 */
function captureStderr(fn: () => void): string {
  const original = process.stderr.write.bind(process.stderr);
  const chunks: string[] = [];
  process.stderr.write = ((data: string) => {
    chunks.push(typeof data === "string" ? data : String(data));
    return true;
  }) as typeof process.stderr.write;
  try {
    fn();
  } finally {
    process.stderr.write = original;
  }
  return chunks.join("");
}

test("buffers log entries in memory", () => {
  const logger = createLogger();
  logger.info("test message");
  logger.debug("debug message", { key: "value" });
  logger.warn("warning message");

  const output = captureStderr(() => {
    logger.fail(new Error("test error"));
  });

  expect(output).toContain("test message");
  expect(output).toContain("debug message");
  expect(output).toContain("warning message");
  expect(output).toContain("test error");
});

test("clear discards all entries without output", () => {
  const logger = createLogger();
  logger.info("should be cleared");
  logger.clear();

  const output = captureStderr(() => {
    logger.fail(new Error("no entries"));
  });

  expect(output).toContain("(no log entries recorded)");
  expect(output).not.toContain("should be cleared");
});

test("step tracking groups entries in output", () => {
  const logger = createLogger();
  logger.beginStep("step-1");
  logger.info("first step message");
  logger.endStep("step-1");

  logger.beginStep("step-2");
  logger.info("second step message");
  logger.endStep("step-2");

  const output = captureStderr(() => {
    logger.fail(new Error("step test"));
  });

  expect(output).toContain("── step-1 ──");
  expect(output).toContain("── step-2 ──");
  expect(output).toContain("first step message");
  expect(output).toContain("second step message");
});

test("nested steps use the innermost step name", () => {
  const logger = createLogger();
  logger.beginStep("outer");
  logger.beginStep("inner");
  logger.info("nested message");
  logger.endStep("inner");
  logger.endStep("outer");

  const output = captureStderr(() => {
    logger.fail(new Error("nesting test"));
  });

  expect(output).toContain("── inner ──");
  expect(output).toContain("nested message");
});

test("fail output includes error stack trace", () => {
  const logger = createLogger();

  const output = captureStderr(() => {
    logger.fail(new Error("detailed error"));
  });

  expect(output).toContain("detailed error");
  expect(output).toContain("Error Report");
});

test("fail handles non-Error causes", () => {
  const logger = createLogger();

  const output = captureStderr(() => {
    logger.fail("string error");
  });

  expect(output).toContain("string error");
});

test("entries include timestamps", () => {
  const logger = createLogger();
  logger.info("timestamped");

  const output = captureStderr(() => {
    logger.fail(new Error("ts"));
  });

  // Timestamp format: HH:MM:SS.mmm
  expect(output).toMatch(/\[\d{2}:\d{2}:\d{2}\.\d{3}\]/);
});

test("log levels are displayed in output", () => {
  const logger = createLogger();
  logger.debug("debug msg");
  logger.info("info msg");
  logger.warn("warn msg");
  logger.error("error msg");

  const output = captureStderr(() => {
    logger.fail(new Error("levels"));
  });

  expect(output).toContain("[DEBUG]");
  expect(output).toContain("[INFO ]");
  expect(output).toContain("[WARN ]");
  expect(output).toContain("[ERROR]");
});

test("createLogger returns independent instances", () => {
  const a = createLogger();
  const b = createLogger();

  a.info("only in A");

  const output = captureStderr(() => {
    b.fail(new Error("B only"));
  });

  expect(output).not.toContain("only in A");
});

test("structured data is formatted as JSON in output", () => {
  const logger = createLogger();
  logger.info("with data", { key: "value", nested: { a: 1 } });

  const output = captureStderr(() => {
    logger.fail(new Error("data"));
  });

  expect(output).toContain('"key"');
  expect(output).toContain('"value"');
  expect(output).toContain('"nested"');
});
