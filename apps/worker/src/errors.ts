export type ErrorCode =
  | 'E_FORBIDDEN_HOST'
  | 'E_MISSING_PARAM'
  | 'E_NO_IMAGE_FOUND'
  | 'E_UPSTREAM_FAILED'
  | 'E_INVALID_URL';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly hint?: string;

  constructor(code: ErrorCode, status: number, message: string, hint?: string) {
    super(message);
    this.code = code;
    this.status = status;
    this.hint = hint;
  }
}

export function toJsonError(error: AppError) {
  return {
    code: error.code,
    message: error.message,
    hint: error.hint ?? ''
  };
}
