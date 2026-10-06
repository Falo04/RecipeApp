import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./i18n";
import "./styles.css";
import "./styles.css";
import { Toaster } from "sonner";
import { createQueryClient } from "./api/query-client.ts";

const queryClient = createQueryClient();

// Create a new router instance
const router = createRouter({
    routeTree,
    context: { queryClient },

    defaultPreload: "intent",
    scrollRestoration: true,
    defaultStructuralSharing: true,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <Toaster richColors expand={true} />
            <RouterProvider router={router} />
        </StrictMode>,
    );
}
