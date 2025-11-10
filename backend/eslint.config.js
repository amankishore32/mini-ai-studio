// eslint-disable-next-line @typescript-eslint/no-require-imports
const js = require("@eslint/js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const globals = require("globals");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "coverage",
      "**/*.d.ts",
      "build",
      "*.lock",
      "*.log",
      ".vscode",
      ".idea",
      "prisma",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,js}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-types": "off",
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "warn",
    },
  }
);
