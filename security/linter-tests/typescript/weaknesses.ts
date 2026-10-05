// oxlint fixtures: linted by the linter-fixture test, never executed.

// CWE-94: evaluating input as code.
export function run(code: string): unknown {
  // expect: no-implied-eval
  setTimeout(code, 0);
  // ok: no-implied-eval
  setTimeout(() => code, 0);
  // expect: no-eval
  return eval(code);
}
