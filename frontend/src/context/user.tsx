import { ApiClient } from "@/api/api-client";
import { StatusCode, type ApiError } from "@/api/models/global.interface";
import type { SimpleUser } from "@/api/models/user.interface";
import { Login } from "@/components/login";
import { Spinner } from "@/components/ui/spinner";
import { Navigate } from "@tanstack/react-router";
import axios from "axios";
import React from "react";
import { toast } from "sonner";
import { boolean } from "zod";

/** The global {@link UserProvider} instance */
let USER_PROVIDER: UserProvider | null = null;

/** Data provided by the {@link USER_CONTEXT} */
export type UserContext = {
  /** The currently logged-in user */
  user: SimpleUser;

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
  isLoading: boolean;
};

/**
 * Component for managing and providing the {@link UserContext}
 *
 * This is a **singleton** only use at most **one** instance in your application.
 */
export class UserProvider extends React.Component<UserProviderProps, UserProviderState> {
  state: UserProviderState = {
    user: {
      display_name: "",
      email: "",
      uuid: "",
    },
    isLoading: false,
  };

  /**
   * Fetch the user
   */
  fetchUser = () => {
    // Guard against a lot of calls
    if (this.state.isLoading) return;

    this.setState({ isLoading: true });

    ApiClient.get("/users/me").then((data) => {
      const user: SimpleUser = data.data;
      this.setState({ user });
    }).catch((error: any) => {
      if (axios.isAxiosError(error) && error.response) {
        const apiError: ApiError = error.response.data;
        switch (apiError.status_code) {
          case StatusCode.Unauthenticated:
            this.setState({ user: "unauthenticated" });
            break;
          default:
            toast.error(`Error ${error.message}`);
            break;
        }
      } else {
        console.error(error);
      }
    });
    // Clear guard against a lot of calls
    this.setState({ isLoading: false });
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
    if (this.state.isLoading) {
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
