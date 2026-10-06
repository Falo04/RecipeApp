import { defineConfig } from "orval";

export default defineConfig({
    api: {
        input: {
            target: "http://webserver:8080/docs/frontend.json",
            filters: {
                mode: "exclude",
                tags: ["Websocket"],
            },
        },
        output: {
            target: "./src/api/generated/endpoints.ts",
            schemas: "./src/api/generated/model",
            mode: "tags-split",
            client: "react-query",
            httpClient: "fetch",
            clean: true,
            override: {
                mutator: {
                    path: "./src/api/http.ts",
                    name: "customFetch",
                },
                fetch: {
                    includeHttpResponseReturnType: false,
                },
                query: {
                    signal: true,
                },
            },
        },
    },
});
