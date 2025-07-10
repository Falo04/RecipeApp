import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import jsdoc from "eslint-plugin-jsdoc";

export default defineConfig([
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    jsdoc.configs["flat/recommended"],
    {
        ignores: ["src/components/ui/**", "eslint.config.js", "src/index.css"],
    },
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            globals: globals.browser,
            parser: tseslint.parser,
            parserOptions: { project: ["./tsconfig.json"] },
        },
        plugins: { jsdoc },
        rules: {
            "no-console": "warn",
            "no-alert": "warn",

            // TypeScript
            "@typescript-eslint/no-empty-interface": "warn",

            // React
            "react/jsx-uses-react": "off",
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",

            // jsdoc
            "jsdoc/check-alignment": "warn",
            "jsdoc/check-indentation": "warn",
            "jsdoc/require-returns": "off",
            "jsdoc/require-param": "off",
        },
    },
]);
