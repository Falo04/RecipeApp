/** The discriminator the webserver puts on a form error body */
export const FORM_ERROR_RESULT = "Err";

/** Body the webserver sends for a form error */
export type FormErrorResponse<TError> = {
    result: typeof FORM_ERROR_RESULT;
    error: TError;
};

/** The success half of a response that may also be a form error */
export type FormValue<TResponse> = Exclude<TResponse, FormErrorResponse<unknown>>;

/** The error half of a response that may also be a form error */
export type FormError<TResponse> =
    Extract<TResponse, FormErrorResponse<unknown>> extends FormErrorResponse<infer TError> ? TError : never;

/**
 * Narrows a response to its form error half
 *
 * @param response A response returned by a generated endpoint
 */
export function isFormError<TResponse>(
    response: TResponse,
): response is Extract<TResponse, FormErrorResponse<unknown>> {
    return (
        typeof response === "object" &&
        response !== null &&
        (response as Partial<FormErrorResponse<unknown>>).result === FORM_ERROR_RESULT
    );
}
