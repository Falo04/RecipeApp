import React, { useEffect } from "react";
import { Login } from "@/components/login.tsx";

/**
 * Function which should trigger in case of error
 */
type ErrorListener = (error: unknown) => void;

/**
 * Handler for errors and has to be a singleton
 */
class ErrorStore {
    private listener: ErrorListener | null = null;

    /**
     * Register a new ErrorListener
     *
     * @param listener ErrorListener
     */
    subscribe(listener: ErrorListener) {
        if (!this.listener) {
            this.listener = listener;
        }
    }

    /**
     * Triggers for all listener the ErrorListener
     *
     * @param error error
     */
    report(error: unknown) {
        if (this.listener) {
            this.listener(error);
        }
    }
}

export const ERROR_STORE = new ErrorStore();

/**
 * The properties for {@link ErrorContext}
 */
export type ErrorContextProps = object;

/**
 * Error Container which stays in the root and has to be a singleton
 */
export function ErrorContext(_props: ErrorContextProps) {
    const [error, setError] = React.useState<unknown>(null);

    useEffect(() => {
        ERROR_STORE.subscribe(setError);
    }, []);

    if (error === "Unauthorized") {
        return <Login />;
    }

    if (error) {
        throw error;
    }

    return undefined;
}
