import { at, list, text } from "./report-input.mts";

/** Never manufacture an assessment rationale or ignore a reasonless rule. */
export function acceptanceReason(match: unknown): string | null {
  const rules = list(at(match, "appliedIgnoreRules"));
  const reasons = rules.map((rule) => text(at(rule, "reason")).trim());
  if (reasons.length === 0 || reasons.some((reason) => !/\p{L}/u.test(reason)))
    return null;
  return [...new Set(reasons)].join("; ");
}
