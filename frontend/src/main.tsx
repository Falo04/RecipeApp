import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./i18n";
import "./styles.css";
import "./styles.css";
import { Toaster } from "sonner";
import { createQueryClient } from "./api/query-client.ts";
import { refreshOnDataChanges } from "./api/data-changes.ts";
import WS from "./api/websockets.ts";

const queryClient = createQueryClient();
refreshOnDataChanges(queryClient, WS);

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
            <QueryClientProvider client={queryClient}>
                <Toaster richColors expand={true} />
                <RouterProvider router={router} />
            </QueryClientProvider>
        </StrictMode>,
    );
}
