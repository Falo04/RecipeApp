import { Api } from "@/api/api";
import { StatusCode, type ApiError } from "@/api/error";
import type { SimpleUser } from "@/api/model/user.interface";
import { Login } from "@/components/login";
import { Spinner } from "@/components/ui/spinner";
import { Navigate } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";

/** The global {@link UserProvider} instance */
let USER_PROVIDER: UserProvider | null = null;

/** Data provided by the {@link USER_CONTEXT} */
export type UserContext = {
  /** The currently logged-in user */
  user: SimpleUser;
  isAuthenticated: boolean;

  /** Reload the user's information */
  reset: () => void;
};

/** {@link React.Context} to access {@link FullUser user information} */
const USER_CONTEXT = React.createContext<UserContext>({
  user: {
    display_name: "",
    uuid: "",
    email: "",
  },
  isAuthenticated: false,

  /**
   * Reset the user's information
   */
  reset: () => { },
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
  user: SimpleUser | "unauthenticated";
  isAuthenticaed: boolean;
};

/**
 * Component for managing and providing the {@link UserContext}
 *
 * This is a **singleton** only use at most **one** instance in your application.
 */
export class UserProvider extends React.Component<UserProviderProps, UserProviderState> {
  state: UserProviderState = {
    user: "unauthenticated",
    isAuthenticaed: false,
  };

  fetching: boolean = false;

  /**
   * Fetch the user
   */
  fetchUser = () => {
    // Guard against a lot of calls
    if (this.fetching) return;
    this.fetching = true;

    Api.user.getMe().then((result) => {
      if (result.error) {
        switch (result.error.status_code) {
          case StatusCode.Unauthenticated:
            this.setState({ user: "unauthenticated", isAuthenticaed: false });
            break;
          default:
            toast.error(result.error.message);
            break;
        }
      }

      if (result.data) {
        this.setState({ user: result.data, isAuthenticaed: true })
      }
    });    // Clear guard against a lot of calls
    this.fetching = false;
  };

  /**
   * Hook when the component mounts
   */
  componentDidMount() {
    this.fetchUser();

    // Register as global singleton
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    if (USER_PROVIDER === null) USER_PROVIDER = this;
    else if (USER_PROVIDER === this) console.error("UserProvider did mount twice");
    else console.error("Two instances of UserProvider are used");
  }

  /**
   * Hook when the component will unmount
   */
  componentWillUnmount() {
    // Deregister as global singleton
    if (USER_PROVIDER === this) USER_PROVIDER = null;
    else if (USER_PROVIDER === null) console.error("UserProvider instance did unmount twice");
    else console.error("Two instances of UserProvider are used");
  }

  /**
   * The render function
   *
   * @returns The JSX component
   */
  render() {
    if (this.fetching) {
      return (<Spinner />);
    }
    switch (this.state.user) {
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
              user: this.state.user,
              isAuthenticated: this.state.isAuthenticaed,
              reset: this.fetchUser,
            }}
          >
            {this.props.children}
          </USER_CONTEXT.Provider>
        );
    }
  }
};


function componentDidMount() {
  throw new Error("Function not implemented.");
}
/**
 * Inspect an error and handle the {@link StatusCode.Unauthenticated} status code by requiring the user to log in again.
 *
 * @param error {@link ApiError} to inspect for {@link StatusCode.Unauthenticated}
 */
// export function inspectError(error: ApiError) {
//   switch (error.status_code) {
//     case StatusCode.Unauthenticated:
//       if (USER_PROVIDER !== null) USER_PROVIDER.setState({ user: "unauthenticated" });
//       else CONSOLE.warn("inspectError has been called without a UserProvider");
//       break;
//     default:
//       break;
//   }
// }
