export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = "INTERNAL_ERROR",
    public readonly metadata: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, metadata: Record<string, unknown> = {}) {
    super(message, 500, "CONFIGURATION_ERROR", metadata);
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string, metadata: Record<string, unknown> = {}) {
    super(message, 400, "VALIDATION_ERROR", metadata);
  }
}

export class UpstreamUnavailableError extends AppError {
  constructor(message: string, metadata: Record<string, unknown> = {}) {
    super(message, 503, "UPSTREAM_UNAVAILABLE", metadata);
  }
}
