import { UserProvider } from "@/context/user";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import WS from "@/api/websockets.ts";

export const Route = createFileRoute("/")({
    component: () => {
        useEffect(() => {
            WS.connect(`${window.location.origin.replace("http", "ws")}/api/frontend/v1/websocket`);
        }, []);
        return (
            <UserProvider>
                <Navigate to={"/app/recipes"} search={{ page: 1, search: "" }} />
            </UserProvider>
        );
    },
});
