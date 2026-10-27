import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Save,
  LogOut,
  Building2,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { useAuth } from "../../lib/authContext";
import { useToast } from "../../lib/toastContext";
import { GaHrmsLogo } from "../../components/ui/GaHrmsLogo";
import {
  OnboardingSectionConfig,
  OnboardingCondition,
  CandidateDossier,
  CandidateUploadedDoc,
} from "../../types/hrms";
import { DynamicFieldRenderer } from "../../components/onboarding/DynamicFieldRenderer";
import { RepeatingGroupRenderer } from "../../components/onboarding/RepeatingGroupRenderer";
import { DocumentUploadSection } from "../../components/onboarding/DocumentUploadSection";
import { ConsolidatedReviewSection } from "../../components/onboarding/ConsolidatedReviewSection";

function evaluateCondition(
  condition?: OnboardingCondition,
  formData?: Record<string, any>
): boolean {
  if (!condition) return true;
  const val = formData ? formData[condition.field] : undefined;
  switch (condition.operator) {
    case "EQUALS":
      return String(val) === String(condition.value);
    case "NOT_EQUALS":
      return String(val) !== String(condition.value);
    case "CONTAINS":
      if (Array.isArray(val)) return val.includes(condition.value);
      return String(val || "")
        .toLowerCase()
        .includes(String(condition.value).toLowerCase());
    case "IS_EMPTY":
      return (
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0)
      );
    case "IS_NOT_EMPTY":
      return (
        val !== undefined &&
        val !== null &&
        val !== "" &&
        (!Array.isArray(val) || val.length > 0)
      );
    default:
      return true;
  }
}

export function SelfOnboardingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    employees,
    departments,
    designations,
    onboardingConfig,
    getCandidateDossier,
    saveOnboardingDraft,
    submitOnboarding,
    uploadCandidateDocument,
    removeCandidateDocument,
  } = useHrms();
  const { success, error, info } = useToast();

  // 1. Identify Candidate Employee Record
  const currentEmployee = useMemo(() => {
    if (!user) return employees.find((e) => e.id === "EMP-1033") || employees[0];
    return (
      employees.find((e) => e.id === user.employeeId || e.email === user.email) ||
      employees.find((e) => e.id === "EMP-1033") ||
      employees[0]
    );
  }, [user, employees]);

  const department = useMemo(() => {
    return departments.find((d) => d.id === currentEmployee?.departmentId);
  }, [departments, currentEmployee]);

  const designation = useMemo(() => {
    return designations.find((d) => d.id === currentEmployee?.designationId);
  }, [designations, currentEmployee]);

  const employeeId = currentEmployee?.id || "EMP-1033";

  // 2. Load Dossier from HRMS Context
  const dossier: CandidateDossier | undefined = useMemo(() => {
    return getCandidateDossier(employeeId);
  }, [getCandidateDossier, employeeId]);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const existing = dossier?.formData || {};
    const desigTitle = designation?.title || "Software Engineer II";
    const deptName = department?.name || "Engineering";
    const ctcFormatted = currentEmployee?.annualCtc
      ? `₹${(currentEmployee.annualCtc / 100000).toFixed(1)} LPA (₹${currentEmployee.annualCtc.toLocaleString("en-IN")})`
      : "₹18,50,000 (₹18.5 LPA)";
    const joiningDateStr = currentEmployee?.joiningDate || "2026-11-01";

    const defaultValues: Record<string, any> = {
      offeredDesignation: desigTitle,
      designation: desigTitle,
      offeredDepartment: deptName,
      department: deptName,
      offeredAnnualCtc: ctcFormatted,
      annualCtc: ctcFormatted,
      ctc: ctcFormatted,
      joiningDate: joiningDateStr,
      offerAccepted: true,
      fullName: `${currentEmployee?.firstName || "Ramesh"} ${currentEmployee?.lastName || "Patil"}`.trim(),
      firstName: currentEmployee?.firstName || "Ramesh",
      lastName: currentEmployee?.lastName || "Patil",
      dob: currentEmployee?.dob || "1998-05-15",
      gender: currentEmployee?.gender || "MALE",
      bloodGroup: currentEmployee?.bloodGroup || "O+",
      maritalStatus: currentEmployee?.maritalStatus || "Single",
      personalEmail: currentEmployee?.personalEmail || "ramesh.patil.personal@gmail.com",
      personalMobile: currentEmployee?.phone || "+91 98201 12345",
      presentAddress: currentEmployee?.presentAddress || "Flat 402, Green Meadows, Baner Road, Pune, Maharashtra 411045",
      permanentAddress: currentEmployee?.permanentAddress || "Flat 402, Green Meadows, Baner Road, Pune, Maharashtra 411045",
      fathersName: "Anand Patil",
      mothersName: "Sunita Patil",
      emergencyContactName: "Sunita Patil",
      emergencyContactRelation: "Mother",
      emergencyContactPhone: "+91 98201 99887",
      nomineeName: "Sunita Patil",
      nomineeRelationship: "Mother",
      nomineeShare: 100,
      bankName: currentEmployee?.bankName || "HDFC Bank Ltd.",
      accountHolderName: currentEmployee?.accountHolderName || "Ramesh Anand Patil",
      accountNumber: currentEmployee?.accountNumber || "50100456123489",
      ifscCode: currentEmployee?.ifscCode || "HDFC0000052",
      pan: currentEmployee?.pan || "ABCDE1234F",
      aadhaar: currentEmployee?.aadhaar || "5412 8901 2345",
      uan: currentEmployee?.uan || "100987654321",
      codeOfConductAccepted: true,
      ndaAccepted: true,
      poshAccepted: true,
      digitalSignature: "Ramesh Anand Patil",
    };

    const initialEdu = existing["sec-education"] || existing.education || [
      {
        educationClass: "Bachelor's Degree",
        schoolUniversity: "Pune Institute of Computer Technology (PICT)",
        boardStudyField: "Computer Science & Engineering",
        year: "2020",
        grade: "8.7 CGPA",
      },
      {
        educationClass: "12th Standard",
        schoolUniversity: "Fergusson Junior College",
        boardStudyField: "Science (PCM)",
        year: "2016",
        grade: "88.4%",
      },
    ];

    const initialExp = existing["sec-experience"] || existing.experience || [
      {
        organisationName: "TechCorp Global Solutions Pvt. Ltd.",
        designation: "Associate Software Engineer",
        from: "2021-06-01",
        to: "2023-11-15",
        reasonOfLeaving: "Career advancement into full-stack product role",
      },
    ];

    return {
      ...defaultValues,
      ...existing,
      offeredDesignation: existing.offeredDesignation || defaultValues.offeredDesignation,
      offeredDepartment: existing.offeredDepartment || defaultValues.offeredDepartment,
      offeredAnnualCtc: existing.offeredAnnualCtc || defaultValues.offeredAnnualCtc,
      joiningDate: existing.joiningDate || defaultValues.joiningDate,
      "sec-education": initialEdu,
      education: initialEdu,
      "sec-experience": initialExp,
      experience: initialExp,
    };
  });

  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(
    dossier?.lastSavedAt ? new Date(dossier.lastSavedAt).toLocaleTimeString() : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync if dossier changes externally
  useEffect(() => {
    if (dossier?.formData && Object.keys(dossier.formData).length > 0 && !isDirty) {
      setFormData((prev) => ({
        ...prev,
        ...dossier.formData,
        offeredDesignation: dossier.formData.offeredDesignation || prev.offeredDesignation,
        offeredDepartment: dossier.formData.offeredDepartment || prev.offeredDepartment,
        offeredAnnualCtc: dossier.formData.offeredAnnualCtc || prev.offeredAnnualCtc,
        joiningDate: dossier.formData.joiningDate || prev.joiningDate,
      }));
    }
  }, [dossier, isDirty]);

  // 3. Compute Active Sections from dynamic config (excluding conditionally hidden)
  const activeSections: OnboardingSectionConfig[] = useMemo(() => {
    const sections = onboardingConfig?.sections || [];
    return sections
      .filter((s) => s.enabled)
      .filter((s) => evaluateCondition(s.condition, formData))
      .sort((a, b) => a.order - b.order);
  }, [onboardingConfig, formData]);

  // Initialize or validate active section
  useEffect(() => {
    if (activeSections.length > 0) {
      if (!activeSectionId || (!activeSections.some((s) => s.id === activeSectionId) && activeSectionId !== "sec_review")) {
        setActiveSectionId(dossier?.currentSectionId || activeSections[0].id);
      }
    }
  }, [activeSections, activeSectionId, dossier]);

  // 4. Dirty tracking & beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // 5. Lifecycle states & Read-only determination
  const status = dossier?.status || "NOT_STARTED";
  const isReadOnly = status === "SUBMITTED" || status === "RESUBMITTED" || status === "APPROVED";
  const isChangesRequested = status === "CHANGES_REQUESTED";

  // Current Section Object
  const currentSection = useMemo(() => {
    if (activeSectionId === "sec_review") {
      return {
        id: "sec_review",
        title: "Review & Submission",
        description: "Review all submitted entries and execute digital signature declaration.",
        order: 999,
        enabled: true,
        fields: [],
      } as OnboardingSectionConfig;
    }
    return activeSections.find((s) => s.id === activeSectionId) || activeSections[0];
  }, [activeSections, activeSectionId]);

  const currentSectionIndex = useMemo(() => {
    if (activeSectionId === "sec_review") return activeSections.length;
    const idx = activeSections.findIndex((s) => s.id === activeSectionId);
    return idx >= 0 ? idx : 0;
  }, [activeSections, activeSectionId]);

  // 6. Calculate Overall Form Completion Percentage
  const progressPercentage = useMemo(() => {
    let totalRequired = 0;
    let completedRequired = 0;

    activeSections.forEach((sec) => {
      if (sec.documents && sec.documents.length > 0) {
        sec.documents.forEach((doc) => {
          if (doc.required) {
            totalRequired++;
            const uploaded = dossier?.uploadedDocuments?.some((u) => u.requirementId === doc.id);
            if (uploaded) completedRequired++;
          }
        });
      } else if (sec.isRepeating) {
        totalRequired++;
        const rows = formData[sec.id];
        if (Array.isArray(rows) && rows.length >= (sec.repeatingConfig?.minItems || 1)) {
          completedRequired++;
        }
      } else {
        sec.fields.forEach((f) => {
          if (f.required && evaluateCondition(f.condition, formData)) {
            totalRequired++;
            const val = formData[f.name];
            if (val !== undefined && val !== null && String(val).trim() !== "") {
              completedRequired++;
            }
          }
        });
      }
    });

    if (totalRequired === 0) return 100;
    return Math.min(100, Math.round((completedRequired / totalRequired) * 100));
  }, [activeSections, formData, dossier]);

  // 7. Handlers
  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleRepeatingChange = (sectionId: string, items: Record<string, any>[]) => {
    setFormData((prev) => ({
      ...prev,
      [sectionId]: items,
      [sectionId.replace(/-/g, "_")]: items,
      [sectionId.replace(/^sec[-_]/, "")]: items,
    }));
    setIsDirty(true);
  };

  const handleManualSaveDraft = () => {
    saveOnboardingDraft(employeeId, formData, activeSectionId);
    setIsDirty(false);
    setLastSaved(new Date().toLocaleTimeString());
    success("Draft progress saved successfully.");
  };

  const handleFileUpload = (requirementId: string, file: File) => {
    // Generate object URL for preview
    const url = URL.createObjectURL(file);
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    uploadCandidateDocument(employeeId, requirementId, {
      name: file.name,
      size: formatSize(file.size),
      type: file.type || "application/octet-stream",
      url,
    });
    success(`Document "${file.name}" uploaded successfully.`);
  };

  const handleFileRemove = (requirementId: string) => {
    removeCandidateDocument(employeeId, requirementId);
    info("Document removed.");
  };

  // 8. Section validation before advancing
  const validateSection = (section: OnboardingSectionConfig): boolean => {
    const newErrors: Record<string, string> = {};

    if (section.documents && section.documents.length > 0) {
      section.documents.forEach((doc) => {
        if (doc.required && evaluateCondition(doc.condition, formData)) {
          const uploaded = dossier?.uploadedDocuments?.some((u) => u.requirementId === doc.id);
          if (!uploaded) {
            newErrors[doc.id] = `${doc.name} is mandatory.`;
          }
        }
      });
    } else if (section.isRepeating) {
      const rows = formData[section.id];
      const minItems = section.repeatingConfig?.minItems ?? 0;
      if (minItems > 0 && (!Array.isArray(rows) || rows.length < minItems)) {
        newErrors[section.id] = `Please add at least ${minItems} ${section.repeatingConfig?.itemLabel || "entry"}.`;
      }
    } else {
      section.fields.forEach((field) => {
        if (field.required && evaluateCondition(field.condition, formData)) {
          const val = formData[field.name];
          if (val === undefined || val === null || String(val).trim() === "") {
            newErrors[field.name] = `${field.label} is required.`;
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentSection && !isReadOnly) {
      const isValid = validateSection(currentSection);
      if (!isValid) {
        error("Please fill in all required fields in this section before continuing.");
        return;
      }
    }

    // Auto save draft on step transition
    saveOnboardingDraft(employeeId, formData, activeSectionId);
    setLastSaved(new Date().toLocaleTimeString());

    if (currentSectionIndex < activeSections.length - 1) {
      setActiveSectionId(activeSections[currentSectionIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentSectionIndex === activeSections.length - 1) {
      // Advance to review
      setActiveSectionId("sec_review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePreviousStep = () => {
    if (activeSectionId === "sec_review") {
      setActiveSectionId(activeSections[activeSections.length - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentSectionIndex > 0) {
      setActiveSectionId(activeSections[currentSectionIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    try {
      submitOnboarding(employeeId, formData, dossier?.uploadedDocuments || []);
      setIsDirty(false);
      setActiveSectionId(activeSections[0]?.id || "");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/70 text-gray-900 pb-16">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GaHrmsLogo iconOnly size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-gray-950">
                  GA-HRMS
                </span>
                <span className="text-gray-300">/</span>
                <span className="text-xs font-semibold text-gray-700">
                  Candidate Onboarding
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {currentEmployee?.firstName} {currentEmployee?.lastName} • {designation?.title || "Candidate"} ({employeeId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Draft saved at {lastSaved}
              </span>
            )}

            {!isReadOnly && (
              <button
                type="button"
                onClick={handleManualSaveDraft}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isDirty) {
                  if (confirm("You have unsaved changes. Do you wish to leave?")) {
                    navigate("/employees");
                  }
                } else {
                  navigate("/employees");
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-transparent rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Lifecycle Status Banner */}
        {status === "SUBMITTED" || status === "RESUBMITTED" ? (
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-sky-950 uppercase tracking-wide">
                Dossier Under Review by HR Operations
              </h3>
              <p className="text-xs text-sky-800 leading-relaxed">
                Your onboarding dossier was submitted on{" "}
                {dossier?.submittedAt ? new Date(dossier.submittedAt).toLocaleDateString() : "recently"}{" "}
                and is currently undergoing background and statutory verification. All sections are read-only while under review.
              </p>
            </div>
          </div>
        ) : isChangesRequested ? (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-amber-950 uppercase tracking-wide">
                Revision Requested by HR Operations
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                HR has requested updates to your onboarding dossier.
              </p>
              {dossier?.reviewNotes && (
                <div className="mt-2 p-3 bg-white border border-amber-200 rounded-lg text-xs font-medium text-amber-950">
                  <span className="font-semibold block text-[11px] text-amber-700 uppercase tracking-wider mb-0.5">
                    HR Review Comments:
                  </span>
                  "{dossier.reviewNotes}"
                </div>
              )}
              <p className="text-[11px] text-amber-800 pt-1">
                Please make the required changes across the sections and submit your updated dossier via the Review section.
              </p>
            </div>
          </div>
        ) : status === "APPROVED" ? (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-emerald-950 uppercase tracking-wide">
                  Onboarding Approved • Profile Active
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Congratulations! All submitted documents and personal details have been approved by HR Operations. Your official employee ID is <strong>{employeeId}</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0"
            >
              Go to Portal
            </button>
          </div>
        ) : null}

        {/* Unified Stepper & Completion Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
          {/* Progress Header */}
          <div className="px-5 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Dossier Completion</span>
                <span className="text-[11px] text-gray-400">•</span>
                <span className="text-[11px] text-gray-500">
                  Step {activeSectionId === "sec_review" ? activeSections.length + 1 : currentSectionIndex + 1} of {activeSections.length + 1}
                </span>
              </div>
              <span className="font-bold text-gray-950 text-xs bg-gray-100 px-2 py-0.5 rounded-md">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gray-950 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Section Navigation Tabs with Clean Scroll */}
          <div className="px-4 py-2.5 overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <nav className="flex items-center gap-1.5 min-w-max">
              {activeSections.map((sec, idx) => {
                const isActive = activeSectionId === sec.id;
                const isPast = currentSectionIndex > idx;

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setActiveSectionId(sec.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-gray-950 text-white shadow-xs font-semibold"
                        : isPast
                        ? "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive
                          ? "bg-white text-gray-950"
                          : isPast
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span>{sec.title}</span>
                  </button>
                );
              })}

              {/* Synthetic Final Review Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveSectionId("sec_review");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSectionId === "sec_review"
                    ? "bg-gray-950 text-white shadow-xs font-semibold"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Review & Submit</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Section Body Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          {/* Section Header */}
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              {currentSection.title}
            </h2>
            {currentSection.description && (
              <p className="text-xs text-gray-500 mt-1">{currentSection.description}</p>
            )}
          </div>

          {/* Dynamic Content Rendering Based on Section Type */}
          {activeSectionId === "sec_review" ? (
            <ConsolidatedReviewSection
              sections={activeSections}
              formData={formData}
              uploadedDocs={dossier?.uploadedDocuments || []}
              onNavigateToSection={(secId) => {
                setActiveSectionId(secId);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onSubmit={handleFinalSubmit}
              isSubmitting={isSubmitting}
              isResubmission={isChangesRequested}
            />
          ) : currentSection.isRepeating ? (
            <RepeatingGroupRenderer
              section={currentSection}
              items={
                (Array.isArray(formData[currentSection.id]) && formData[currentSection.id].length > 0)
                  ? formData[currentSection.id]
                  : (Array.isArray(formData[currentSection.id.replace(/-/g, "_")]) && formData[currentSection.id.replace(/-/g, "_")].length > 0)
                  ? formData[currentSection.id.replace(/-/g, "_")]
                  : (Array.isArray(formData[currentSection.id.replace(/^sec[-_]/, "")]) && formData[currentSection.id.replace(/^sec[-_]/, "")].length > 0)
                  ? formData[currentSection.id.replace(/^sec[-_]/, "")]
                  : []
              }
              onChange={(items) => handleRepeatingChange(currentSection.id, items)}
              errors={errors}
              disabled={isReadOnly}
            />
          ) : currentSection.documents && currentSection.documents.length > 0 ? (
            <DocumentUploadSection
              requirements={currentSection.documents}
              uploadedDocs={dossier?.uploadedDocuments || []}
              onUpload={handleFileUpload}
              onRemove={handleFileRemove}
              disabled={isReadOnly}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSection.fields
                .filter((f) => evaluateCondition(f.condition, formData))
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div
                    key={field.id}
                    className={
                      field.type === "TEXTAREA" || field.type === "CHECKBOX"
                        ? "md:col-span-2"
                        : ""
                    }
                  >
                    <DynamicFieldRenderer
                      field={field}
                      value={formData[field.name]}
                      onChange={(val) => handleFieldChange(field.name, val)}
                      error={errors[field.name]}
                      disabled={isReadOnly}
                    />
                  </div>
                ))}
            </div>
          )}

          {/* Navigation Controls */}
          {activeSectionId !== "sec_review" && (
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              {currentSectionIndex > 0 ? (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Section</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-gray-950 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <span>
                  {currentSectionIndex === activeSections.length - 1
                    ? "Proceed to Review"
                    : "Save & Continue"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
