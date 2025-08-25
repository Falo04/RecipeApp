import { Api } from "@/api/api";
import { StatusCode } from "@/api/error";
import { Login } from "@/components/login";
import { Navigate } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.tsx";
import WS from "@/api/websockets.ts";
import type { SimpleAccount } from "@/api/model/account.interface.ts";

/** The global {@link AccountProvider} instance */
let ACCOUNT_PROVIDER: AccountProvider | null = null;

/** Data provided by the {@link ACCOUNT_CONTEXT} */
export type AccountContext = {
    /** The currently logged-in account */
    account: SimpleAccount | undefined;

    /** Reload the account's information */
    reset: () => void;
};

/** {@link React.Context} to access {@link AccountContext account information} */
const ACCOUNT_CONTEXT = React.createContext<AccountContext>({
    account: undefined,

    /**
     * Reset the account's information
     */
    reset: () => {},
});
ACCOUNT_CONTEXT.displayName = "AccountContext";
export default ACCOUNT_CONTEXT;

/**
 * The properties of the account provider
 */
type AccountProviderProps = {
    /** The children of the properties */
    children: React.ReactNode | Array<React.ReactNode>;
};

/**
 * The state of the user provider
 */
type AccountProviderState = {
    /** The user */
    user: SimpleAccount | "unauthenticated" | "loading" | "disabled";
};

/**
 * Component for managing and providing the {@link AccountContext}
 *
 * This is a **singleton** only used at most **one** instance in your application.
 */
export class AccountProvider extends React.Component<AccountProviderProps, AccountProviderState> {
    state: AccountProviderState = {
        user: "loading",
    };

    fetching: boolean = false;

    /**
     * Fetch the account
     */
    fetchAccount = () => {
        // Guard against a lot of calls
        if (this.fetching) return;
        this.fetching = true;

        this.setState({ user: "loading" });

        Api.account.getMe().then((result) => {
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
        this.fetchAccount();
        WS.connect(`${window.location.origin.replace("http", "ws")}/api/v1/websocket`);

        // Register as global singleton
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        if (ACCOUNT_PROVIDER === null) ACCOUNT_PROVIDER = this;
        // eslint-disable-next-line no-console
        else if (ACCOUNT_PROVIDER === this) console.error("UserProvider did mount twice");
        // eslint-disable-next-line no-console
        else console.error("Two instances of UserProvider are used");
    }

    /**
     * Hook when the component will unmount
     */
    componentWillUnmount() {
        // Deregister as global singleton
        if (ACCOUNT_PROVIDER === this) ACCOUNT_PROVIDER = null;
        // eslint-disable-next-line no-console
        else if (ACCOUNT_PROVIDER === null) console.error("UserProvider instance did unmount twice");
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
                        <Login />
                    </>
                );
            default:
                return (
                    <ACCOUNT_CONTEXT.Provider
                        value={{
                            account: this.state.user === "disabled" ? undefined : this.state.user,
                            reset: this.fetchAccount,
                        }}
                    >
                        {this.props.children}
                    </ACCOUNT_CONTEXT.Provider>
                );
        }
    }
}
