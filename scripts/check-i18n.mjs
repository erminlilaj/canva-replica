// Crude guard against hardcoded Albanian/English UI text in JSX.
// Flags JSX text nodes and common string attributes that look like real
// words (start with an uppercase letter) instead of going through sq.ts.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const roots = ["src/editor", "src/blocks"];
const textAttrs = ["placeholder", "alt", "title"];
const wordPattern = /^[A-ZÇË][\wçëÇË'’.,%-]*(?:\s+[\wçëÇË'’.,%-]+)*$/;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (extname(full) === ".tsx") files.push(full);
  }
  return files;
}

let offenders = [];

for (const root of roots) {
  for (const file of walk(root)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (line.includes("i18n-ignore")) return;
      // JSX text between tags, e.g. >Some Text<
      const textMatch = line.match(/>([^<>{}\n]+)</g);
      if (textMatch) {
        for (const chunk of textMatch) {
          const text = chunk.slice(1, -1).trim();
          if (text && wordPattern.test(text)) {
            offenders.push(`${file}:${index + 1}  JSX text "${text}"`);
          }
        }
      }
      // Suspicious string attributes: placeholder="X", alt="X", title="X"
      for (const attr of textAttrs) {
        const attrMatch = line.match(new RegExp(`${attr}="([^"]+)"`));
        if (attrMatch && wordPattern.test(attrMatch[1])) {
          offenders.push(`${file}:${index + 1}  ${attr}="${attrMatch[1]}"`);
        }
      }
    });
  }
}

if (offenders.length > 0) {
  console.error("Hardcoded UI text found outside src/i18n/sq.ts:\n");
  offenders.forEach((line) => console.error("  " + line));
  console.error("\nMove these strings into sq.ts, or add `// i18n-ignore` on the line if intentional.");
  process.exit(1);
}

console.log("check:i18n passed — no hardcoded UI text found in src/editor or src/blocks.");
