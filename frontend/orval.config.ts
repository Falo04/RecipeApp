import { defineConfig } from "orval";

export default defineConfig({
    api: {
        input: {
            target: "http://webserver:8080/docs/frontend.json",
            // The websocket route documents no responses, which fails the spec
            // validation. Validation runs before `filters`, so it is disabled.
            unsafeDisableValidation: true,
            // The websocket endpoint answers with a protocol switch, there is
            // no request for orval to generate.
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
