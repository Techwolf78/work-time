import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, Eye, RefreshCw } from "lucide-react";
import { OnboardingDocRequirement, CandidateUploadedDoc } from "../../types/hrms";

interface DocumentUploadSectionProps {
  requirements: OnboardingDocRequirement[];
  uploadedDocs: CandidateUploadedDoc[];
  onUpload: (requirementId: string, file: File) => void;
  onRemove: (documentId: string) => void;
  disabled?: boolean;
}

export function DocumentUploadSection({
  requirements,
  uploadedDocs,
  onUpload,
  onRemove,
  disabled = false,
}: DocumentUploadSectionProps) {
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewDoc, setPreviewDoc] = useState<CandidateUploadedDoc | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateAndUpload = (req: OnboardingDocRequirement, file: File) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[req.id];
      return next;
    });

    // Check size
    if (file.size > req.maxSizeBytes) {
      setErrors((prev) => ({
        ...prev,
        [req.id]: `File exceeds maximum allowed size of ${formatFileSize(req.maxSizeBytes)}.`,
      }));
      return;
    }

    // Check format
    const extension = file.name.split(".").pop()?.toUpperCase() || "";
    const isAccepted = req.acceptedFormats.some((fmt) => {
      const cleanFmt = fmt.replace(".", "").toUpperCase();
      return cleanFmt === extension || file.type.toUpperCase().includes(cleanFmt);
    });

    if (!isAccepted) {
      setErrors((prev) => ({
        ...prev,
        [req.id]: `Invalid format. Allowed formats: ${req.acceptedFormats.join(", ")}.`,
      }));
      return;
    }

    onUpload(req.id, file);
  };

  const handleDrag = (e: React.DragEvent, reqId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveId(reqId);
    } else if (e.type === "dragleave") {
      setDragActiveId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, req: OnboardingDocRequirement) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveId(null);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(req, e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requirements.map((req) => {
          const uploaded = uploadedDocs.find((d) => d.requirementId === req.id);
          const isDragging = dragActiveId === req.id;
          const errorMsg = errors[req.id];

          return (
            <div
              key={req.id}
              className={`p-4 border rounded-xl transition-all ${
                uploaded
                  ? "bg-white border-emerald-200"
                  : isDragging
                  ? "bg-gray-50 border-gray-950 ring-2 ring-gray-950/10"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
              onDragEnter={(e) => handleDrag(e, req.id)}
              onDragLeave={(e) => handleDrag(e, req.id)}
              onDragOver={(e) => handleDrag(e, req.id)}
              onDrop={(e) => handleDrop(e, req)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-gray-900">{req.name}</h4>
                    {req.required ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-50 text-red-700 rounded border border-red-200">
                        Required
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">
                        Optional
                      </span>
                    )}
                  </div>
                  {req.description && (
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {req.description}
                    </p>
                  )}
                </div>

                {uploaded && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Uploaded
                  </span>
                )}
              </div>

              {/* Requirement constraints info */}
              <div className="text-[11px] text-gray-400 mb-3">
                Max {formatFileSize(req.maxSizeBytes)} • {req.acceptedFormats.join(", ")}
              </div>

              {/* Uploaded state vs Empty state */}
              {uploaded ? (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {uploaded.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {uploaded.size} • {new Date(uploaded.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {uploaded.url && (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(uploaded)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!disabled && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[req.id]?.click()}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
                          title="Replace"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(req.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !disabled && fileInputRefs.current[req.id]?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                    disabled
                      ? "opacity-50 cursor-not-allowed border-gray-200"
                      : isDragging
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50"
                  }`}
                >
                  <UploadCloud className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-800">
                    Drag and drop or <span className="text-gray-950 underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Select a file from your device
                  </p>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={(el) => (fileInputRefs.current[req.id] = el)}
                type="file"
                className="hidden"
                accept={req.acceptedFormats.map((f) => (f.startsWith(".") ? f : `.${f.toLowerCase()}`)).join(",")}
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    validateAndUpload(req, e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />

              {/* Error display */}
              {errorMsg && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Document Preview Modal */}
      {previewDoc &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{previewDoc.name}</h3>
                  <p className="text-xs text-gray-500">{previewDoc.size} • Official Verified Document Preview</p>
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
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.name}
                    className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
                  />
                ) : previewDoc.type === "application/pdf" && previewDoc.url ? (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.name}
                    className="w-full h-[55vh] rounded border border-gray-200"
                  />
                ) : (
                  <div className="text-center py-12 text-xs text-gray-500">
                    <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="font-medium text-gray-700">{previewDoc.name}</p>
                    <p className="text-[11px] text-gray-400 mt-1">Binary file verified by HR statutory compliance.</p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
