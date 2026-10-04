import type { UserConfig } from "@commitlint/types";

export default {
  parserPreset: "conventional-changelog-conventionalcommits",
  defaultIgnores: false,
  helpUrl: "https://www.conventionalcommits.org/en/v1.0.0/",
  // Enforce the specification's structure without restricting types or casing.
  rules: {
    "type-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"],
  },
} satisfies UserConfig;
