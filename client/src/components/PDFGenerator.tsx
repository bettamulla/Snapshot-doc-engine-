import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { OECTAssessment, ClientInfo } from "../../../shared/types";
import { generateAuditPDF } from "@/lib/pdfGenerator";

interface PDFGeneratorProps {
  clientInfo: ClientInfo;
  assessment: OECTAssessment;
  isLoading: boolean;
  onGenerating: (loading: boolean) => void;
}

export default function PDFGenerator({
  clientInfo,
  assessment,
  isLoading,
  onGenerating,
}: PDFGeneratorProps) {
  const handleGeneratePDF = async () => {
    onGenerating(true);
    try {
      await generateAuditPDF(clientInfo, assessment);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      onGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGeneratePDF}
      disabled={isLoading}
      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg transition-colors"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        "Generate Audit PDF"
      )}
    </Button>
  );
}
