export enum StatusCode {
    Unauthenticated = 1000,
    BadRequest = 1001,
    InvalidJson = 1002,
    MissingPrivileges = 1003,

    InternalServerError = 2000,
}

/**
 * The outer error the api returns. This is most likely not deal-able by the frontend
 */
export type ApiError = {
    /** The status code */
    status_code: StatusCode;
    /** The human-readable message */
    message: string;
};
