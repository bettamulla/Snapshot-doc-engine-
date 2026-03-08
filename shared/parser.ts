import type { OECTAssessment, ParseResult, OverallStatus, DomainLabel, DomainName, InstructionLabel } from "./types";

const REQUIRED_LINES = [
  "OECT Exposure Assessment",
  "Score:",
  "Status:",
  "Category Breakdown:",
  "Capture:",
  "Conversion:",
  "Delivery:",
  "Retention:",
  "Primary Weakness:",
  "Key Insight:",
];

const STATUS_TO_INSTRUCTION: Record<OverallStatus, InstructionLabel> = {
  "Critical Exposure": "Containment Required",
  "Elevated Exposure": "Monitoring",
  "Contained": "Stable",
  "Optimised": "Maintained",
};

const VALID_STATUSES: OverallStatus[] = [
  "Critical Exposure",
  "Elevated Exposure",
  "Contained",
  "Optimised",
];

const VALID_LABELS: DomainLabel[] = ["critical", "exposed", "contained", "optimised"];

const VALID_DOMAINS: DomainName[] = ["Capture", "Conversion", "Delivery", "Retention"];

export function parseOECTOutput(text: string): ParseResult {
  const errors: string[] = [];
  const lines = text.split("\n").map((line) => line.trim());

  // Check for required headers
  const hasHeader = lines.some((line) => line === "OECT Exposure Assessment");
  if (!hasHeader) {
    errors.push("Missing: OECT Exposure Assessment");
  }

  // Parse Score line
  const scoreLine = lines.find((line) => line.startsWith("Score:"));
  if (!scoreLine) {
    errors.push("Missing: Score: X/150 (Y%)");
  }

  const scoreMatch = scoreLine?.match(/Score:\s*(\d+)\/150\s*\((\d+)%\)/);
  if (!scoreMatch) {
    errors.push("Invalid Score format. Expected: Score: X/150 (Y%)");
  }

  const scoreTotal = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
  const containmentPct = scoreMatch ? parseInt(scoreMatch[2], 10) : 0;

  // Parse Status line
  const statusLine = lines.find((line) => line.startsWith("Status:"));
  if (!statusLine) {
    errors.push("Missing: Status");
  }

  const statusMatch = statusLine?.match(/Status:\s*(.+)$/);
  const statusText = statusMatch ? statusMatch[1].trim() : "";

  if (!VALID_STATUSES.includes(statusText as OverallStatus)) {
    errors.push(`Invalid Status. Must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  // Parse Category Breakdown
  const captureMatch = lines.find((line) => line.startsWith("•") && line.includes("Capture:"))?.match(/Capture:\s*(\d+)%\s*\((\w+)\)/);
  const conversionMatch = lines.find((line) => line.startsWith("•") && line.includes("Conversion:"))?.match(/Conversion:\s*(\d+)%\s*\((\w+)\)/);
  const deliveryMatch = lines.find((line) => line.startsWith("•") && line.includes("Delivery:"))?.match(/Delivery:\s*(\d+)%\s*\((\w+)\)/);
  const retentionMatch = lines.find((line) => line.startsWith("•") && line.includes("Retention:"))?.match(/Retention:\s*(\d+)%\s*\((\w+)\)/);

  if (!captureMatch) errors.push("Missing or invalid: Capture category");
  if (!conversionMatch) errors.push("Missing or invalid: Conversion category");
  if (!deliveryMatch) errors.push("Missing or invalid: Delivery category");
  if (!retentionMatch) errors.push("Missing or invalid: Retention category");

  const captureLabel = (captureMatch?.[2] || "").toLowerCase() as DomainLabel;
  const conversionLabel = (conversionMatch?.[2] || "").toLowerCase() as DomainLabel;
  const deliveryLabel = (deliveryMatch?.[2] || "").toLowerCase() as DomainLabel;
  const retentionLabel = (retentionMatch?.[2] || "").toLowerCase() as DomainLabel;

  if (captureLabel && !VALID_LABELS.includes(captureLabel)) errors.push(`Invalid Capture label: ${captureLabel}`);
  if (conversionLabel && !VALID_LABELS.includes(conversionLabel)) errors.push(`Invalid Conversion label: ${conversionLabel}`);
  if (deliveryLabel && !VALID_LABELS.includes(deliveryLabel)) errors.push(`Invalid Delivery label: ${deliveryLabel}`);
  if (retentionLabel && !VALID_LABELS.includes(retentionLabel)) errors.push(`Invalid Retention label: ${retentionLabel}`);

  // Parse Primary Weakness
  const weaknessLine = lines.find((line) => line.startsWith("Primary Weakness:"));
  if (!weaknessLine) {
    errors.push("Missing: Primary Weakness");
  }

  const weaknessMatch = weaknessLine?.match(/Primary Weakness:\s*(.+)$/);
  const weaknessText = weaknessMatch ? weaknessMatch[1].trim() : "None";

  if (weaknessText !== "None" && !VALID_DOMAINS.includes(weaknessText as DomainName)) {
    errors.push(`Invalid Primary Weakness. Must be one of: ${VALID_DOMAINS.join(", ")}, or None`);
  }

  // Parse Key Insight
  const insightLine = lines.find((line) => line.startsWith("Key Insight:"));
  if (!insightLine) {
    errors.push("Missing: Key Insight");
  }

  const insightMatch = insightLine?.match(/Key Insight:\s*(.+)$/);
  const keyInsight = insightMatch ? insightMatch[1].trim() : "";

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // All validations passed
  const overallStatus = statusText as OverallStatus;
  const instructionLabel = STATUS_TO_INSTRUCTION[overallStatus];
  const exposurePct = 100 - containmentPct;

  const assessment: OECTAssessment = {
    scoreTotal,
    containmentPct,
    exposurePct,
    overallStatus,
    instructionLabel,
    domains: {
      capture: {
        name: "Capture",
        percent: parseInt(captureMatch![1], 10),
        label: captureLabel,
      },
      conversion: {
        name: "Conversion",
        percent: parseInt(conversionMatch![1], 10),
        label: conversionLabel,
      },
      delivery: {
        name: "Delivery",
        percent: parseInt(deliveryMatch![1], 10),
        label: deliveryLabel,
      },
      retention: {
        name: "Retention",
        percent: parseInt(retentionMatch![1], 10),
        label: retentionLabel,
      },
    },
    primaryWeakness: (weaknessText as DomainName | "None") || "None",
    keyInsight,
  };

  return { success: true, data: assessment };
}

export function calculateRevenueLeakage(monthlyRevenue: number, exposurePct: number) {
  const monthlyConstrained = monthlyRevenue * (exposurePct / 100);
  const annualConstrained = monthlyConstrained * 12;
  return { monthlyConstrained, annualConstrained };
}
