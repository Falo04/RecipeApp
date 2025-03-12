export const ApiUrl = "http://localhost:8443/api/v1"

export interface Page<T> {
  items: Array<T>;
  limit: number;
  offset: number;
  total: number;
}

export interface ApiError {
  status_code: number,
  message: string,
}

export enum StatusCode {
  Unauthenticated = 1000,
  BadRequest = 1001,
  InvalidJson = 1002,

  InternalServerError = 2000,
}
