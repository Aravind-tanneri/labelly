import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type {
  Inspection,
  InspectionListItem,
} from "@labelly/shared";
import { formatDateTime } from "@labelly/shared";
import {
  ComplianceBadge,
  LifecycleBadge,
  SeverityBadge,
} from "../Common/Badge";
import { Icon } from "../Common/Icon";
import {
  downloadInspectionReport,
  fetchInspection,
  resolveApiUrl,
  toErrorMessage,
  updateInspection,
} from "../../services/api";
import { labelForField } from "../../utils";

interface InspectionDetailModalProps {
  inspectionSummary: InspectionListItem | null;
  onClose: () => void;
  onInspectionUpdated?: (updated: Inspection) => void;
}

const MANDATORY_FIELDS: Array<{ key: string; label: string; rule: string; placeholder: string }> = [
  { key: "manufacturer", label: "Manufacturer Details", rule: "Rule 6(1)(a)", placeholder: "e.g. M/s ABC Foods Ltd, Mumbai, Maharashtra - 400001" },
  { key: "packer", label: "Packer Details", rule: "Rule 6(1)(a)", placeholder: "e.g. Packed by XYZ Packaging, Pune - 411001" },
  { key: "importer", label: "Importer / Country of Origin", rule: "Rule 6(1)(a) & 6(10)", placeholder: "e.g. Imported by Global Trade. Country of Origin: Vietnam" },
  { key: "netQuantity", label: "Net Quantity", rule: "Rule 6(1)(b) & Rule 11", placeholder: "e.g. 500 g, 1 kg, 750 ml, 1 L, 10 N" },
  { key: "mrp", label: "Maximum Retail Price (MRP)", rule: "Rule 6(1)(c)", placeholder: "e.g. Rs. 149.00 (incl. of all taxes) / ₹149" },
  { key: "manufacturingDate", label: "Month & Year of Mfg / Packing", rule: "Rule 6(1)(d)", placeholder: "e.g. 06/2026 or June 2026" },
  { key: "consumerCare", label: "Consumer Care Grievance Details", rule: "Rule 6(1)(n)", placeholder: "e.g. Consumer Care Cell: care@abcfoods.com, 1800-11-2233" },
  { key: "batchNumber", label: "Batch / Lot Identification", rule: "Rule 6(1)(g)", placeholder: "e.g. BATCH-2026-X89" },
];

export function InspectionDetailModal({
  inspectionSummary,
  onClose,
  onInspectionUpdated,
}: InspectionDetailModalProps) {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Popup Modal for Editing Declarations
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [popupEdits, setPopupEdits] = useState<Record<string, string>>({});
  const [supervisorRemarks, setSupervisorRemarks] = useState("");

  const resolveImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://localhost:5000") || url.startsWith("http://127.0.0.1:5000")) {
      return url.replace(/http:\/\/(localhost|127\.0\.0\.1):5000/, resolveApiUrl().replace(/\/$/, ""));
    }
    if (url.startsWith("http")) return url;
    return `${resolveApiUrl().replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  };

  useEffect(() => {
    if (!inspectionSummary) return;

    let isMounted = true;
    setLoading(true);
    setShowEditPopup(false);

    fetchInspection(inspectionSummary._id)
      .then((data) => {
        if (isMounted) {
          setInspection(data);
          setSupervisorRemarks(data.remarks || "");
          if (data.images && data.images.length > 0) {
            const rawUrl = data.images[0].originalUrl || data.images[0].thumbnailUrl;
            setSelectedImage(resolveImageUrl(rawUrl));
          }
          // Seed editable declarations for popup
          const initialEdits: Record<string, string> = {};
          if (data.extractedData) {
            for (const [k, v] of Object.entries(data.extractedData)) {
              if (v != null) initialEdits[k] = String(v);
            }
          }
          setPopupEdits(initialEdits);
        }
      })
      .catch((err) => {
        if (isMounted) {
          toast.error(toErrorMessage(err, "Failed to load full inspection details."));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [inspectionSummary]);

  // Close on Esc key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showEditPopup) {
          setShowEditPopup(false);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showEditPopup]);

  if (!inspectionSummary) return null;

  const handleDownloadReport = async () => {
    if (!inspectionSummary) return;
    setDownloading(true);
    try {
      await downloadInspectionReport(
        inspectionSummary._id,
        `${inspectionSummary.inspectionId || "inspection"}-report.pdf`
      );
      toast.success("Inspection certificate PDF downloaded successfully.");
    } catch (err) {
      toast.error(toErrorMessage(err, "Failed to download PDF report."));
    } finally {
      setDownloading(false);
    }
  };

  // Supervisor Action Handlers
  const handleUpdateStatus = async (
    newStatus: "APPROVED" | "ACTION_REQUIRED" | "REINSPECTION_REQUESTED",
    remarksPrefix?: string
  ) => {
    if (!inspection) return;
    setActionLoading(true);
    try {
      const finalRemarks = remarksPrefix
        ? `${remarksPrefix} ${supervisorRemarks}`.trim()
        : supervisorRemarks;

      const res = await updateInspection(inspection._id, {
        status: newStatus,
        remarks: finalRemarks,
      });

      setInspection(res.inspection);
      toast.success(`Inspection status updated to ${newStatus}.`);
      if (onInspectionUpdated) onInspectionUpdated(res.inspection);
    } catch (err) {
      toast.error(toErrorMessage(err, "Failed to update inspection status."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditPopup = () => {
    if (!inspection) return;
    const initialEdits: Record<string, string> = {};
    if (inspection.extractedData) {
      for (const [k, v] of Object.entries(inspection.extractedData)) {
        if (v != null) initialEdits[k] = String(v);
      }
    }
    setPopupEdits(initialEdits);
    setShowEditPopup(true);
  };

  const handleSavePopupDeclarations = async () => {
    if (!inspection) return;
    setActionLoading(true);
    try {
      const res = await updateInspection(inspection._id, {
        extractedData: popupEdits,
        remarks: supervisorRemarks,
      });
      setInspection(res.inspection);
      setShowEditPopup(false);
      toast.success("Declarations updated and compliance rules re-evaluated!");
      if (onInspectionUpdated) onInspectionUpdated(res.inspection);
    } catch (err) {
      toast.error(toErrorMessage(err, "Failed to save declarations."));
    } finally {
      setActionLoading(false);
    }
  };

  const violations = inspection?.compliance?.violations ?? [];
  const reviewItems = inspection?.compliance?.reviewRequired ?? [];
  const passedRules = inspection?.compliance?.passedRules ?? [];

  // Statutory Penalty Calculation under Section 36 of Legal Metrology Act, 2009
  const hasViolations = violations.length > 0;
  const penalty1st = hasViolations ? "₹25,000" : "Nil";
  const penalty2nd = hasViolations ? "₹50,000" : "Nil";
  const penaltySubsequent = hasViolations ? "Up to ₹1,00,000 or Imprisonment" : "Nil";

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-white">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono font-bold text-xs text-slate-800">
                  {inspection?.inspectionId || inspectionSummary.inspectionId}
                </span>
                <ComplianceBadge
                  status={inspection?.compliance?.status || inspectionSummary.complianceStatus}
                />
                <LifecycleBadge
                  status={inspection?.status || inspectionSummary.status}
                />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {inspection?.product?.name ||
                  inspectionSummary.product?.name ||
                  "Inspection Details"}
              </h2>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                <span>
                  <strong>Inspector:</strong>{" "}
                  {inspectionSummary.inspectorName || "—"}
                </span>
                <span>•</span>
                <span>
                  <strong>Date:</strong>{" "}
                  {formatDateTime(inspection?.createdAt || inspectionSummary.createdAt)}
                </span>
                {inspection?.product?.brand && (
                  <>
                    <span>•</span>
                    <span>
                      <strong>Brand:</strong> {inspection.product.brand}
                    </span>
                  </>
                )}
                {inspection?.product?.category && (
                  <>
                    <span>•</span>
                    <span>
                      <strong>Category:</strong> {inspection.product.category}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <Icon name="cross" size={18} />
              </button>
            </div>
          </header>

          {/* ── Supervisor Workflow Actions Bar ── */}
          <div className="bg-slate-50 px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase">
                Supervisor Actions
              </span>
              <span className="text-xs text-slate-600">
                Issue statutory orders, clearances, or re-check compliance rules.
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                disabled={actionLoading || inspection?.status === "APPROVED"}
                onClick={() => handleUpdateStatus("APPROVED", "[Approved by Supervisor]")}
              >
                <Icon name="check" size={14} />
                Approve & Clear
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                disabled={actionLoading || inspection?.status === "ACTION_REQUIRED"}
                onClick={() => handleUpdateStatus("ACTION_REQUIRED", "[Notice Issued under Sec 36 LM Act]")}
              >
                <Icon name="alert" size={14} />
                Issue Notice (Sec 36)
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                disabled={actionLoading || inspection?.status === "REINSPECTION_REQUESTED"}
                onClick={() => handleUpdateStatus("REINSPECTION_REQUESTED", "[Re-inspection Requested]")}
              >
                <Icon name="question" size={14} />
                Request Re-Inspection
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                onClick={handleOpenEditPopup}
              >
                <Icon name="file" size={14} />
                Edit Declarations
              </button>
            </div>
          </div>

          {/* ── Official Decision Banner ── */}
          {inspection?.status === "APPROVED" && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                    <span>OFFICIALLY APPROVED & CLEARED</span>
                    <span className="bg-emerald-200 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                      Statutory Clearance
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    This packaged commodity has been approved by the supervisory officer. All legal metrology declarations meet regulatory requirements.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-md border border-emerald-300">
                  <Icon name="check" size={12} />
                  Status: APPROVED
                </span>
              </div>
            </div>
          )}

          {inspection?.status === "ACTION_REQUIRED" && (
            <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                  !
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-2">
                    <span>STATUTORY NOTICE ISSUED UNDER SECTION 36</span>
                    <span className="bg-rose-200 text-rose-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                      Action Required
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Deficiencies noted. Statutory show-cause / compounding notice issued to manufacturer/packer under Legal Metrology Act, 2009.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-800 bg-rose-100/90 px-2.5 py-1 rounded-md border border-rose-300">
                  <Icon name="alert" size={12} />
                  Status: NOTICE ISSUED
                </span>
              </div>
            </div>
          )}

          {inspection?.status === "REINSPECTION_REQUESTED" && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                  ?
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-2">
                    <span>RE-INSPECTION ORDERED BY SUPERVISOR</span>
                    <span className="bg-amber-200 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                      Pending Re-Verification
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Field officer has been directed to revisit sample or re-capture packaging labels for verification.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-md border border-amber-300">
                  <Icon name="question" size={12} />
                  Status: RE-INSPECT
                </span>
              </div>
            </div>
          )}

          <div className="p-6 overflow-y-auto flex-1">
            {loading && !inspection ? (
              <div className="flex flex-col gap-3">
                <div className="h-8 w-full rounded-md animate-shimmer" />
                <div className="h-28 w-full rounded-md animate-shimmer" />
                <div className="h-40 w-full rounded-md animate-shimmer" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
                {/* Left Column: Violations, Declarations & Legal Penalty */}
                <div>
                  {/* Statutory Penalty Matrix Card */}
                  {hasViolations && (
                    <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 mb-5">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5">
                          <Icon name="alert" size={16} />
                          <strong className="text-rose-900 text-xs">
                            Statutory Penalty Estimation (Section 36 Legal Metrology Act, 2009)
                          </strong>
                        </div>
                        <span className="text-[10px] text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded font-bold uppercase">
                          Compounding Matrix
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5 mt-2">
                        <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wide">First Offense</div>
                          <div className="text-sm font-bold text-rose-800">{penalty1st}</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Second Offense</div>
                          <div className="text-sm font-bold text-rose-800">{penalty2nd}</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Subsequent Offense</div>
                          <div className="text-xs font-bold text-rose-800">{penaltySubsequent}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Violations section */}
                  {violations.length > 0 ? (
                    <section className="mb-6">
                      <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2 mb-3">
                        <Icon name="alert" size={16} />
                        Regulatory Rule Violations ({violations.length})
                      </h3>
                      <div className="flex flex-col gap-2.5">
                        {violations.map((v, i) => (
                          <div key={i} className="bg-rose-50/60 border border-rose-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <SeverityBadge severity={v.severity} />
                              <span className="font-mono text-xs font-bold text-rose-700">{v.ruleId}</span>
                              <span className="text-xs text-slate-500">
                                {labelForField(v.field)}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-800">{v.message}</p>
                            {(v.expectedValue || v.actualValue) && (
                              <div className="mt-2 flex flex-col gap-1 text-[11px] bg-white/80 p-2 rounded border border-rose-100">
                                {v.expectedValue && (
                                  <div className="flex gap-2">
                                    <span className="font-semibold text-slate-500 w-24">Required by Law:</span>
                                    <span className="text-slate-800">{v.expectedValue}</span>
                                  </div>
                                )}
                                {v.actualValue && (
                                  <div className="flex gap-2">
                                    <span className="font-semibold text-slate-500 w-24">Detected:</span>
                                    <span className="text-rose-700 font-semibold">
                                      {v.actualValue}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium mb-5">
                      <Icon name="check" size={20} />
                      <span>No statutory violations recorded for this package. All mandatory rules conform to PC Rules 2011.</span>
                    </div>
                  )}

                  {/* Review items */}
                  {reviewItems.length > 0 && (
                    <section className="mb-6">
                      <h3 className="text-sm font-bold text-amber-700 flex items-center gap-2 mb-3">
                        <Icon name="question" size={16} />
                        Requires Supervisor / Inspector Review ({reviewItems.length})
                      </h3>
                      <div className="flex flex-col gap-2">
                        {reviewItems.map((r, i) => (
                          <div key={i} className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-slate-700">
                            <SeverityBadge severity={r.severity} />
                            <div>
                              <div className="font-semibold text-slate-800">{labelForField(r.field)}</div>
                              <p className="text-slate-600 mt-0.5">{r.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Extracted Declarations Table */}
                  <section className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Icon name="file" size={16} />
                        Mandatory Declarations Verification (Rule 6 LM-PC Rules)
                      </h3>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                        onClick={handleOpenEditPopup}
                      >
                        <Icon name="file" size={13} />
                        Edit / Override
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {MANDATORY_FIELDS.map(({ key, label, rule }) => {
                        const rawVal = inspection?.extractedData?.[key as keyof typeof inspection.extractedData];
                        const valStr = rawVal ? String(rawVal).trim() : "";
                        const confidence = inspection?.extractionConfidence?.[key] ?? null;
                        const hasValue = Boolean(valStr);

                        return (
                          <div key={key} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1">
                              <div>
                                <span className="text-xs font-semibold text-slate-700">{label}</span>
                                <div className="text-[10px] text-slate-400">{rule}</div>
                              </div>
                              {confidence !== null && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                    confidence >= 80
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : confidence >= 50
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                  title={`Confidence: ${Math.round(confidence)}%`}
                                >
                                  {Math.round(confidence)}%
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-xs font-semibold break-words mt-1 ${
                                !hasValue ? "text-rose-600 italic font-normal" : "text-slate-800"
                              }`}
                            >
                              {hasValue ? valStr : "NOT DETECTED / MISSING"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Passed Statutory Rules Matrix */}
                  {passedRules.length > 0 && (
                    <section className="mb-6">
                      <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-2">
                        <Icon name="check" size={16} />
                        Verified Statutory Checks ({passedRules.length} Rules Passed)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                        {passedRules.map((p, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <div>
                              <span className="font-semibold text-slate-800">{p.ruleId}: </span>
                              <span className="text-slate-600">{p.message || labelForField(p.field)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Right Column: Evidence, Inspector Remarks & Supervisor Directives */}
                <div>
                  <section className="mb-6">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                      <Icon name="image" size={16} />
                      Packaging Label Evidence
                    </h3>
                    {inspection?.images && inspection.images.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        <div className="w-full h-56 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                          {selectedImage ? (
                            <img
                              src={selectedImage}
                              alt="Selected packaging evidence"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f1f3f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23868e96'%3ENo Image%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div className="text-xs text-slate-400">No photo</div>
                          )}
                        </div>
                        {inspection.images.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {inspection.images.map((img, i) => {
                              const url = resolveImageUrl(img.thumbnailUrl || img.originalUrl);
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  className={`w-14 h-14 rounded-md border-2 p-0 bg-white cursor-pointer overflow-hidden shrink-0 transition-all ${
                                    selectedImage === url ? "border-[#5e6ad2] ring-2 ring-[#5e6ad2]/20" : "border-slate-200 hover:border-slate-300"
                                  }`}
                                  onClick={() => setSelectedImage(url)}
                                >
                                  <img
                                    src={url}
                                    alt={`Evidence thumbnail ${i + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-500 gap-1.5 text-xs text-center">
                        <Icon name="image" size={24} />
                        <p>Physical sample inspected on-site (Manual checklist record).</p>
                      </div>
                    )}
                  </section>

                  {/* Supervisor Remarks & Official Directives Box */}
                  <section className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Icon name="info" size={16} />
                        Supervisor Directives & Field Notes
                      </h3>
                    </div>
                    <textarea
                      className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#5e6ad2] focus:ring-3 focus:ring-indigo-100 transition-all resize-y"
                      rows={3}
                      placeholder="Enter supervisory instructions, trader hearing notes, or compounding directives..."
                      value={supervisorRemarks}
                      onChange={(e) => setSupervisorRemarks(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer transition-colors"
                        onClick={handleSavePopupDeclarations}
                        disabled={actionLoading}
                      >
                        Save Notes
                      </button>
                    </div>
                  </section>

                  {/* Inspector Edits Audit Trail */}
                  {inspection?.inspectorEdits && inspection.inspectorEdits.length > 0 && (
                    <section className="mb-6">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <Icon name="shield" size={16} />
                        Inspector Edits Audit Trail ({inspection.inspectorEdits.length})
                      </h3>
                      <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {inspection.inspectorEdits.map((e, idx) => (
                          <div key={idx} className={`mb-2 pb-2 ${idx < inspection.inspectorEdits!.length - 1 ? "border-b border-dashed border-slate-200" : ""}`}>
                            <strong className="text-slate-700">{labelForField(e.field)}:</strong>
                            <div className="text-rose-600">Before: "{e.before || "none"}"</div>
                            <div className="text-emerald-700">After: "{e.after}"</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>

          <footer className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#5e6ad2] hover:bg-[#4d58bf] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleDownloadReport}
              disabled={downloading}
            >
              <Icon name="download" size={15} />
              {downloading ? "Downloading Report..." : "Download Certified PDF Report"}
            </button>
          </footer>
        </div>
      </div>

      {/* ── Separate Popup Modal for Editing Declarations ── */}
      {showEditPopup && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4"
          onClick={() => setShowEditPopup(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-white">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Edit & Override Package Declarations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modifying values will record an audit trail edit and re-evaluate compliance rules in real time.
                </p>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setShowEditPopup(false)}
                aria-label="Close dialog"
              >
                <Icon name="cross" size={18} />
              </button>
            </header>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MANDATORY_FIELDS.map(({ key, label, rule, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-800">
                      {label} <span className="text-[10px] text-slate-500 font-normal">({rule})</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-md outline-none focus:border-[#5e6ad2] focus:ring-2 focus:ring-indigo-100 transition-all"
                      placeholder={placeholder}
                      value={popupEdits[key] || ""}
                      onChange={(e) =>
                        setPopupEdits({ ...popupEdits, [key]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <footer className="border-t border-slate-200 px-5 py-3.5 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                onClick={() => setShowEditPopup(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#5e6ad2] hover:bg-[#4d58bf] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                onClick={handleSavePopupDeclarations}
                disabled={actionLoading}
              >
                <Icon name="check" size={14} />
                {actionLoading ? "Re-evaluating Rules..." : "Save & Re-evaluate Compliance"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
