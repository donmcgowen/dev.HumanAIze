import { readFile } from "node:fs/promises";
import { extractTextFromPDF, parseClarityReportText, validateClarityPDF } from "../server/pdfExtraction";
import { upsertUserProfile } from "../server/db";

function getArgValue(flag: string): string | undefined {
  const index = process.argv.findIndex((arg) => arg === flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const pdfPath = getArgValue("--pdf");
  const userIdRaw = getArgValue("--userId");

  if (!pdfPath) {
    throw new Error("Missing --pdf argument");
  }

  if (!userIdRaw) {
    throw new Error("Missing --userId argument");
  }

  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("--userId must be a positive number");
  }

  const pdfBuffer = await readFile(pdfPath);
  const text = await extractTextFromPDF(pdfBuffer);
  const validation = validateClarityPDF(text);

  if (!validation.valid) {
    throw new Error(validation.error || "PDF is not a valid Dexcom Clarity report");
  }

  const extracted = parseClarityReportText(text);

  await upsertUserProfile(userId, {
    cgmAverageGlucose: extracted.averageGlucose,
    cgmTimeInRange: extracted.timeInRange,
    cgmA1cEstimate: extracted.estimatedA1C,
  });

  console.log(JSON.stringify({
    success: true,
    userId,
    metrics: {
      averageGlucose: extracted.averageGlucose ?? null,
      timeInRange: extracted.timeInRange ?? null,
      a1cEstimate: extracted.estimatedA1C ?? null,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error("[import-clarity-pdf] Failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
