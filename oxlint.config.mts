import type { OxlintConfig } from "oxlint";

export default {
  // Deliberately weak code; scripts/linter-fixtures.test.mts lints it explicitly.
  ignorePatterns: ["security/linter-tests/**"],
  plugins: ["typescript", "unicorn", "oxc", "import", "node", "promise"],
  env: { node: true },
  categories: {
    correctness: "error",
    suspicious: "error",
    pedantic: "error",
    perf: "error",
  },
  rules: {
    "typescript/consistent-type-imports": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-non-null-assertion": "error",
    "typescript/strict-boolean-expressions": "error",
  },
  options: {
    typeAware: true,
    typeCheck: true,
    maxWarnings: 0,
    reportUnusedDisableDirectives: "error",
  },
} satisfies OxlintConfig;
