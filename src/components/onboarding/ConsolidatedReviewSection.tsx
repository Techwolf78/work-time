import React, { useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Edit2, FileText, Send } from "lucide-react";
import { OnboardingSectionConfig, CandidateUploadedDoc } from "../../types/hrms";

interface ConsolidatedReviewSectionProps {
  sections: OnboardingSectionConfig[];
  formData: Record<string, any>;
  uploadedDocs: CandidateUploadedDoc[];
  onNavigateToSection: (sectionId: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  isResubmission?: boolean;
}

export function ConsolidatedReviewSection({
  sections,
  formData,
  uploadedDocs,
  onNavigateToSection,
  onSubmit,
  isSubmitting = false,
  isResubmission = false,
}: ConsolidatedReviewSectionProps) {
  const [agreed, setAgreed] = useState(true);
  const [signature, setSignature] = useState(
    formData["digitalSignature"] || formData["digital_signature"] || formData["fullName"] || "Ramesh Anand Patil"
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleInitialSubmitClick = () => {
    if (!agreed) {
      setValidationError("You must confirm that all provided information is accurate and complete.");
      return;
    }
    if (!signature.trim()) {
      setValidationError("Please enter your full legal name as your digital signature.");
      return;
    }
    setValidationError("");
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    setShowConfirmModal(false);
    onSubmit();
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1">
          Review & Final Submission
        </h3>
        <p className="text-xs text-gray-600">
          Please review the details entered across all sections before submitting your onboarding dossier to Human Resources.
        </p>
      </div>

      {/* Render summary for each enabled section */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isDocSection = section.documents && section.documents.length > 0;
          const isRepeating = section.isRepeating;
          const sectionData =
            formData[section.id] ||
            formData[section.id.replace("-", "_")] ||
            formData[section.id.replace("sec-", "")] ||
            formData[section.id.replace("sec_", "")];

          return (
            <div
              key={section.id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    {section.title}
                  </h4>
                  {section.description && (
                    <p className="text-[11px] text-gray-500 mt-0.5">{section.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToSection(section.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 hover:text-gray-950 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Repeating section view */}
              {isRepeating ? (
                Array.isArray(sectionData) && sectionData.length > 0 ? (
                  <div className="space-y-3">
                    {sectionData.map((item: Record<string, any>, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50/70 border border-gray-100 rounded-lg text-xs"
                      >
                        <span className="font-semibold text-gray-700 block mb-2">
                          {section.repeatingConfig?.itemLabel || "Entry"} #{idx + 1}
                        </span>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {section.fields.map((f) => (
                            <div key={f.id}>
                              <span className="text-[11px] text-gray-500 block">{f.label}</span>
                              <span className="font-medium text-gray-900">
                                {item[f.name] !== undefined && item[f.name] !== ""
                                  ? String(item[f.name])
                                  : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No entries added.</p>
                )
              ) : isDocSection ? (
                /* Documents summary */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {section.documents?.map((req) => {
                    const doc = uploadedDocs.find((d) => d.requirementId === req.id);
                    return (
                      <div
                        key={req.id}
                        className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{req.name}</p>
                            <p className="text-[10px] text-gray-400">
                              {doc ? `${doc.name} (${doc.size})` : req.required ? "Missing (Required)" : "Not provided (Optional)"}
                            </p>
                          </div>
                        </div>
                        {doc ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : req.required ? (
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        ) : (
                          <span className="text-[10px] text-gray-400">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Standard key-value fields */
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {section.fields.map((f) => {
                    const rawVal = formData[f.name];
                    const displayVal =
                      Array.isArray(rawVal)
                        ? rawVal.join(", ")
                        : typeof rawVal === "boolean"
                        ? rawVal
                          ? "Yes"
                          : "No"
                        : rawVal !== undefined && rawVal !== ""
                        ? String(rawVal)
                        : "—";

                    return (
                      <div key={f.id} className="text-xs">
                        <span className="text-[11px] text-gray-500 block">{f.label}</span>
                        <span className="font-medium text-gray-900 break-words">{displayVal}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Candidate Declaration & Digital Signature */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide pb-2 border-b border-gray-100">
          Declaration & Acknowledgement
        </h4>

        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 leading-relaxed space-y-2">
          <p>
            1. I hereby declare that all the statements made by me in this onboarding application are true, complete, and correct to the best of my knowledge and belief.
          </p>
          <p>
            2. I acknowledge that any false, misleading, or suppressed information may result in the immediate withdrawal of my offer of employment or termination of service.
          </p>
          <p>
            3. I authorize the company to verify all credentials, background records, and previous employment records submitted herein.
          </p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) setValidationError("");
            }}
            className="w-4 h-4 rounded text-gray-950 focus:ring-gray-950 mt-0.5"
          />
          <span className="text-xs font-medium text-gray-800">
            I confirm that I have reviewed all details above and agree to the declarations stated herein.
          </span>
        </label>

        <div className="pt-2 max-w-md space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            Digital Signature (Full Legal Name) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={signature}
            onChange={(e) => {
              setSignature(e.target.value);
              if (e.target.value.trim()) setValidationError("");
            }}
            placeholder="Type your full legal name"
            className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-950"
          />
          <p className="text-[11px] text-gray-400">
            By typing your name, you acknowledge this as your legally binding digital signature.
          </p>
        </div>

        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleInitialSubmitClick}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-950 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{isResubmission ? "Resubmit Dossier to HR" : "Submit Onboarding Dossier"}</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
              <h3 className="text-sm font-semibold text-gray-900">
                {isResubmission ? "Confirm Resubmission" : "Confirm Final Submission"}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Once submitted, your onboarding information and attached documents will be locked and sent directly to the HR Operations team for document verification and profile approval.
              </p>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">
                <span className="font-semibold block text-gray-900 mb-0.5">Signed by:</span>
                <span>{signature} • {new Date().toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Go Back & Review
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  className="px-5 py-2 bg-gray-950 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Yes, Submit Now
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
