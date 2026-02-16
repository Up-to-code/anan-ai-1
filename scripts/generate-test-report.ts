#!/usr/bin/env bun
/**
 * Generate test-results-report.html from JSON produced by focused-test.cjs --json.
 *
 * Usage:
 *   node tests/focused-test.cjs <thread_id> --json | bun run scripts/generate-test-report.ts -o test-results-report.html
 *   bun run scripts/generate-test-report.ts --input results.json -o test-results-report.html
 *   cat results.json | bun run scripts/generate-test-report.ts  # prints to stdout
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const projectRoot = join(import.meta.dir, "..");
const templatePath = join(projectRoot, "test-results-report.html");

type TestResult = {
  id: string;
  category: string;
  description: string;
  pass: boolean;
  details?: string;
  durationSeconds?: number;
};

type ReportInput = {
  timestamp?: string;
  threadId?: string;
  total: number;
  passCount: number;
  passRate: number;
  results: TestResult[];
  durations?: Record<string, number>;
};

function wilsonCI(passCount: number, total: number, z = 1.96): [number, number] {
  if (total === 0) return [0, 0];
  const p = passCount / total;
  const n = total;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = p + z2 / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return [
    Math.max(0, Math.round(((center - spread) / denom) * 100)),
    Math.min(100, Math.round(((center + spread) / denom) * 100)),
  ];
}

async function main(): Promise<void> {
  let input: string;
  const outputArg = process.argv.indexOf("-o");
  const inputArg = process.argv.indexOf("--input");
  const outputPath = outputArg >= 0 ? process.argv[outputArg + 1] : null;
  const inputPath = inputArg >= 0 ? process.argv[inputArg + 1] : null;

  if (inputPath) {
    input = readFileSync(inputPath, "utf-8");
  } else {
    input = await new Promise<string>((resolve, reject) => {
      const chunks: string[] = [];
      process.stdin.setEncoding("utf-8");
      process.stdin.on("data", (c) => chunks.push(c));
      process.stdin.on("end", () => resolve(chunks.join("")));
      process.stdin.on("error", reject);
    });
  }

  let data: ReportInput;
  try {
    data = JSON.parse(input) as ReportInput;
  } catch (e) {
    console.error("Failed to parse JSON input:", e);
    process.exit(1);
  }

  const { total, passCount, passRate, results } = data;
  const [ciLo, ciHi] = wilsonCI(passCount, total);
  const testResultsForJs = results.map((r) => ({
    id: r.id,
    pass: r.pass,
  }));

  let html = readFileSync(templatePath, "utf-8");

  // Replace testResults array in script
  html = html.replace(
    /const testResults = \[[\s\S]*?\];/,
    `const testResults = ${JSON.stringify(testResultsForJs)};`,
  );

  // Replace highlight box values
  html = html.replace(
    /<div class="highlight-value">\d+%<\/div>/,
    `<div class="highlight-value">${Math.round(passRate)}%</div>`,
  );
  html = html.replace(
    /18 of 20 tests passed \(95% CI: 68–99%\)/,
    `${passCount} of ${total} tests passed (95% CI: ${ciLo}–${ciHi}%)`,
  );

  // Replace stat boxes
  html = html.replace(
    /<div class="stat-value">20<\/div>/g,
    `<div class="stat-value">${total}</div>`,
  );
  html = html.replace(
    /<div class="stat-value pass">18<\/div>/,
    `<div class="stat-value pass">${passCount}</div>`,
  );
  html = html.replace(
    /<div class="stat-value fail">2<\/div>/,
    `<div class="stat-value fail">${total - passCount}</div>`,
  );
  html = html.replace(
    /90% pass rate/,
    `${Math.round(passRate)}% pass rate`,
  );
  html = html.replaceAll("95% CI: 68–99%", `95% CI: ${ciLo}–${ciHi}%`);
  html = html.replace(
    /10% remaining/,
    `${Math.round(100 - passRate)}% remaining`,
  );
  html = html.replace(
    /style="width: 90%/,
    `style="width: ${Math.round(passRate)}%`,
  );

  // Update distribution chart data
  html = html.replace(
    /labels: \["Passed \(18, 90%\)", "Failed \(2, 10%\)"\],/,
    `labels: ["Passed (${passCount}, ${Math.round(passRate)}%)", "Failed (${total - passCount}, ${Math.round(100 - passRate)}%)"],`,
  );
  html = html.replace(
    /data: \[18, 2\],/,
    `data: [${passCount}, ${total - passCount}],`,
  );

  // Update radar and category chart data from results
  const categories = ["Formatting", "Images", "Search", "Memory", "IQ"];
  const radarData = categories.map(
    (cat) =>
      (results.filter((r) => r.category === cat && r.pass).length /
        Math.max(1, results.filter((r) => r.category === cat).length)) *
      100,
  );
  html = html.replace(
    /data: \[100, 100, 100, 100, 67\],[\s\S]*?pointBackgroundColor:/,
    `data: [${radarData.join(", ")}],\n              backgroundColor: "rgba(34, 197, 94, 0.2)",\n              borderColor: "#22c55e",\n              pointBackgroundColor:`,
  );

  // Category bar chart
  html = html.replace(
    /data: \[100, 100, 100, 100, 67\],\s*backgroundColor:/,
    `data: [${radarData.join(", ")}],\n              backgroundColor:`,
  );

  if (outputPath) {
    writeFileSync(outputPath, html);
    console.error(`Report written to ${outputPath}`);
  } else {
    process.stdout.write(html);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
