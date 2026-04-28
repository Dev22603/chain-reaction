export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly errors: string[] = [],
    public readonly statusCode = 400
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}
