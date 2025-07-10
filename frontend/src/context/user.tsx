import { Api } from "@/api/api";
import { StatusCode } from "@/api/error";
import type { SimpleUser } from "@/api/model/user.interface";
import { Login } from "@/components/login";
import { Navigate } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.tsx";

/** The global {@link UserProvider} instance */
let USER_PROVIDER: UserProvider | null = null;

/** Data provided by the {@link USER_CONTEXT} */
export type UserContext = {
    /** The currently logged-in user */
    user: SimpleUser | undefined;

    /** Reload the user's information */
    reset: () => void;
};

/** {@link React.Context} to access {@link UserContext user information} */
const USER_CONTEXT = React.createContext<UserContext>({
    user: undefined,

    /**
     * Reset the user's information
     */
    reset: () => {},
});
USER_CONTEXT.displayName = "UserContext";
export default USER_CONTEXT;

/**
 * The properties of the user provider
 */
type UserProviderProps = {
    /** The children of the properties */
    children: React.ReactNode | Array<React.ReactNode>;
};

/**
 * The state of the user provider
 */
type UserProviderState = {
    /** The user */
    user: SimpleUser | "unauthenticated" | "loading" | "disabled";
};

/**
 * Component for managing and providing the {@link UserContext}
 *
 * This is a **singleton** only use at most **one** instance in your application.
 */
export class UserProvider extends React.Component<UserProviderProps, UserProviderState> {
    state: UserProviderState = {
        user: "loading",
    };

    fetching: boolean = false;

    fetchConfig = () => {
        if (this.fetching) return;
        this.fetching = true;

        this.setState({ user: "loading" });

        Api.meta.get().then((result) => {
            if (result.error) {
                toast.error(result.error.message);
            }

            if (result.data) {
                if (result.data.authentication_enabled) {
                    this.fetchUser();
                } else {
                    this.setState({ user: "disabled" });
                }
            }
        });
        this.fetching = false;
    };

    /**
     * Fetch the user
     */
    fetchUser = () => {
        // Guard against a lot of calls
        if (this.fetching) return;
        this.fetching = true;

        this.setState({ user: "loading" });

        Api.user.getMe().then((result) => {
            if (result.error) {
                switch (result.error.status_code) {
                    case StatusCode.Unauthenticated:
                        this.setState({ user: "unauthenticated" });
                        break;
                    default:
                        toast.error(result.error.message);
                        break;
                }
            }

            if (result.data) {
                this.setState({ user: result.data });
            }
        }); // Clear guard against a lot of calls
        this.fetching = false;
    };

    /**
     * Hook when the component mounts
     */
    componentDidMount() {
        this.fetchConfig();

        // Register as global singleton
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        if (USER_PROVIDER === null) USER_PROVIDER = this;
        // eslint-disable-next-line no-console
        else if (USER_PROVIDER === this) console.error("UserProvider did mount twice");
        // eslint-disable-next-line no-console
        else console.error("Two instances of UserProvider are used");
    }

    /**
     * Hook when the component will unmount
     */
    componentWillUnmount() {
        // Deregister as global singleton
        if (USER_PROVIDER === this) USER_PROVIDER = null;
        // eslint-disable-next-line no-console
        else if (USER_PROVIDER === null) console.error("UserProvider instance did unmount twice");
        // eslint-disable-next-line no-console
        else console.error("Two instances of UserProvider are used");
    }

    /**
     * The render function
     */
    render() {
        switch (this.state.user) {
            case "loading":
                return (
                    <div className={"flex h-screen items-center justify-center"}>
                        <Spinner />
                    </div>
                );
            case "unauthenticated":
                return (
                    <>
                        <Navigate to="/" />
                        <Login
                            onLogin={() => {
                                this.fetchUser();
                            }}
                        />
                    </>
                );
            default:
                return (
                    <USER_CONTEXT.Provider
                        value={{
                            user: this.state.user === "disabled" ? undefined : this.state.user,
                            reset: this.fetchConfig,
                        }}
                    >
                        {this.props.children}
                    </USER_CONTEXT.Provider>
                );
        }
    }
}
