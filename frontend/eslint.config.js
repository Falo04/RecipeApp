import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        ignores: ["src/components/ui/**", "eslint.config.js", "src/index.css"],
    },
    {
        files: ["**/*.{ts,tsx}"],
        plugins: { js },
        extends: ["js/recommended"],
    },
    { files: ["**/*.{ts,tsx}"], languageOptions: { globals: globals.browser } },
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        rules: {
            "react/react-in-jsx-scope": "off",
        },
    },
]);
