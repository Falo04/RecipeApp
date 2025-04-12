export interface ApiResponse<T> {
    data: T | null;
    error: ApiError | null;
}

export interface Page<T> {
    items: Array<T>;
    limit: number;
    offset: number;
    total: number;
}

export interface SingleUuid {
    uuid: string;
}

export interface ApiError {
    status_code: number;
    message: string;
}

export enum StatusCode {
    Unauthenticated = 1000,
    BadRequest = 1001,
    InvalidJson = 1002,

    InternalServerError = 2000,
}

export interface List<T> {
    list: T[];
}
