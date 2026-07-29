// A consistent error shape. code is for developers/support, source tells the
// user which system failed, and details offers a practical recovery step.
export class AppError extends Error {
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = options.code || "APP_ERROR";
    this.source = options.source || "Application";
    this.recoverable = options.recoverable ?? true;
    this.details = options.details || "";
  }
}

export function normalizeError(error, context = {}) {
  // Turn browser/network errors into safe, friendly errors the UI can display.
  if (error instanceof AppError) {
    return error;
  }

  const aborted = error?.name === "AbortError";
  const message = String(error?.message || error || "Unknown error");

  if (aborted) {
    return new AppError("The request timed out.", {
      code: "REQUEST_TIMEOUT",
      source: context.source || "Network",
      cause: error,
      details: "Retry the request or use a cached report.",
    });
  }

  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return new AppError("A data source could not be reached.", {
      code: "NETWORK_UNAVAILABLE",
      source: context.source || "Network",
      cause: error,
      details: "The application will use local snapshots or other fallbacks when available.",
    });
  }

  return new AppError(message, {
    code: context.code || "UNEXPECTED_ERROR",
    source: context.source || "Application",
    cause: error,
    details: context.details || "",
  });
}

export function userMessage(error) {
  const normalized = normalizeError(error);
  const parts = [
    `${normalized.source}: ${normalized.message}`,
    normalized.details,
  ].filter(Boolean);

  return parts.join("\n");
}

export function reportError(error, context = {}) {
  const normalized = normalizeError(error, context);
  console.error(`[${normalized.code}] ${normalized.source}`, normalized);
  return normalized;
}
