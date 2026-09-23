import { defineConfig } from "oxlint";

export default defineConfig({
    plugins: ["import", "typescript", "react", "react-perf", "unicorn"],
    categories: {
        correctness: "error",
        suspicious: "warn",
    },
    env: {
        node: true,
        es2021: true,
    },
    overrides: [
        {
            files: ["frontend/**"],
            env: {
                browser: true,
                node: false,
            },
        },
    ],
    ignorePatterns: [
        "**/dist/**",
        "**/build/**",
        "**/node_modules/**",
        "**/*.iml",
        "frontend/temp.js",
    ],
});
