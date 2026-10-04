import type { Configuration } from "markdownlint";

export default {
  globs: ["**/*.{md,markdown}"],
  gitignore: true,
  ignores: ["**/{.git,node_modules,dist,build,coverage}/**"],
  config: {
    // Oxfmt owns Markdown layout and 80-column prose wrapping. Keep formatting
    // advisory in task check while markdownlint checks document structure.
    extends: "markdownlint/style/prettier",
    "single-trailing-newline": false,
    "table-pipe-style": false,
    "blanks-around-tables": false,
    "table-column-style": false,
  } satisfies Configuration,
};
