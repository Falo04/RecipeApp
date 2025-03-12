import { Err, Ok, type Result } from "@/utils/result";
import { parseError, StatusCode, type ApiError } from "./error";
import { RequiredError, ResponseError } from "./generated";
import CONSOLE from "@/utils/console";

export const Api = {

}

export async function handleError<T>(promise: Promise<T>): Promise<Result<T, ApiError>> {
  try {
    return new Ok(await promise);
  } catch (e) {
    if (e instanceof ResponseError) {
      return new Err(await parseError(e.response));
    } else if (e instanceof RequiredError) {
      CONSOLE.error(e);
      return new Err({
        status_code: StatusCode.JsonDecodeError,
        message: "The server's response didn't match the spec",
      });
    } else {
      CONSOLE.error("Unknown error occurred:", e);
      return new Err({
        status_code: StatusCode.ArbitraryJSError,
        message: "Unknown error occurred",
      });
    }
  }
}
