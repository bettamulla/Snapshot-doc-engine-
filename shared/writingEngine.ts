import type { DomainLabel, DomainName, OECTAssessment } from "./types";

// Interpretation templates by label
const INTERPRETATION_BY_LABEL: Record<DomainLabel, string> = {
  critical: "Controls in this domain are failing or absent.",
  exposed: "Controls exist but are inconsistent and likely to degrade under load.",
  contained: "Controls are functional with minor instability.",
  optimised: "Controls are stable and resilient under normal operating conditions.",
};

// Operational Effect templates by domain and label group
const OPERATIONAL_EFFECT: Record<DomainName, Record<"weak" | "strong", string>> = {
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

export function getInterpretation(label: DomainLabel): string {
  return INTERPRETATION_BY_LABEL[label];
}

export function getOperationalEffect(domain: DomainName, label: DomainLabel): string {
  const isWeak = label === "critical" || label === "exposed";
  return OPERATIONAL_EFFECT[domain][isWeak ? "weak" : "strong"];
}

export function generateDiagnosticFinding(
  domain: DomainName,
  percent: number,
  label: DomainLabel
): string {
  const labelUpper = label.toUpperCase();
  const observation = `${domain} containment is ${labelUpper} (${percent}%).`;
  const interpretation = getInterpretation(label);
  const operationalEffect = getOperationalEffect(domain, label);

  return `**${domain}**\n\n**Observation:** ${observation}\n\n**Interpretation:** ${interpretation}\n\n**Operational Effect:** ${operationalEffect}`;
}

export function generatePrimaryFocusBlock(assessment: OECTAssessment): string {
  const { primaryWeakness, domains } = assessment;

  let block = `**Primary Weakness:** ${primaryWeakness}\n\n`;

  if (primaryWeakness === "None") {
    block += "No primary weakness identified in this assessment.";
  } else {
    const weaknessDomain = domains[primaryWeakness.toLowerCase() as keyof typeof domains];
    const isWeakLabel = weaknessDomain.label === "critical" || weaknessDomain.label === "exposed";

    if (isWeakLabel) {
      block += "Containment restoration should begin here to prevent downstream instability.";
    } else {
      block += "Primary focus is an optimisation lever rather than a containment failure.";
    }
  }

  return block;
}

export function generatePressureTest(assessment: OECTAssessment): {
  risk: "HIGH" | "LOW";
  breakdownPoint: DomainName | "None";
  failureSequence: string[];
  operationalImpact: string;
  recoveryWindow: string;
} {
  const { domains, primaryWeakness } = assessment;

  // Determine Risk
  const hasWeakDomain = Object.values(domains).some(
    (d) => d.label === "critical" || d.label === "exposed"
  );
  const risk = hasWeakDomain ? "HIGH" : "LOW";

  // Determine Breakdown Point
  let breakdownPoint: DomainName | "None" = primaryWeakness;
  if (primaryWeakness === "None") {
    // Find lowest percent domain
    let lowestDomain = domains.capture;
    Object.values(domains).forEach((d) => {
      if (d.percent < lowestDomain.percent) {
        lowestDomain = d;
      }
    });
    breakdownPoint = lowestDomain.name;
  }

  // Fixed Failure Sequence
  const failureSequence = [
    "Inbound demand increases.",
    "Primary weakness constraints amplify.",
    "Downstream throughput misaligns.",
    "Client-facing instability becomes visible.",
  ];

  // Operational Impact (derived from domains)
  const criticalDomains = Object.values(domains)
    .filter((d) => d.label === "critical")
    .map((d) => d.name);
  const exposedDomains = Object.values(domains)
    .filter((d) => d.label === "exposed")
    .map((d) => d.name);

  let operationalImpact = "";
  if (criticalDomains.length > 0) {
    operationalImpact += `Critical gaps in ${criticalDomains.join(", ")} create immediate operational risk.`;
  }
  if (exposedDomains.length > 0) {
    if (operationalImpact) operationalImpact += " ";
    operationalImpact += `Exposed controls in ${exposedDomains.join(", ")} will degrade under sustained load.`;
  }
  if (!operationalImpact) {
    operationalImpact = "Operational resilience is maintained under normal conditions.";
  }

  // Recovery Window
  const hasCritical = Object.values(domains).some((d) => d.label === "critical");
  const hasExposed = Object.values(domains).some((d) => d.label === "exposed");

  let recoveryWindow = "0–1 operational cycles";
  if (hasCritical) {
    recoveryWindow = "3–6 operational cycles";
  } else if (hasExposed) {
    recoveryWindow = "2–4 operational cycles";
  }

  return {
    risk,
    breakdownPoint,
    failureSequence,
    operationalImpact,
    recoveryWindow,
  };
}

export function generatePriorityOrder(assessment: OECTAssessment): Array<{ rank: number; domain: DomainName; label: string; percent: number }> {
  const { domains } = assessment;

  const sorted = Object.values(domains)
    .sort((a, b) => a.percent - b.percent)
    .map((d, idx) => ({
      rank: idx + 1,
      domain: d.name,
      label: d.label.toUpperCase(),
      percent: d.percent,
    }));

  return sorted;
}

export function generateRecommendationText(assessment: OECTAssessment): { intro: string; objectives: DomainName[] } {
  const priorityOrder = generatePriorityOrder(assessment);
  const topTwoWeakest = priorityOrder.slice(0, 2).map((p) => p.domain);

  const intro =
    "Recommended intervention: Operational Exposure Reset.\n\n" +
    "Objective: restore containment in the priority domains identified in this diagnostic, stabilise throughput under load, and reduce operational exposure.";

  return {
    intro,
    objectives: topTwoWeakest,
  };
}
