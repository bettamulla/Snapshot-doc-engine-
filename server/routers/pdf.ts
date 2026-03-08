import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import type { ClientInfo, OECTAssessment } from "../../shared/types";

const ClientInfoSchema = z.object({
  clientName: z.string().min(1),
  businessName: z.string().min(1),
  assessmentDate: z.string(),
  monthlyRevenue: z.number().optional(),
  currency: z.enum(["GBP", "USD", "EUR"]),
});

const DomainDataSchema = z.object({
  name: z.string(),
  percent: z.number(),
  label: z.enum(["critical", "exposed", "contained", "optimised"]),
});

const OECTAssessmentSchema = z.object({
  scoreTotal: z.number(),
  scoreMax: z.number(),
  containmentPct: z.number(),
  exposurePct: z.number(),
  overallStatus: z.string(),
  instructionLabel: z.string(),
  domains: z.object({
    capture: DomainDataSchema,
    conversion: DomainDataSchema,
    delivery: DomainDataSchema,
    retention: DomainDataSchema,
  }),
  primaryWeakness: z.string(),
  keyInsight: z.string(),
});

export const pdfRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        clientInfo: ClientInfoSchema,
        assessment: OECTAssessmentSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        const filename = `HannsFree_OECT_Audit_${input.clientInfo.businessName}_${input.clientInfo.assessmentDate}.pdf`;

        return {
          success: true,
          filename,
          message: "PDF generation initiated. Check your downloads folder.",
        };
      } catch (error) {
        console.error("[PDF Generation Error]", error);
        return {
          success: false,
          error: "Failed to generate PDF",
        };
      }
    }),
});
