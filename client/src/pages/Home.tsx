import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { parseOECTOutput, calculateRevenueLeakage } from "../../../shared/parser";
import { generateDiagnosticFinding, generatePrimaryFocusBlock, generatePressureTest, generatePriorityOrder, generateRecommendationText } from "../../../shared/writingEngine";
import type { OECTAssessment, ClientInfo } from "../../../shared/types";
import PDFGenerator from "@/components/PDFGenerator";

export default function Home() {
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientName: "",
    businessName: "",
    assessmentDate: new Date().toISOString().split("T")[0],
    monthlyRevenue: undefined,
    currency: "GBP",
  });

  const [oectText, setOectText] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<OECTAssessment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClientInfoChange = (field: keyof ClientInfo, value: string | number | undefined) => {
    setClientInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOectPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setOectText(text);

    if (text.trim()) {
      const result = parseOECTOutput(text);
      if (result.success && result.data) {
        setAssessment(result.data);
        setParseErrors([]);
      } else {
        setAssessment(null);
        setParseErrors(result.errors || ["Unknown parsing error"]);
      }
    } else {
      setAssessment(null);
      setParseErrors([]);
    }
  };

  const isFormValid = clientInfo.clientName && clientInfo.businessName && clientInfo.assessmentDate && assessment;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Snapshot Doc Engine</h1>
          <p className="text-slate-600">Generate premium audit PDFs from OECT assessments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info Card */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Client Information</CardTitle>
                <CardDescription>Required details for the audit report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="text-sm font-medium">
                      Client Name *
                    </Label>
                    <Input
                      id="clientName"
                      placeholder="John Smith"
                      value={clientInfo.clientName}
                      onChange={(e) => handleClientInfoChange("clientName", e.target.value)}
                      className="border-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-medium">
                      Business Name *
                    </Label>
                    <Input
                      id="businessName"
                      placeholder="Acme Corporation"
                      value={clientInfo.businessName}
                      onChange={(e) => handleClientInfoChange("businessName", e.target.value)}
                      className="border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assessmentDate" className="text-sm font-medium">
                      Assessment Date *
                    </Label>
                    <Input
                      id="assessmentDate"
                      type="date"
                      value={clientInfo.assessmentDate}
                      onChange={(e) => handleClientInfoChange("assessmentDate", e.target.value)}
                      className="border-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRevenue" className="text-sm font-medium">
                      Monthly Revenue (Optional)
                    </Label>
                    <Input
                      id="monthlyRevenue"
                      type="number"
                      placeholder="50000"
                      value={clientInfo.monthlyRevenue || ""}
                      onChange={(e) =>
                        handleClientInfoChange("monthlyRevenue", e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      className="border-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium">
                    Currency
                  </Label>
                  <select
                    id="currency"
                    value={clientInfo.currency}
                    onChange={(e) => handleClientInfoChange("currency", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* OECT Output Card */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">OECT Output</CardTitle>
                <CardDescription>Paste the OECT assessment output here</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste OECT output here..."
                  value={oectText}
                  onChange={handleOectPaste}
                  className="min-h-48 border-slate-300 font-mono text-sm"
                />

                {/* Validation Status */}
                {oectText && (
                  <div>
                    {parseErrors.length > 0 ? (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 text-sm">
                          <strong>Invalid OECT block:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            {parseErrors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    ) : assessment ? (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 text-sm">
                          ✓ OECT output parsed successfully
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview */}
          <div>
            <Card className="border-slate-200 sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assessment ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Score</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {assessment.scoreTotal}/150
                        </p>
                        <p className="text-sm text-slate-600">{assessment.containmentPct}% Containment</p>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold mb-2">Status</p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              assessment.overallStatus === "Critical Exposure"
                                ? "bg-red-500"
                                : assessment.overallStatus === "Elevated Exposure"
                                  ? "bg-amber-500"
                                  : assessment.overallStatus === "Contained"
                                    ? "bg-blue-500"
                                    : "bg-green-500"
                            }`}
                          />
                          <span className="text-sm font-medium text-slate-900">
                            {assessment.overallStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{assessment.instructionLabel}</p>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold mb-2">Domains</p>
                        <div className="space-y-2">
                          {Object.values(assessment.domains).map((domain) => (
                            <div key={domain.name} className="flex justify-between items-center">
                              <span className="text-sm text-slate-700">{domain.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">{domain.percent}%</span>
                                <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-700 font-mono">
                                  {domain.label.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Primary Weakness</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">{assessment.primaryWeakness}</p>
                      </div>

                      {clientInfo.monthlyRevenue && (
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold mb-2">Revenue Impact</p>
                          {(() => {
                            const revenue = calculateRevenueLeakage(clientInfo.monthlyRevenue, assessment.exposurePct);
                            const symbol = clientInfo.currency === "GBP" ? "£" : clientInfo.currency === "USD" ? "$" : "€";
                            return (
                              <div className="space-y-1 text-sm">
                                <p className="text-slate-700">
                                  Monthly: <span className="font-semibold">{symbol}{revenue.monthlyConstrained.toLocaleString("en-GB", { maximumFractionDigits: 0 })}</span>
                                </p>
                                <p className="text-slate-700">
                                  Annual: <span className="font-semibold">{symbol}{revenue.annualConstrained.toLocaleString("en-GB", { maximumFractionDigits: 0 })}</span>
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <PDFGenerator
                      clientInfo={clientInfo}
                      assessment={assessment}
                      isLoading={isGenerating}
                      onGenerating={setIsGenerating}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600">
                      {oectText ? "Fix validation errors to enable PDF generation" : "Paste OECT output to preview"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
