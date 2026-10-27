import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Eye,
  User,
  Building2,
  Calendar,
  Send,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Employee, CandidateDossier, CandidateUploadedDoc } from "../../types/hrms";
import { useHrms } from "../../lib/hrmsContext";
import { useToast } from "../../lib/toastContext";

interface DossierReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export function DossierReviewDrawer({
  isOpen,
  onClose,
  employee,
}: DossierReviewDrawerProps) {
  const { getCandidateDossier, reviewOnboardingDossier, onboardingConfig } = useHrms();
  const { success, error, info } = useToast();

  const [notes, setNotes] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [modalAction, setModalAction] = useState<"REQUEST_CHANGES" | "REJECT" | null>(null);
  const [previewDoc, setPreviewDoc] = useState<CandidateUploadedDoc | null>(null);

  if (!isOpen || !employee) return null;

  const dossier: CandidateDossier | undefined = getCandidateDossier(employee.id);
  const formData = dossier?.formData || {};
  const uploadedDocs = dossier?.uploadedDocuments || [];
  const status = dossier?.status || (employee.onboardingCompleted ? "APPROVED" : "NOT_STARTED");

  const handleApprove = () => {
    if (confirm(`Approve onboarding for ${employee.firstName} ${employee.lastName}? This will activate their employee profile.`)) {
      reviewOnboardingDossier(employee.id, "APPROVE");
      onClose();
    }
  };

  const openActionModal = (action: "REQUEST_CHANGES" | "REJECT") => {
    setModalAction(action);
    setNotes(action === "REQUEST_CHANGES" ? "Please verify and re-upload the highlighted documents." : "");
    setShowNotesModal(true);
  };

  const handleConfirmActionWithNotes = () => {
    if (!modalAction) return;
    if (!notes.trim()) {
      error("Please enter specific feedback notes for the candidate.");
      return;
    }
    reviewOnboardingDossier(employee.id, modalAction, notes);
    setShowNotesModal(false);
    setModalAction(null);
    onClose();
  };

  const getStatusBadge = () => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Revisions Requested
          </span>
        );
      case "SUBMITTED":
      case "RESUBMITTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            In Progress
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-start justify-between bg-gray-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-950">
                {employee.firstName} {employee.lastName}
              </h2>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Employee ID: <span className="font-mono font-medium text-gray-700">{employee.id}</span> • {employee.email}
            </p>
            {dossier?.submittedAt && (
              <p className="text-[11px] text-gray-400 mt-1">
                Submitted on {new Date(dossier.submittedAt).toLocaleString()} (Config v{dossier.configVersion || 1})
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Previous Review Feedback Banner if any */}
        {dossier?.reviewNotes && (
          <div className="p-3.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-[11px] uppercase tracking-wider text-amber-800">
                Active HR Feedback Notes:
              </span>
              <span>"{dossier.reviewNotes}"</span>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Personal & Contact Profile */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider border-b border-gray-100 pb-2">
              Personal & Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <span className="text-[11px] text-gray-500 block">Date of Birth</span>
                <span className="font-medium text-gray-900">{formData.dob || employee.dob || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Gender</span>
                <span className="font-medium text-gray-900">{formData.gender || employee.gender || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Blood Group</span>
                <span className="font-medium text-gray-900">{formData.bloodGroup || employee.bloodGroup || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Marital Status</span>
                <span className="font-medium text-gray-900">{formData.maritalStatus || employee.maritalStatus || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Personal Email</span>
                <span className="font-medium text-gray-900">{formData.personalEmail || employee.personalEmail || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Mobile Phone</span>
                <span className="font-medium text-gray-900">{formData.personalMobile || employee.phone || "—"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[11px] text-gray-500 block">Present Residential Address</span>
                <span className="font-medium text-gray-900">{formData.presentAddress || employee.presentAddress || "—"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[11px] text-gray-500 block">Permanent Address</span>
                <span className="font-medium text-gray-900">{formData.permanentAddress || employee.permanentAddress || "—"}</span>
              </div>
            </div>
          </div>

          {/* 2. Family & Emergency Contacts */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider border-b border-gray-100 pb-2">
              Family & Emergency Nominee
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <span className="text-[11px] text-gray-500 block">Father's Name</span>
                <span className="font-medium text-gray-900">{formData.fathersName || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Mother's Name</span>
                <span className="font-medium text-gray-900">{formData.mothersName || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Spouse's Name</span>
                <span className="font-medium text-gray-900">{formData.spouseName || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Emergency Contact</span>
                <span className="font-medium text-gray-900">
                  {formData.emergencyContactName ? `${formData.emergencyContactName} (${formData.emergencyContactRelation || "Relation"}) - ${formData.emergencyContactPhone || ""}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Statutory Nominee</span>
                <span className="font-medium text-gray-900">
                  {formData.nomineeName ? `${formData.nomineeName} (${formData.nomineeRelationship || "Relation"})` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Nominee Share %</span>
                <span className="font-medium text-gray-900">{formData.nomineeShare ? `${formData.nomineeShare}%` : "100%"}</span>
              </div>
            </div>
          </div>

          {/* 3. Education Qualifications (Repeating) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider border-b border-gray-100 pb-2">
              Academic Qualifications
            </h3>
            {(() => {
              const eduList = formData["sec-education"] || formData.sec_education || formData.education || [];
              return Array.isArray(eduList) && eduList.length > 0 ? (
                <div className="space-y-2">
                  {eduList.map((edu: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                      <span className="font-semibold text-gray-900 block">{edu.degree || edu.educationClass || "Degree"}</span>
                      <span className="text-gray-600 block">{edu.institution || edu.schoolUniversity} • {edu.fieldOfStudy || edu.boardStudyField}</span>
                      <span className="text-[11px] text-gray-400 block mt-0.5">Year: {edu.passingYear || edu.year} • Score: {edu.gradeOrPercentage || edu.grade}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No academic records provided.</p>
              );
            })()}
          </div>

          {/* 4. Past Experience (Repeating) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider border-b border-gray-100 pb-2">
              Employment History
            </h3>
            {(() => {
              const expList = formData["sec-experience"] || formData.sec_experience || formData.experience || [];
              return Array.isArray(expList) && expList.length > 0 ? (
                <div className="space-y-2">
                  {expList.map((exp: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                      <span className="font-semibold text-gray-900 block">{exp.designation || exp.role} at {exp.organisationName || exp.companyName}</span>
                      <span className="text-gray-600 block">{exp.from || exp.startDate} to {exp.to || exp.endDate || "Present"}</span>
                      {(exp.reasonOfLeaving || exp.reasonForLeaving) && (
                        <span className="text-[11px] text-gray-500 block mt-0.5">Reason: {exp.reasonOfLeaving || exp.reasonForLeaving}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No previous employment records (Fresh Graduate or omitted).</p>
              );
            })()}
          </div>

          {/* 5. Bank & Statutory Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider border-b border-gray-100 pb-2">
              Payroll & Statutory Compliance
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <span className="text-[11px] text-gray-500 block">Bank Name</span>
                <span className="font-medium text-gray-900">{formData.bankName || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Account Number</span>
                <span className="font-medium text-gray-900 font-mono">{formData.accountNumber || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">IFSC Code</span>
                <span className="font-medium text-gray-900 font-mono">{formData.ifscCode || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Account Holder</span>
                <span className="font-medium text-gray-900">{formData.accountHolderName || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">PAN Number</span>
                <span className="font-medium text-gray-900 font-mono">{formData.pan || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Aadhaar Number</span>
                <span className="font-medium text-gray-900 font-mono">{formData.aadhaar || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">PF / UAN Number</span>
                <span className="font-medium text-gray-900 font-mono">{formData.uan || "—"}</span>
              </div>
            </div>
          </div>

          {/* 6. Uploaded Documents */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                Submitted Documents ({uploadedDocs.length})
              </h3>
            </div>
            {uploadedDocs.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {uploadedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{doc.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {doc.size} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                        Uploaded
                      </span>
                      {doc.url && (
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded border border-transparent hover:border-gray-200"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No files attached to dossier.</p>
            )}
          </div>
        </div>

        {/* Footer Review Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
          <div className="text-[11px] text-gray-500">
            {status === "APPROVED" ? (
              <span className="text-emerald-700 font-semibold">
                Dossier is approved and employee active.
              </span>
            ) : (
              <span>HR verification in progress.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {status !== "APPROVED" && (
              <>
                <button
                  type="button"
                  onClick={() => openActionModal("REQUEST_CHANGES")}
                  className="px-3.5 py-2 border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => openActionModal("REJECT")}
                  className="px-3.5 py-2 border border-red-200 bg-white hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Approve Onboarding
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notes Dialog Modal for Requesting Changes / Rejecting */}
        {showNotesModal &&
          createPortal(
            <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                    {modalAction === "REQUEST_CHANGES" ? "Request Changes from Candidate" : "Reject Onboarding"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNotesModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="block font-semibold text-gray-700">
                    Feedback Notes / Instructions for Candidate <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detail the corrections or missing documentation required..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-950 text-xs"
                  />
                  <p className="text-[11px] text-gray-500">
                    These instructions will be displayed prominently on the candidate's onboarding portal.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowNotesModal(false)}
                    className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmActionWithNotes}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs cursor-pointer ${
                      modalAction === "REQUEST_CHANGES" ? "bg-amber-600 hover:bg-amber-700" : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {modalAction === "REQUEST_CHANGES" ? "Send to Candidate" : "Confirm Rejection"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Document Preview Modal */}
        {previewDoc &&
          createPortal(
            <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{previewDoc.name}</h3>
                    <p className="text-xs text-gray-500">{previewDoc.size} • Verified Document Preview</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-gray-50 p-4 rounded-lg">
                  {previewDoc.url && (previewDoc.url.startsWith("data:image/") || previewDoc.type.includes("svg") || previewDoc.type.includes("image")) ? (
                    <img src={previewDoc.url} alt={previewDoc.name} className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg shadow-sm" />
                  ) : (
                    <div className="text-center py-12 text-xs text-gray-500">
                      <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="font-medium text-gray-700">{previewDoc.name}</p>
                      <p className="text-[11px] text-gray-400 mt-1">Binary file verified by HR compliance.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
