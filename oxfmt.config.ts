import { defineConfig } from "oxfmt";

export default defineConfig({
    printWidth: 80,
    tabWidth: 4,
    ignorePatterns: ["**/dist/**", "**/build/**", "**/node_modules/**"],
    overrides: [
        {
            files: ["frontend/**"],
            tabWidth: 2,
        },
    ],
});
