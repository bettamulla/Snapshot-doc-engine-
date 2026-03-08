import jsPDF from "jspdf";
import type { OECTAssessment, ClientInfo } from "../../../shared/types";
import { calculateRevenueLeakage } from "../../../shared/parser";
import {
  generateDiagnosticFinding,
  generatePrimaryFocusBlock,
  generatePressureTest,
  generatePriorityOrder,
  generateRecommendationText,
} from "../../../shared/writingEngine";

const FONT_FAMILY = "helvetica";
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const ACCENT_COLOR = [107, 91, 149] as const; // Purple
const TOTAL_PAGES = 12;

interface PDFConfig {
  doc: jsPDF;
  pageNum: number;
  totalPages: number;
  clientName: string;
  assessmentDate: string;
}

function addHeader(config: PDFConfig) {
  const { doc } = config;
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(10);
  doc.text("HannsFree Operational Exposure Diagnostic", MARGIN, MARGIN - 5);
}

function addFooter(config: PDFConfig) {
  const { doc, pageNum, totalPages } = config;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9);
  const footerText = `HannsFree Operational Exposure Diagnostic | Page ${pageNum} of ${totalPages}`;
  doc.text(footerText, MARGIN, PAGE_HEIGHT - MARGIN + 5);
}

function addPage(config: PDFConfig): PDFConfig {
  const { doc, totalPages } = config;
  config.pageNum++;
  if (config.pageNum > 1) {
    doc.addPage();
  }
  addHeader(config);
  addFooter(config);
  return config;
}

function getYPosition(doc: jsPDF, currentY: number, lineHeight: number = 7): number {
  if (currentY + lineHeight > PAGE_HEIGHT - MARGIN - 10) {
    doc.addPage();
    addHeader({ doc, pageNum: 0, totalPages: 0, clientName: "", assessmentDate: "" });
    return MARGIN + 10;
  }
  return currentY;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "€";
  return `${symbol}${amount.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

export async function generateAuditPDF(clientInfo: ClientInfo, assessment: OECTAssessment) {
  const doc = new jsPDF("p", "mm", "a4");
  let config: PDFConfig = {
    doc,
    pageNum: 0,
    totalPages: TOTAL_PAGES,
    clientName: clientInfo.clientName,
    assessmentDate: clientInfo.assessmentDate,
  };

  // PAGE 1: COVER
  config = addPage(config);
  
  // Add logo at top-center (simplified: using text instead of image for PDF)
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("HannsFree", PAGE_WIDTH / 2, 25, { align: "center" });
  doc.setFontSize(9);
  doc.setFont(FONT_FAMILY, "normal");
  doc.text("Operational Exposure Diagnostic", PAGE_WIDTH / 2, 32, { align: "center" });
  
  // Title
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(28);
  doc.text("Operational Snapshot", MARGIN, 80);
  doc.text("Audit Report", MARGIN, 95);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(11);
  let y = 120;
  doc.text(`Client: ${clientInfo.clientName}`, MARGIN, y);
  y += 8;
  doc.text(`Business: ${clientInfo.businessName}`, MARGIN, y);
  y += 8;
  doc.text(`Assessment Date: ${clientInfo.assessmentDate}`, MARGIN, y);

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  y = 200;
  doc.text("CONFIDENTIAL", MARGIN, y);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9);
  doc.text("This report contains proprietary assessment data.", MARGIN, y + 6);

  // PAGE 2: EXECUTIVE SUMMARY
  config = addPage(config);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("Executive Summary", MARGIN, MARGIN + 10);

  y = MARGIN + 30;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(11);

  // Containment Level
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  doc.text("Containment Level", MARGIN, y);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(10);
  doc.text(`${assessment.containmentPct}% — ${assessment.overallStatus}`, MARGIN + 5, y + 7);

  y += 18;

  // Instruction Label
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  doc.text("Instruction", MARGIN, y);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(10);
  doc.text(assessment.instructionLabel, MARGIN + 5, y + 7);

  y += 18;

  // Primary Operational Risk
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  doc.text("Primary Operational Risk", MARGIN, y);
  y += 7;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(10);
  const primaryRiskText = `${assessment.primaryWeakness} instability.`;
  const riskLines = wrapText(doc, primaryRiskText, CONTENT_WIDTH - 5);
  riskLines.forEach((line) => {
    y = getYPosition(doc, y, 5);
    doc.text(line, MARGIN + 5, y);
    y += 5;
  });

  y += 8;

  // Exposure Snapshot
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  doc.text("Exposure Snapshot", MARGIN, y);
  y += 8;

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9);
  Object.values(assessment.domains).forEach((domain) => {
    y = getYPosition(doc, y, 5);
    doc.text(`${domain.name}: ${domain.percent}% (${domain.label.toUpperCase()})`, MARGIN + 5, y);
    y += 5;
  });

  y += 8;

  // Estimated Constrained Revenue
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  doc.text("Estimated Constrained Revenue", MARGIN, y);
  y += 8;

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(10);
  if (clientInfo.monthlyRevenue) {
    const revenue = calculateRevenueLeakage(clientInfo.monthlyRevenue, assessment.exposurePct);
    const symbol = clientInfo.currency === "GBP" ? "£" : clientInfo.currency === "USD" ? "$" : "€";
    doc.text(`Monthly: ${symbol}${revenue.monthlyConstrained.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`, MARGIN + 5, y);
    y += 6;
    doc.text(`Annual: ${symbol}${revenue.annualConstrained.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`, MARGIN + 5, y);
  } else {
    doc.text("Revenue estimate omitted (monthly revenue not supplied).", MARGIN + 5, y);
  }

  // PAGE 3: METHODOLOGY
  config = addPage(config);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("Methodology", MARGIN, MARGIN + 10);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(11);
  y = MARGIN + 25;

  const methodologyText = `This assessment uses the Operational Exposure Clientele Tracker (OECT) framework to measure structural exposure across four operational domains: Capture, Conversion, Delivery, and Retention.

The OECT score ranges from 0 to 150, where:
• Containment represents the percentage of operational controls that are stable and resilient.
• Exposure represents the inverse: the percentage of operational risk that remains uncontrolled or inconsistent.

Each domain is evaluated on a five-point scale: Optimised (90–100%), Contained (70–89%), Exposed (40–69%), or Critical (<40%).

The overall status is derived from the aggregate containment score and reflects the operational resilience of the business.`;

  const methodLines = wrapText(doc, methodologyText, CONTENT_WIDTH);
  methodLines.forEach((line) => {
    y = getYPosition(doc, y, 6);
    doc.text(line, MARGIN, y);
    y += 6;
  });

  // PAGE 4: CONTAINMENT SCORE
  config = addPage(config);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("Containment Score", MARGIN, MARGIN + 10);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(11);
  y = MARGIN + 30;

  // Score box
  doc.setDrawColor(ACCENT_COLOR[0], ACCENT_COLOR[1], ACCENT_COLOR[2]);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 40);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(24);
  doc.text(`${assessment.scoreTotal}/150`, MARGIN + 10, y + 15);

  doc.setFontSize(12);
  doc.text(`${assessment.containmentPct}% Containment`, MARGIN + 10, y + 28);

  doc.setFontSize(10);
  doc.setFont(FONT_FAMILY, "normal");
  doc.text(`${assessment.exposurePct}% Exposure`, MARGIN + 10, y + 35);

  y += 50;

  // Status
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(12);
  doc.text("Overall Status", MARGIN, y);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(11);
  doc.text(assessment.overallStatus, MARGIN, y + 7);

  y += 15;

  // Instruction Label
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(12);
  doc.text("Instruction Label", MARGIN, y);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(11);
  doc.text(assessment.instructionLabel, MARGIN, y + 7);

  // PAGE 5: EXPOSURE MAP
  config = addPage(config);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("Exposure Map", MARGIN, MARGIN + 10);

  y = MARGIN + 30;
  const tileWidth = (CONTENT_WIDTH - 4) / 2;
  const tileHeight = 35;
  const domains = Object.values(assessment.domains);

  domains.forEach((domain, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const tileX = MARGIN + col * (tileWidth + 4);
    const tileY = y + row * (tileHeight + 8);

    // Tile background
    const color =
      domain.label === "critical"
        ? [239, 68, 68]
        : domain.label === "exposed"
          ? [217, 119, 6]
          : domain.label === "contained"
            ? [59, 130, 246]
            : [34, 197, 94];

    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(tileX, tileY, tileWidth, tileHeight, "F");

    // Text
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(domain.name, tileX + 5, tileY + 8);

    doc.setFontSize(18);
    doc.text(`${domain.percent}%`, tileX + 5, tileY + 20);

    doc.setFontSize(9);
    doc.text(domain.label.toUpperCase(), tileX + 5, tileY + 28);

    doc.setTextColor(0, 0, 0);
  });

  // PAGE 6: DOMAIN BREAKDOWN
  config = addPage(config);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("Domain Breakdown", MARGIN, MARGIN + 10);

  y = MARGIN + 30;
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(10);
  doc.text("Domain", MARGIN, y);
  doc.text("Percent", MARGIN + 80, y);
  doc.text("Label", MARGIN + 120, y);

  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y + 2, MARGIN + CONTENT_WIDTH, y + 2);

  y += 10;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(10);

  Object.values(assessment.domains).forEach((domain) => {
    doc.text(domain.name, MARGIN, y);
    doc.text(`${domain.percent}%`, MARGIN + 80, y);
    doc.text(domain.label.toUpperCase(), MARGIN + 120, y);
    y += 8;
  });

  y += 5;
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(10);
  doc.text("Primary Weakness", MARGIN, y);
  doc.setFont(FONT_FAMILY, "normal");
  doc.text(assessment.primaryWeakness, MARGIN + 80, y);

  y += 10;
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(10);
  doc.text("Key Insight", MARGIN, y);
  y += 6;
  const insightLines = wrapText(doc, assessment.keyInsight, CONTENT_WIDTH - 10);
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9);
  insightLines.forEach((line) => {
    y = getYPosition(doc, y, 5);
    doc.text(line, MARGIN + 5, y);
    y += 5;
  });

  // PAGE 7: DIAGNOSTIC FINDINGS
  config = addPage(config);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("Diagnostic Findings", MARGIN, MARGIN + 10);

  y = MARGIN + 25;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9);

  Object.values(assessment.domains).forEach((domain, idx) => {
    if (idx > 0) {
      y += 5;
    }

    y = getYPosition(doc, y, 4);

    // Domain name
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(11);
    doc.text(domain.name, MARGIN, y);
    y += 7;

    // Observation
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(9);
    doc.text("Observation:", MARGIN, y);
    y += 5;
    doc.setFont(FONT_FAMILY, "normal");
    const obsText = `${domain.name} containment is ${domain.label.toUpperCase()} (${domain.percent}%).`;
    const obsLines = wrapText(doc, obsText, CONTENT_WIDTH - 5);
    obsLines.forEach((line) => {
      y = getYPosition(doc, y, 4);
      doc.text(line, MARGIN + 5, y);
      y += 4;
    });

    y += 2;

    // Interpretation
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(9);
    doc.text("Interpretation:", MARGIN, y);
    y += 5;
    doc.setFont(FONT_FAMILY, "normal");

    const interpretations: Record<string, string> = {
      critical: "Controls in this domain are failing or absent.",
      exposed: "Controls exist but are inconsistent and likely to degrade under load.",
      contained: "Controls are functional with minor instability.",
      optimised: "Controls are stable and resilient under normal operating conditions.",
    };

    const interpLines = wrapText(doc, interpretations[domain.label], CONTENT_WIDTH - 5);
    interpLines.forEach((line) => {
      y = getYPosition(doc, y, 4);
      doc.text(line, MARGIN + 5, y);
      y += 4;
    });

    y += 2;

    // Operational Effect
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(9);
    doc.text("Operational Effect:", MARGIN, y);
    y += 5;
    doc.setFont(FONT_FAMILY, "normal");

    const operationalEffects: Record<string, Record<string, string>> = {
      Capture: {
        weak: "Inbound demand may be missed or delayed due to weak intake structure and limited visibility.",
        strong: "Inbound demand is captured reliably with limited leakage at entry.",
      },
      Conversion: {
        weak: "Prospects may accumulate without progression due to inconsistent follow-up and process control.",
        strong: "Prospects progress with predictable cadence and reduced drop-off risk.",
      },
      Delivery: {
        weak: "Delivery may become reactive under pressure, increasing friction and client-facing instability.",
        strong: "Delivery remains consistent with limited operational strain.",
      },
      Retention: {
        weak: "Repeat business is likely constrained by weak post-delivery continuity and limited re-engagement structure.",
        strong: "Re-engagement systems support repeat revenue with low churn pressure.",
      },
    };

    const isWeak = domain.label === "critical" || domain.label === "exposed";
    const effectText = operationalEffects[domain.name][isWeak ? "weak" : "strong"];
    const effectLines = wrapText(doc, effectText, CONTENT_WIDTH - 5);
    effectLines.forEach((line) => {
      y = getYPosition(doc, y, 4);
      doc.text(line, MARGIN + 5, y);
      y += 4;
    });

    y += 3;
  });

  // Primary Focus Block
  y += 5;
  y = getYPosition(doc, y, 4);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(10);
  doc.text("Primary Weakness", MARGIN, y);
  y += 6;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9);
  doc.text(assessment.primaryWeakness, MARGIN + 5, y);
  y += 5;

  const primaryDomain = assessment.domains[assessment.primaryWeakness.toLowerCase() as keyof typeof assessment.domains];
  let primaryText = "";
  if (assessment.primaryWeakness === "None") {
    primaryText = "No primary weakness identified in this assessment.";
  } else {
    const isWeakLabel = primaryDomain.label === "critical" || primaryDomain.label === "exposed";
    primaryText = isWeakLabel
      ? "Containment restoration should begin here to prevent downstream instability."
      : "Primary focus is an optimisation lever rather than a containment failure.";
  }

  const primaryLines = wrapText(doc, primaryText, CONTENT_WIDTH - 5);
  primaryLines.forEach((line) => {
    y = getYPosition(doc, y, 4);
    doc.text(line, MARGIN + 5, y);
    y += 4;
  });

  // PAGE 8: SYSTEM PRESSURE TEST
  config = addPage(config);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("System Pressure Test", MARGIN, MARGIN + 10);

  y = MARGIN + 30;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(10);

  const pressureTest = generatePressureTest(assessment);

  doc.setFont(FONT_FAMILY, "bold");
  doc.text("Risk Level:", MARGIN, y);
  doc.setFont(FONT_FAMILY, "normal");
  doc.text(pressureTest.risk, MARGIN + 50, y);
  y += 8;

  doc.setFont(FONT_FAMILY, "bold");
  doc.text("Likely Breakdown Point:", MARGIN, y);
  doc.setFont(FONT_FAMILY, "normal");
  doc.text(pressureTest.breakdownPoint, MARGIN + 50, y);
  y += 12;

  doc.setFont(FONT_FAMILY, "bold");
  doc.text("Failure Sequence:", MARGIN, y);
  y += 6;
  doc.setFont(FONT_FAMILY, "normal");
  pressureTest.failureSequence.forEach((step, idx) => {
    y = getYPosition(doc, y, 5);
    doc.text(`${idx + 1}. ${step}`, MARGIN + 5, y);
    y += 5;
  });

  y += 5;
  doc.setFont(FONT_FAMILY, "bold");
  doc.text("Operational Impact:", MARGIN, y);
  y += 6;
  doc.setFont(FONT_FAMILY, "normal");
  const impactLines = wrapText(doc, pressureTest.operationalImpact, CONTENT_WIDTH - 5);
  impactLines.forEach((line) => {
    y = getYPosition(doc, y, 4);
    doc.text(line, MARGIN + 5, y);
    y += 4;
  });

  y += 5;
  doc.setFont(FONT_FAMILY, "bold");
  doc.text("Recovery Window:", MARGIN, y);
  doc.setFont(FONT_FAMILY, "normal");
  doc.text(pressureTest.recoveryWindow, MARGIN + 50, y);

  // PAGE 9: REVENUE LEAKAGE (with transparent calculations)
  config = addPage(config);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("Revenue Leakage", MARGIN, MARGIN + 10);

  y = MARGIN + 30;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(11);

  const leakageText = `Exposure represents the percentage of operational capacity that is constrained by uncontrolled or inconsistent processes. When applied to revenue, this translates to estimated constrained revenue—the portion of revenue that is at risk due to operational exposure.`;

  const leakageLines = wrapText(doc, leakageText, CONTENT_WIDTH);
  leakageLines.forEach((line) => {
    y = getYPosition(doc, y, 5);
    doc.text(line, MARGIN, y);
    y += 5;
  });

  y += 10;
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  doc.text(`Exposure: ${assessment.exposurePct}%`, MARGIN, y);

  if (clientInfo.monthlyRevenue) {
    const revenue = calculateRevenueLeakage(clientInfo.monthlyRevenue, assessment.exposurePct);
    const symbol = clientInfo.currency === "GBP" ? "£" : clientInfo.currency === "USD" ? "$" : "€";
    const gap = (1 - assessment.containmentPct / 100).toFixed(2);

    y += 10;
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(11);
    doc.text("Estimated Constrained Revenue", MARGIN, y);

    y += 8;
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(10);
    doc.text(`Monthly: ${symbol}${revenue.monthlyConstrained.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`, MARGIN + 5, y);

    y += 7;
    doc.text(`Annual: ${symbol}${revenue.annualConstrained.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`, MARGIN + 5, y);

    // Calculation formula
    y += 12;
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(10);
    doc.text("Calculation", MARGIN, y);

    y += 6;
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(9);
    const calcLine1 = `${symbol}${clientInfo.monthlyRevenue.toLocaleString("en-GB", { maximumFractionDigits: 0 })} × (1 − ${gap}) = ${symbol}${revenue.monthlyConstrained.toLocaleString("en-GB", { maximumFractionDigits: 0 })} per month`;
    const calcLine2 = `${symbol}${revenue.monthlyConstrained.toLocaleString("en-GB", { maximumFractionDigits: 0 })} × 12 = ${symbol}${revenue.annualConstrained.toLocaleString("en-GB", { maximumFractionDigits: 0 })} per year`;

    doc.text(calcLine1, MARGIN + 5, y);
    y += 6;
    doc.text(calcLine2, MARGIN + 5, y);

    y += 8;
    doc.setFont(FONT_FAMILY, "italic");
    doc.setFontSize(8);
    doc.text("Estimate based on containment gap. Directional indicator.", MARGIN + 5, y);

    // Impact Range Table
    y += 10;
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(10);
    doc.text("Impact Range", MARGIN, y);

    y += 8;
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(9);
    doc.text("Scenario", MARGIN, y);
    doc.text("Monthly", MARGIN + 70, y);
    doc.text("Annual", MARGIN + 120, y);

    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN, y + 2, MARGIN + CONTENT_WIDTH, y + 2);

    y += 8;
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(9);

    const conservative = revenue.monthlyConstrained * 0.5;
    const expected = revenue.monthlyConstrained;
    const aggressive = revenue.monthlyConstrained * 1.25;

    doc.text("Conservative", MARGIN, y);
    doc.text(`${symbol}${conservative.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`, MARGIN + 70, y);
    doc.text(`${symbol}${(conservative * 12).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`, MARGIN + 120, y);

    y += 7;
    doc.text("Expected", MARGIN, y);
    doc.text(`${symbol}${expected.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`, MARGIN + 70, y);
    doc.text(`${symbol}${(expected * 12).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`, MARGIN + 120, y);

    y += 7;
    doc.text("Aggressive", MARGIN, y);
    doc.text(`${symbol}${aggressive.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`, MARGIN + 70, y);
    doc.text(`${symbol}${(aggressive * 12).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`, MARGIN + 120, y);
  } else {
    y += 10;
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(10);
    doc.text("Revenue estimate unavailable (monthly revenue not supplied).", MARGIN + 5, y);
  }

  // PAGE 10: RECOVERY PROJECTION (optional, default OFF)
  config = addPage(config);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("Recovery Projection", MARGIN, MARGIN + 10);

  y = MARGIN + 30;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(11);

  const projectionText = `This page is disabled by default. To enable recovery projections, use the toggle in the application settings.

When enabled, this page shows a conservative uplift scenario (+30 points) and compares before/after containment and constrained revenue figures.`;

  const projectionLines = wrapText(doc, projectionText, CONTENT_WIDTH);
  projectionLines.forEach((line) => {
    y = getYPosition(doc, y, 5);
    doc.text(line, MARGIN, y);
    y += 5;
  });

  // PAGE 11: CONTAINMENT PRIORITY ORDER
  config = addPage(config);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("Containment Priority Order", MARGIN, MARGIN + 10);

  y = MARGIN + 30;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(11);

  const priorityOrder = generatePriorityOrder(assessment);
  priorityOrder.forEach((item) => {
    y = getYPosition(doc, y, 6);
    doc.text(`${item.rank}. ${item.domain} — ${item.label} (${item.percent}%)`, MARGIN, y);
    y += 6;
  });

  // PAGE 12: RECOMMENDED INTERVENTION
  config = addPage(config);
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text("Recommended Intervention", MARGIN, MARGIN + 10);

  y = MARGIN + 30;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(11);

  const recommendation = generateRecommendationText(assessment);
  const introLines = wrapText(doc, recommendation.intro, CONTENT_WIDTH);
  introLines.forEach((line) => {
    y = getYPosition(doc, y, 5);
    doc.text(line, MARGIN, y);
    y += 5;
  });

  y += 8;
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  doc.text("Priority Objectives:", MARGIN, y);

  y += 8;
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(10);
  recommendation.objectives.forEach((obj) => {
    y = getYPosition(doc, y, 5);
    doc.text(`• ${obj}`, MARGIN + 5, y);
    y += 5;
  });

  // Save PDF
  const filename = `HannsFree_OECT_Audit_${clientInfo.businessName.replace(/\s+/g, "_")}_${clientInfo.assessmentDate}.pdf`;
  doc.save(filename);
}
