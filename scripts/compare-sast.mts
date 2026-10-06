import { prepare } from "./compare-sast-prepare.mts";
import { score } from "./compare-sast-score.mts";

// Entry point for scripts/compare-sast.sh: prepare <corpus copy> | score <out>.

const [command, target] = process.argv.slice(2);
if (target === undefined) throw new Error("Usage: prepare <dir> | score <dir>");
if (command === "prepare") await prepare(target);
else if (command === "score") await score(target);
else throw new Error(`Unknown command: ${command ?? ""}`);
