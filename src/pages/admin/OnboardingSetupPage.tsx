import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronRight,
  UploadCloud,
  X,
  Sliders,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { useToast } from "../../lib/toastContext";
import {
  OnboardingSectionConfig,
  OnboardingFieldConfig,
  OnboardingDocRequirement,
  OnboardingFieldType,
} from "../../types/hrms";
import { DynamicFieldRenderer } from "../../components/onboarding/DynamicFieldRenderer";

// Helper for human-readable field types without rainbow color clutter
function getFieldTypeLabel(type: OnboardingFieldType): string {
  switch (type) {
    case "TEXT":
      return "Single-line Text";
    case "TEXTAREA":
      return "Multi-line Text";
    case "EMAIL":
      return "Email Address";
    case "PHONE":
      return "Phone Number";
    case "NUMBER":
      return "Numeric";
    case "DATE":
      return "Date";
    case "SELECT":
      return "Dropdown";
    case "MULTISELECT":
      return "Multi-Select";
    case "CHECKBOX":
      return "Checkbox";
    case "RADIO":
      return "Radio";
    case "READONLY":
      return "Read-Only";
    default:
      return type;
  }
}

export function OnboardingSetupPage() {
  const navigate = useNavigate();
  const { onboardingConfig, updateOnboardingConfig, publishOnboardingConfig } = useHrms();
  const { success, error, info } = useToast();

  const sortedSections = useMemo(() => {
    return [...(onboardingConfig?.sections || [])].sort((a, b) => a.order - b.order);
  }, [onboardingConfig?.sections]);

  // Selected Section for Studio View
  const [selectedSectionId, setSelectedSectionId] = useState<string>(() => {
    return sortedSections[0]?.id || "";
  });

  const activeSection = useMemo(() => {
    return sortedSections.find((s) => s.id === selectedSectionId) || sortedSections[0] || null;
  }, [sortedSections, selectedSectionId]);

  // Active Tab in Workspace (Fields vs Documents)
  const [workspaceTab, setWorkspaceTab] = useState<"FIELDS" | "DOCS">("FIELDS");

  // Keep workspace tab in sync if selected section changes
  React.useEffect(() => {
    if (activeSection?.documents && activeSection.documents.length > 0 && activeSection.fields.length === 0) {
      setWorkspaceTab("DOCS");
    } else {
      setWorkspaceTab("FIELDS");
    }
  }, [activeSection?.id]);

  // Modals state
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<OnboardingSectionConfig | null>(null);

  const [showFieldModal, setShowFieldModal] = useState(false);
  const [targetSectionIdForField, setTargetSectionIdForField] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<OnboardingFieldConfig | null>(null);

  const [showDocModal, setShowDocModal] = useState(false);
  const [targetSectionIdForDoc, setTargetSectionIdForDoc] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<OnboardingDocRequirement | null>(null);

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Form states for Section Modal
  const [secTitle, setSecTitle] = useState("");
  const [secDescription, setSecDescription] = useState("");
  const [secIsRepeating, setSecIsRepeating] = useState(false);
  const [secItemLabel, setSecItemLabel] = useState("");

  // Form states for Field Modal
  const [fName, setFName] = useState("");
  const [fLabel, setFLabel] = useState("");
  const [fType, setFType] = useState<OnboardingFieldType>("TEXT");
  const [fRequired, setFRequired] = useState(false);
  const [fPlaceholder, setFPlaceholder] = useState("");
  const [fHelpText, setFHelpText] = useState("");
  const [fOptionsStr, setFOptionsStr] = useState("");

  // Form states for Doc Modal
  const [docName, setDocName] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docCategory, setDocCategory] = useState<OnboardingDocRequirement["category"]>("IDENTITY");
  const [docRequired, setDocRequired] = useState(true);
  const [docFormatsStr, setDocFormatsStr] = useState("PDF, JPG, PNG");
  const [docMaxSizeMB, setDocMaxSizeMB] = useState(5);

  // Section Reordering
  const handleMoveSection = (index: number, direction: "UP" | "DOWN", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedSections.length) return;

    const newSections = [...sortedSections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const updated = newSections.map((sec, i) => ({ ...sec, order: i + 1 }));
    updateOnboardingConfig({ sections: updated });
    success("Section sequence updated.");
  };

  // Section Toggle Enabled
  const handleToggleSectionEnabled = (sectionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = onboardingConfig.sections.map((sec) =>
      sec.id === sectionId ? { ...sec, enabled: !sec.enabled } : sec
    );
    updateOnboardingConfig({ sections: updated });
  };

  // Save / Update Section
  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secTitle.trim()) {
      error("Section title is required.");
      return;
    }

    if (editingSection) {
      const updated = onboardingConfig.sections.map((sec) => {
        if (sec.id === editingSection.id) {
          return {
            ...sec,
            title: secTitle,
            description: secDescription,
            isRepeating: secIsRepeating,
            repeatingConfig: secIsRepeating
              ? { itemLabel: secItemLabel || "Entry", minItems: 1, maxItems: 10 }
              : undefined,
          };
        }
        return sec;
      });
      updateOnboardingConfig({ sections: updated });
      success("Section details updated.");
    } else {
      const newSection: OnboardingSectionConfig = {
        id: `sec_${Date.now()}`,
        title: secTitle,
        description: secDescription,
        order: onboardingConfig.sections.length + 1,
        enabled: true,
        isRepeating: secIsRepeating,
        repeatingConfig: secIsRepeating
          ? { itemLabel: secItemLabel || "Entry", minItems: 1, maxItems: 10 }
          : undefined,
        fields: [],
      };
      updateOnboardingConfig({ sections: [...onboardingConfig.sections, newSection] });
      setSelectedSectionId(newSection.id);
      success("New section added to onboarding workflow.");
    }

    setShowSectionModal(false);
    setEditingSection(null);
  };

  const openAddSection = () => {
    setEditingSection(null);
    setSecTitle("");
    setSecDescription("");
    setSecIsRepeating(false);
    setSecItemLabel("Entry");
    setShowSectionModal(true);
  };

  const openEditSection = (sec: OnboardingSectionConfig) => {
    setEditingSection(sec);
    setSecTitle(sec.title);
    setSecDescription(sec.description || "");
    setSecIsRepeating(Boolean(sec.isRepeating));
    setSecItemLabel(sec.repeatingConfig?.itemLabel || "Entry");
    setShowSectionModal(true);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (confirm("Are you sure you want to delete this section and all associated fields?")) {
      const updated = onboardingConfig.sections
        .filter((s) => s.id !== sectionId)
        .map((s, i) => ({ ...s, order: i + 1 }));
      updateOnboardingConfig({ sections: updated });
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(updated[0]?.id || "");
      }
      success("Section removed.");
    }
  };

  // Field Management
  const openAddField = (sectionId: string) => {
    setTargetSectionIdForField(sectionId);
    setEditingField(null);
    setFName("");
    setFLabel("");
    setFType("TEXT");
    setFRequired(false);
    setFPlaceholder("");
    setFHelpText("");
    setFOptionsStr("");
    setShowFieldModal(true);
  };

  const openEditField = (sectionId: string, field: OnboardingFieldConfig) => {
    setTargetSectionIdForField(sectionId);
    setEditingField(field);
    setFName(field.name);
    setFLabel(field.label);
    setFType(field.type);
    setFRequired(field.required);
    setFPlaceholder(field.placeholder || "");
    setFHelpText(field.helpText || "");
    setFOptionsStr(field.options?.map((o) => `${o.value}:${o.label}`).join("\n") || "");
    setShowFieldModal(true);
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fLabel.trim() || !fName.trim()) {
      error("Field label and identifier are required.");
      return;
    }

    const options = fOptionsStr
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(":");
        if (parts.length >= 2) {
          return { value: parts[0].trim(), label: parts[1].trim() };
        }
        return { value: line, label: line };
      });

    const updatedSections = onboardingConfig.sections.map((sec) => {
      if (sec.id === targetSectionIdForField) {
        let nextFields: OnboardingFieldConfig[];
        if (editingField) {
          nextFields = sec.fields.map((f) => {
            if (f.id === editingField.id) {
              return {
                ...f,
                name: fName,
                label: fLabel,
                type: fType,
                required: fRequired,
                placeholder: fPlaceholder || undefined,
                helpText: fHelpText || undefined,
                options: options.length > 0 ? options : undefined,
              };
            }
            return f;
          });
        } else {
          const newF: OnboardingFieldConfig = {
            id: `fld_${Date.now()}`,
            name: fName,
            label: fLabel,
            type: fType,
            required: fRequired,
            order: sec.fields.length + 1,
            placeholder: fPlaceholder || undefined,
            helpText: fHelpText || undefined,
            options: options.length > 0 ? options : undefined,
          };
          nextFields = [...sec.fields, newF];
        }
        return { ...sec, fields: nextFields };
      }
      return sec;
    });

    updateOnboardingConfig({ sections: updatedSections });
    setShowFieldModal(false);
    success(editingField ? "Field schema updated." : "Field added to section.");
  };

  const handleDeleteField = (sectionId: string, fieldId: string) => {
    const updatedSections = onboardingConfig.sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          fields: sec.fields.filter((f) => f.id !== fieldId),
        };
      }
      return sec;
    });
    updateOnboardingConfig({ sections: updatedSections });
    info("Field removed.");
  };

  // Doc Requirement Management
  const openAddDoc = (sectionId: string) => {
    setTargetSectionIdForDoc(sectionId);
    setEditingDoc(null);
    setDocName("");
    setDocDescription("");
    setDocCategory("IDENTITY");
    setDocRequired(true);
    setDocFormatsStr("PDF, JPG, PNG");
    setDocMaxSizeMB(5);
    setShowDocModal(true);
  };

  const openEditDoc = (sectionId: string, doc: OnboardingDocRequirement) => {
    setTargetSectionIdForDoc(sectionId);
    setEditingDoc(doc);
    setDocName(doc.name);
    setDocDescription(doc.description || "");
    setDocCategory(doc.category);
    setDocRequired(doc.required);
    setDocFormatsStr(doc.acceptedFormats.join(", "));
    setDocMaxSizeMB(Math.round(doc.maxSizeBytes / 1024 / 1024));
    setShowDocModal(true);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      error("Document title is required.");
      return;
    }

    const formats = docFormatsStr
      .split(",")
      .map((f) => f.trim().toUpperCase())
      .filter(Boolean);

    const updatedSections = onboardingConfig.sections.map((sec) => {
      if (sec.id === targetSectionIdForDoc) {
        const existingDocs = sec.documents || [];
        let nextDocs: OnboardingDocRequirement[];

        if (editingDoc) {
          nextDocs = existingDocs.map((d) =>
            d.id === editingDoc.id
              ? {
                  ...d,
                  name: docName,
                  description: docDescription || undefined,
                  category: docCategory,
                  required: docRequired,
                  acceptedFormats: formats.length > 0 ? formats : ["PDF", "JPG", "PNG"],
                  maxSizeBytes: docMaxSizeMB * 1024 * 1024,
                }
              : d
          );
        } else {
          const newDoc: OnboardingDocRequirement = {
            id: `doc_${Date.now()}`,
            name: docName,
            description: docDescription || undefined,
            category: docCategory,
            required: docRequired,
            acceptedFormats: formats.length > 0 ? formats : ["PDF", "JPG", "PNG"],
            maxSizeBytes: docMaxSizeMB * 1024 * 1024,
          };
          nextDocs = [...existingDocs, newDoc];
        }
        return { ...sec, documents: nextDocs };
      }
      return sec;
    });

    updateOnboardingConfig({ sections: updatedSections });
    setShowDocModal(false);
    success(editingDoc ? "Document slot updated." : "Document requirement added.");
  };

  const handleDeleteDoc = (sectionId: string, docId: string) => {
    const updatedSections = onboardingConfig.sections.map((sec) => {
      if (sec.id === sectionId && sec.documents) {
        return {
          ...sec,
          documents: sec.documents.filter((d) => d.id !== docId),
        };
      }
      return sec;
    });
    updateOnboardingConfig({ sections: updatedSections });
    info("Document requirement removed.");
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top Header Row with Integrated Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button
              type="button"
              onClick={() => navigate("/people/employees")}
              className="inline-flex items-center gap-1 font-semibold text-gray-500 hover:text-gray-950 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Employees</span>
            </button>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-gray-900 font-medium">Onboarding Configuration</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight">
              Onboarding Configuration
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
              v{onboardingConfig.version || 1}.0 {onboardingConfig.isPublished ? "Published" : "Draft"}
            </span>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              • {sortedSections.length} Sections Configured
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Build and manage candidate onboarding sections, fields, document requirements, and repeating groups.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="h-8 px-3 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-gray-500" />
            <span>Live Preview</span>
          </button>

          <button
            type="button"
            onClick={openAddSection}
            className="h-8 px-3 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-gray-500" />
            <span>Add Section</span>
          </button>

          <button
            type="button"
            onClick={() => publishOnboardingConfig()}
            className="h-8 px-3.5 bg-gray-950 hover:bg-black text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" />
            <span>Publish Version</span>
          </button>
        </div>
      </div>

      {/* Two-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Section Hierarchy & Order (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Form Sections
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-full">
                {sortedSections.length}
              </span>
            </div>
            <button
              type="button"
              onClick={openAddSection}
              className="text-xs font-semibold text-gray-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-1.5">
            {sortedSections.map((sec, idx) => {
              const isSelected = activeSection?.id === sec.id;
              const isFirst = idx === 0;
              const isLast = idx === sortedSections.length - 1;
              const hasDocs = sec.documents && sec.documents.length > 0;

              return (
                <div
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`group relative p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-gray-950 ring-1 ring-gray-950/10 shadow-xs"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/70"
                  } ${!sec.enabled ? "opacity-60 bg-gray-50/60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-gray-950 text-white"
                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-gray-950 truncate tracking-tight">
                          {sec.title}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 flex-wrap">
                          {hasDocs ? (
                            <span>{sec.documents?.length} {sec.documents?.length === 1 ? "document" : "documents"}</span>
                          ) : (
                            <span>{sec.fields.length} {sec.fields.length === 1 ? "field" : "fields"}</span>
                          )}
                          <span>•</span>
                          <span>{sec.isRepeating ? "Repeating" : "Standard"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Modern iOS switch & reorder controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Reorder Arrows on hover */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleMoveSection(idx, "UP", e)}
                          disabled={isFirst}
                          className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 cursor-pointer"
                          title="Move step up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleMoveSection(idx, "DOWN", e)}
                          disabled={isLast}
                          className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 cursor-pointer"
                          title="Move step down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Smooth Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={sec.enabled}
                        onClick={(e) => handleToggleSectionEnabled(sec.id, e)}
                        className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          sec.enabled ? "bg-gray-950" : "bg-gray-200"
                        }`}
                        title={sec.enabled ? "Section Enabled — Click to disable" : "Section Disabled — Click to enable"}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            sec.enabled ? "translate-x-3.5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Section Button */}
            <button
              type="button"
              onClick={openAddSection}
              className="w-full py-2.5 px-3 border border-dashed border-gray-300 hover:border-gray-900 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-950 bg-white/60 hover:bg-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Another Section</span>
            </button>
          </div>
        </div>

        {/* Right Column: Selected Section Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-3.5">
          {activeSection ? (
            <>
              {/* Active Section Header Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Section #{activeSection.order}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="font-mono text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                        {activeSection.id}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-gray-950">
                      {activeSection.title}
                    </h2>
                    {activeSection.description && (
                      <p className="text-xs text-gray-500">
                        {activeSection.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditSection(activeSection)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-gray-500" />
                      <span>Edit Info</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(activeSection.id)}
                      className="p-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Clean Section Meta Line */}
                <div className="flex items-center gap-2.5 text-xs text-gray-500 pt-0.5">
                  <span>{activeSection.isRepeating ? `Repeating (${activeSection.repeatingConfig?.itemLabel || "Row"})` : "Standard Form"}</span>
                  <span>•</span>
                  <span>{activeSection.enabled ? "Active" : "Disabled"}</span>
                  <span>•</span>
                  <span>{activeSection.fields.length} {activeSection.fields.length === 1 ? "Field" : "Fields"}</span>
                  {activeSection.documents && activeSection.documents.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{activeSection.documents.length} {activeSection.documents.length === 1 ? "Document" : "Documents"}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Workspace Container (Tabs + Tables) */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
                {/* Workspace Navigation Tabs */}
                <div className="flex items-center justify-between border-b border-gray-200 px-4 pt-2.5 bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setWorkspaceTab("FIELDS")}
                      className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                        workspaceTab === "FIELDS"
                          ? "border-gray-950 text-gray-950"
                          : "border-transparent text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      Section Fields ({activeSection.fields.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkspaceTab("DOCS")}
                      className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                        workspaceTab === "DOCS"
                          ? "border-gray-950 text-gray-950"
                          : "border-transparent text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      Document Slots ({activeSection.documents?.length || 0})
                    </button>
                  </div>

                  <div className="pb-2">
                    {workspaceTab === "FIELDS" ? (
                      <button
                        type="button"
                        onClick={() => openAddField(activeSection.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-950 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Field</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAddDoc(activeSection.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-950 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Document Slot</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Workspace Body */}
                <div className="p-4">
                  {workspaceTab === "FIELDS" ? (
                    <div>
                      {activeSection.fields.length === 0 ? (
                        <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-xl space-y-3">
                          <Sliders className="w-8 h-8 text-gray-300 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-gray-900">No fields configured in this section</h4>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                              Add text inputs, dates, selects, or statutory declaration checkboxes to capture candidate information.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openAddField(activeSection.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-950 text-white rounded-lg text-xs font-semibold hover:bg-black cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add First Field</span>
                          </button>
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200 select-none">
                              <tr>
                                <th className="px-4 py-2.5">Field Label</th>
                                <th className="px-4 py-2.5">Identifier</th>
                                <th className="px-4 py-2.5">Type</th>
                                <th className="px-4 py-2.5">Required</th>
                                <th className="px-4 py-2.5">Read-Only</th>
                                <th className="px-4 py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {activeSection.fields.map((f) => (
                                <tr key={f.id} className="hover:bg-gray-50/70 transition-colors">
                                  <td className="px-4 py-3 font-medium text-gray-950">
                                    <div>{f.label}</div>
                                    {f.helpText && (
                                      <div className="text-[11px] text-gray-400 font-normal mt-0.5">
                                        {f.helpText}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                    {f.name}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-700">
                                    {getFieldTypeLabel(f.type)}
                                  </td>
                                  <td className="px-4 py-3 text-xs">
                                    <span className={f.required ? "font-medium text-gray-950" : "text-gray-400"}>
                                      {f.required ? "Yes" : "No"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-500">
                                    {f.readOnly || f.type === "READONLY" ? "Yes" : "No"}
                                  </td>
                                  <td className="px-4 py-3 text-right space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => openEditField(activeSection.id, f)}
                                      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                      title="Edit Field"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteField(activeSection.id, f.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                      title="Delete Field"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Documents Tab */
                    <div className="space-y-4">
                      {(!activeSection.documents || activeSection.documents.length === 0) ? (
                        <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-xl space-y-3">
                          <UploadCloud className="w-8 h-8 text-gray-300 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-gray-900">No document requirements attached</h4>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                              Require candidates to upload identity proofs, certificates, or agreements in this onboarding stage.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openAddDoc(activeSection.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-950 text-white rounded-lg text-xs font-semibold hover:bg-black cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Document Slot</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {activeSection.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-2.5 shadow-2xs hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-semibold text-gray-950 truncate">
                                      {doc.name}
                                    </h4>
                                    <span className="text-[11px] text-gray-500">
                                      • {doc.required ? "Required" : "Optional"}
                                    </span>
                                  </div>
                                  {doc.description && (
                                    <p className="text-[11px] text-gray-500">
                                      {doc.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => openEditDoc(activeSection.id, doc)}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                    title="Edit Document Slot"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDoc(activeSection.id, doc.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                    title="Delete Document Slot"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                                <span>Category: <strong className="text-gray-800 font-medium">{doc.category}</strong></span>
                                <span>Formats: <strong className="text-gray-800 font-medium">{doc.acceptedFormats.join(", ")}</strong></span>
                                <span>Max: <strong className="text-gray-800 font-medium">{Math.round(doc.maxSizeBytes / 1024 / 1024)} MB</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
              <p className="text-xs text-gray-500">Select a section from the left column to begin configuration.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL 1: ADD / EDIT SECTION --- */}
      {showSectionModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveSection}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-950">
                  {editingSection ? "Edit Section Details" : "Create New Section"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Section Title *</label>
                  <input
                    type="text"
                    value={secTitle}
                    onChange={(e) => setSecTitle(e.target.value)}
                    placeholder="e.g. Statutory & Compliance Details"
                    required
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Description / Subtitle</label>
                  <textarea
                    value={secDescription}
                    onChange={(e) => setSecDescription(e.target.value)}
                    placeholder="Clear guidance notes displayed to candidate..."
                    rows={2}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden"
                  />
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secIsRepeating}
                      onChange={(e) => setSecIsRepeating(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-gray-950 focus:ring-gray-950"
                    />
                    <div>
                      <span className="font-semibold text-gray-900 block">Repeating Multi-Entry Group</span>
                      <span className="text-[11px] text-gray-500 block mt-0.5">
                        Enables candidate to add multiple rows dynamically (e.g. Education Degrees, Previous Employment).
                      </span>
                    </div>
                  </label>
                </div>

                {secIsRepeating && (
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Row Item Label</label>
                    <input
                      type="text"
                      value={secItemLabel}
                      onChange={(e) => setSecItemLabel(e.target.value)}
                      placeholder="e.g. Degree / Qualification"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gray-950 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  {editingSection ? "Save Changes" : "Create Section"}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* --- MODAL 2: ADD / EDIT FIELD --- */}
      {showFieldModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveField}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-950">
                  {editingField ? "Edit Field Definition" : "Add New Field to Section"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFieldModal(false)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Display Label *</label>
                    <input
                      type="text"
                      value={fLabel}
                      onChange={(e) => setFLabel(e.target.value)}
                      placeholder="e.g. Passport Number"
                      required
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">API Identifier *</label>
                    <input
                      type="text"
                      value={fName}
                      onChange={(e) => setFName(e.target.value)}
                      placeholder="e.g. passportNumber"
                      required
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Input Type</label>
                    <select
                      value={fType}
                      onChange={(e) => setFType(e.target.value as OnboardingFieldType)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden bg-white"
                    >
                      <option value="TEXT">Single-line Text</option>
                      <option value="TEXTAREA">Multi-line Text</option>
                      <option value="EMAIL">Email Address</option>
                      <option value="PHONE">Phone Number</option>
                      <option value="NUMBER">Numeric Input</option>
                      <option value="DATE">Date Picker</option>
                      <option value="SELECT">Dropdown Select</option>
                      <option value="MULTISELECT">Multi-Select Pills</option>
                      <option value="CHECKBOX">Checkbox Toggle</option>
                      <option value="RADIO">Radio Choices</option>
                      <option value="READONLY">Read-Only Value</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        checked={fRequired}
                        onChange={(e) => setFRequired(e.target.checked)}
                        className="w-4 h-4 rounded text-gray-950 focus:ring-gray-950"
                      />
                      <span>Mandatory Field</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Placeholder Text</label>
                  <input
                    type="text"
                    value={fPlaceholder}
                    onChange={(e) => setFPlaceholder(e.target.value)}
                    placeholder="e.g. Enter valid 8-digit alphanumeric code"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Helper Subtext</label>
                  <input
                    type="text"
                    value={fHelpText}
                    onChange={(e) => setFHelpText(e.target.value)}
                    placeholder="e.g. As per your official government record"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden"
                  />
                </div>

                {(fType === "SELECT" || fType === "RADIO" || fType === "MULTISELECT") && (
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Options (One per line as "value:Label" or "Label")
                    </label>
                    <textarea
                      value={fOptionsStr}
                      onChange={(e) => setFOptionsStr(e.target.value)}
                      placeholder={"YES:Yes\nNO:No"}
                      rows={3}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 font-mono text-[11px]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowFieldModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gray-950 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  {editingField ? "Update Field" : "Save Field"}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* --- MODAL 3: ADD / EDIT DOCUMENT REQUIREMENT --- */}
      {showDocModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveDoc}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-950">
                  {editingDoc ? "Edit Document Requirement" : "Add Document Requirement"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Document Title *</label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. Government Aadhaar Card (Front & Back)"
                    required
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Guidance Subtitle</label>
                  <input
                    type="text"
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    placeholder="e.g. Ensure 12-digit number is clearly legible"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value as OnboardingDocRequirement["category"])}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden bg-white"
                    >
                      <option value="IDENTITY">Identity Verification</option>
                      <option value="ACADEMIC">Academic Credentials</option>
                      <option value="EXPERIENCE">Past Employment</option>
                      <option value="PAYROLL">Banking & Payroll</option>
                      <option value="OTHER">Other Documents</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        checked={docRequired}
                        onChange={(e) => setDocRequired(e.target.checked)}
                        className="w-4 h-4 rounded text-gray-950 focus:ring-gray-950"
                      />
                      <span>Mandatory Upload</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Accepted Formats</label>
                    <input
                      type="text"
                      value={docFormatsStr}
                      onChange={(e) => setDocFormatsStr(e.target.value)}
                      placeholder="PDF, JPG, PNG"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Max File Size (MB)</label>
                    <input
                      type="number"
                      value={docMaxSizeMB}
                      onChange={(e) => setDocMaxSizeMB(Number(e.target.value))}
                      min={1}
                      max={25}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-gray-950 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gray-950 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  {editingDoc ? "Save Changes" : "Add Requirement"}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* --- MODAL 4: LIVE PREVIEW --- */}
      {showPreviewModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
                <div>
                  <h3 className="text-sm font-bold text-gray-950">Candidate Onboarding Form Preview</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Live view of sections and fields as experienced by candidates on <code className="text-gray-800 font-mono">/onboarding</code>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200/50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {sortedSections
                  .filter((s) => s.enabled)
                  .map((sec, i) => (
                    <div key={sec.id} className="p-5 border border-gray-200 rounded-2xl space-y-4 bg-white shadow-2xs">
                      <div className="border-b border-gray-100 pb-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Step {i + 1}
                        </span>
                        <h4 className="text-sm font-bold text-gray-950">{sec.title}</h4>
                        {sec.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{sec.description}</p>
                        )}
                      </div>

                      {sec.documents && sec.documents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {sec.documents.map((d) => (
                            <div key={d.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                              <span className="font-semibold text-gray-900 block">{d.name}</span>
                              <span className="text-[11px] text-gray-500 block">
                                {d.required ? "Mandatory" : "Optional"} • {d.acceptedFormats.join(", ")} • Max {Math.round(d.maxSizeBytes / 1024 / 1024)}MB
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : sec.isRepeating ? (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 space-y-1">
                          <strong className="font-semibold block text-gray-950">Repeating Multi-Entry Group</strong>
                          <p className="text-gray-600">
                            Candidate dynamically enters multiple entries for <strong>{sec.repeatingConfig?.itemLabel || "Entry"}</strong>.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {sec.fields.map((f) => (
                            <div key={f.id}>
                              <DynamicFieldRenderer
                                field={f}
                                value={f.defaultValue}
                                onChange={() => {}}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-gray-950 text-white rounded-xl text-xs font-semibold hover:bg-black cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
