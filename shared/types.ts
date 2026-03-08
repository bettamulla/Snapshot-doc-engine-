// OECT Assessment Types
export type OverallStatus = "Critical Exposure" | "Elevated Exposure" | "Contained" | "Optimised";
export type DomainLabel = "critical" | "exposed" | "contained" | "optimised";
export type DomainName = "Capture" | "Conversion" | "Delivery" | "Retention";
export type InstructionLabel = "Containment Required" | "Monitoring" | "Stable" | "Maintained";

export interface DomainData {
  name: DomainName;
  percent: number;
  label: DomainLabel;
}

export interface OECTAssessment {
  scoreTotal: number;
  containmentPct: number;
  exposurePct: number;
  overallStatus: OverallStatus;
  instructionLabel: InstructionLabel;
  domains: {
    capture: DomainData;
    conversion: DomainData;
    delivery: DomainData;
    retention: DomainData;
  };
  primaryWeakness: DomainName | "None";
  keyInsight: string;
}

export interface ClientInfo {
  clientName: string;
  businessName: string;
  assessmentDate: string;
  monthlyRevenue?: number;
  currency: string;
}

export interface ParseResult {
  success: boolean;
  data?: OECTAssessment;
  errors?: string[];
}

export interface RevenueCalculation {
  monthlyConstrained: number;
  annualConstrained: number;
}
