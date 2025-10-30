import { Api } from "@/api/api";
import React, { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner.tsx";
import type { SimpleAccount } from "@/api/generated";

/** Data provided by the {@link ACCOUNT_CONTEXT} */
export type AccountContext = {
    /** The currently logged-in account */
    account: SimpleAccount;

    /** Reload the account's information */
    reset: () => void;
};

/** {@link React.Context} to access {@link AccountContext account information} */
const ACCOUNT_CONTEXT = React.createContext<AccountContext>({
    account: {
        uuid: "",
        display_name: "",
        email: "",
    },

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
 * Component for managing and providing the {@link AccountContext}
 *
 * This is a **singleton** only used at most **one** instance in your application.
 */
export function AccountProvider(props: AccountProviderProps) {
    const [account, setAccount] = React.useState<SimpleAccount | "loading">("loading");
    let fetching = false;

    /**
     * Fetch the account
     */
    const fetchAccount = async () => {
        // Guard against a lot of calls
        if (fetching) return;
        fetching = true;
        setAccount("loading");

        const res = await Api.account.getMe(); // Clear guard against a lot of calls
        setAccount(res);

        fetching = false;
    };

    useEffect(() => {
        fetchAccount().then();
    }, []);

    if (account === "loading") {
        return (
            <div className={"flex h-screen items-center justify-center"}>
                <Spinner />
            </div>
        );
    }

    return (
        <ACCOUNT_CONTEXT.Provider
            value={{
                account,
                reset: fetchAccount,
            }}
        >
            {props.children}
        </ACCOUNT_CONTEXT.Provider>
    );
}
