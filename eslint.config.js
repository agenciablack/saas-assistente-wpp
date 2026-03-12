import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["**/github-pages/**", "**/dist/**", "**/node_modules/**"],
  },
  ...tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.node,
        },
      },
      plugins: {
        "react-hooks": reactHooks,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "no-empty": "off",
      },
    },
    {
      files: ["tailwind.config.js"],
      rules: {
        "no-undef": "off",
      },
    }
  ),
];
