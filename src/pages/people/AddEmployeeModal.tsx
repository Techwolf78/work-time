import React, { useState, useMemo } from "react";
import {
  User,
  Users,
  Briefcase,
  ShieldCheck,
  CreditCard,
  Coins,
  FileCheck2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  Building2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Check,
  AlertCircle,
  Calculator,
  HeartHandshake,
  GraduationCap,
  Share2,
  FileSignature,
  Download,
  Eye,
  CheckSquare,
  Send,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { useHrms } from "../../lib/hrmsContext";
import { EmploymentStatus, EmploymentType, Gender } from "../../types/hrms";
import { formatINR } from "../../lib/utils";
import { CtcCalculatorModal, BonusFrequency } from "./CtcCalculatorModal";

export interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EducationRow {
  id: string;
  educationClass: string;
  schoolUniversity: string;
  boardStudyField: string;
  year: string;
  grade?: string;
}

interface WorkExperienceRow {
  id: string;
  experienceLevel: string;
  organisationName: string;
  from: string;
  to: string;
  designation: string;
  reasonOfLeaving: string;
}

interface DocumentItem {
  id: string;
  title: string;
  required: boolean;
  fileName?: string;
  status: "PENDING" | "UPLOADED" | "VERIFIED";
  category: "IDENTITY" | "ACADEMIC" | "EXPERIENCE" | "PAYROLL" | "COMPANY_POLICY";
}

export function AddEmployeeModal({ isOpen, onClose }: AddEmployeeModalProps) {
  const { departments, designations, branches, employees, shifts, addEmployee, uploadBatchDocuments } = useHrms();
  
  // Wizard navigation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCtcCalculatorOpen, setIsCtcCalculatorOpen] = useState<boolean>(false);

  // Mode selection: Quick Invite vs Full Assisted
  const [onboardingMode, setOnboardingMode] = useState<"QUICK_INVITE" | "FULL_ASSISTED">("QUICK_INVITE");

  // Quick Invite State
  const [quickFirstName, setQuickFirstName] = useState("Ramesh");
  const [quickLastName, setQuickLastName] = useState("Patil");
  const [quickPersonalEmail, setQuickPersonalEmail] = useState("ramesh.patil.personal@gmail.com");
  const [quickWorkEmail, setQuickWorkEmail] = useState("ramesh.patil@ga-hrms.io");
  const [quickPhone, setQuickPhone] = useState("+91 98201 12345");
  const [quickGender, setQuickGender] = useState<Gender>("MALE");
  const [quickDeptId, setQuickDeptId] = useState(departments[0]?.id || "dept-eng");
  const [quickDesigId, setQuickDesigId] = useState(designations[0]?.id || "desig-sde-2");
  const [quickBranchId, setQuickBranchId] = useState(branches[0]?.id || "branch-pune");
  const [quickManagerId, setQuickManagerId] = useState(employees[0]?.id || "EMP-1003");
  const [quickJoiningDate, setQuickJoiningDate] = useState("2026-11-01");
  const [quickEmpType, setQuickEmpType] = useState<EmploymentType>("FULL_TIME");
  const [quickShiftId, setQuickShiftId] = useState("shift-gen");
  const [quickAnnualCtc, setQuickAnnualCtc] = useState<number>(1020000);
  const [inviteSuccessData, setInviteSuccessData] = useState<{
    id: string;
    code: string;
    name: string;
    email: string;
    personalEmail: string;
    tempPass: string;
    inviteUrl: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleQuickInviteSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickFirstName.trim() || !quickLastName.trim() || !quickPersonalEmail.trim()) {
      alert("Please provide the candidate's First Name, Last Name, and Personal Email.");
      return;
    }

    const generatedWorkEmail = quickWorkEmail.trim() || `${quickFirstName.toLowerCase()}.${quickLastName.toLowerCase()}@ga-hrms.io`;
    const tempPassword = `Welcome@${new Date().getFullYear()}`;
    const annual = Number(quickAnnualCtc) || 1020000;
    const monthly = Math.round(annual / 12);

    const newEmp = addEmployee({
      employeeCode: "",
      firstName: quickFirstName.trim(),
      lastName: quickLastName.trim(),
      email: generatedWorkEmail,
      personalEmail: quickPersonalEmail.trim(),
      phone: quickPhone.trim() || "+91 98200 11223",
      gender: quickGender,
      dob: "1998-05-15",
      avatar: quickGender === "FEMALE"
        ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      departmentId: quickDeptId,
      designationId: quickDesigId,
      branchId: quickBranchId,
      managerId: quickManagerId || undefined,
      joiningDate: quickJoiningDate,
      employmentType: quickEmpType,
      shiftId: quickShiftId,
      status: "PROBATION",
      onboardingCompleted: false,
      onboardingStatus: "INVITED",
      pan: "",
      aadhaar: "",
      uan: "",
      esicNumber: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      monthlyCtc: monthly,
      annualCtc: annual,
      offerLetterAccepted: false,
      policiesAccepted: false,
    });

    setInviteSuccessData({
      id: newEmp.id,
      code: newEmp.employeeCode,
      name: `${newEmp.firstName} ${newEmp.lastName}`,
      email: newEmp.email,
      personalEmail: newEmp.personalEmail || quickPersonalEmail,
      tempPass: tempPassword,
      inviteUrl: `${window.location.origin}/onboarding`,
    });
  };

  const handleCopyInviteMessage = () => {
    if (!inviteSuccessData) return;
    const msg = `Hello ${inviteSuccessData.name},

Your employee account has been created for GA-HRMS. Please log in to complete your onboarding details.

Portal URL: ${inviteSuccessData.inviteUrl}
Login Email: ${inviteSuccessData.email}
Temporary Password: ${inviteSuccessData.tempPass}

Regards,
HR Operations`;

    navigator.clipboard.writeText(msg);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // --- STEP 1: OFFER ACCEPTANCE STATE (for Full Assisted mode) ---
  const [offerAccepted, setOfferAccepted] = useState<boolean>(true);
  const [offerDeclined, setOfferDeclined] = useState<boolean>(false);

  // --- STEP 2: PERSONAL & STATUTORY DETAILS ---
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("1996-05-15");
  const [gender, setGender] = useState<Gender>("MALE");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [personalMobile, setPersonalMobile] = useState("+91 98201 12345");
  const [personalEmail, setPersonalEmail] = useState("ramesh.patil.personal@gmail.com");
  const [workEmail, setWorkEmail] = useState("ramesh.patil@ga-hrms.io");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [emergencyMobile, setEmergencyMobile] = useState("+91 98201 99999");
  const [emergencyName, setEmergencyName] = useState("Suresh Patil");
  const [emergencyRelation, setEmergencyRelation] = useState("Father");
  
  // Statutory (Indian Compliance)
  const [pan, setPan] = useState("ABCDE1234F");
  const [aadhaar, setAadhaar] = useState("4512 7890 2345");
  const [uan, setUan] = useState("100912457899");
  const [esicNumber, setEsicNumber] = useState("3100456799");

  // Address
  const [presentStreet, setPresentStreet] = useState("Flat 402, Green Meadows, Baner Road");
  const [presentCity, setPresentCity] = useState("Pune");
  const [presentState, setPresentState] = useState("Maharashtra");
  const [presentPincode, setPresentPincode] = useState("411045");
  
  const [sameAsPresentAddress, setSameAsPresentAddress] = useState(true);
  const [permanentStreet, setPermanentStreet] = useState("Flat 402, Green Meadows, Baner Road");
  const [permanentCity, setPermanentCity] = useState("Pune");
  const [permanentState, setPermanentState] = useState("Maharashtra");
  const [permanentPincode, setPermanentPincode] = useState("411045");

  // --- STEP 3: FAMILY DETAILS ---
  const [fathersName, setFathersName] = useState("Suresh Patil");
  const [mothersName, setMothersName] = useState("Sunita Patil");
  const [fathersDob, setFathersDob] = useState("1968-04-12");
  const [mothersDob, setMothersDob] = useState("1971-08-24");
  const [fathersAge, setFathersAge] = useState<string>("58");
  const [mothersAge, setMothersAge] = useState<string>("55");
  const [spouseName, setSpouseName] = useState("");
  const [spouseDob, setSpouseDob] = useState("");
  const [firstChildName, setFirstChildName] = useState("");
  const [firstChildDob, setFirstChildDob] = useState("");
  const [secondChildName, setSecondChildName] = useState("");
  const [secondChildDob, setSecondChildDob] = useState("");

  // --- STEP 4: EDUCATION DETAILS ---
  const [educationList, setEducationList] = useState<EducationRow[]>([
    {
      id: "edu-1",
      educationClass: "Bachelor's Degree",
      schoolUniversity: "Pune Institute of Computer Technology (PICT)",
      boardStudyField: "Computer Science & Engineering",
      year: "2018",
      grade: "8.8 CGPA",
    },
    {
      id: "edu-2",
      educationClass: "12th Standard",
      schoolUniversity: "Fergusson College Pune",
      boardStudyField: "Science (PCMB)",
      year: "2014",
      grade: "89.4%",
    },
    {
      id: "edu-3",
      educationClass: "10th Standard",
      schoolUniversity: "St. Vincent High School",
      boardStudyField: "General Secondary",
      year: "2012",
      grade: "92.0%",
    },
  ]);

  // Form to add single education
  const [newEduClass, setNewEduClass] = useState("Master's Degree");
  const [newEduSchool, setNewEduSchool] = useState("");
  const [newEduField, setNewEduField] = useState("");
  const [newEduYear, setNewEduYear] = useState("2020");

  const handleAddEducation = () => {
    if (!newEduSchool || !newEduField) {
      alert("Please enter School/University and Study Field.");
      return;
    }
    const newEntry: EducationRow = {
      id: `edu-${Date.now()}`,
      educationClass: newEduClass,
      schoolUniversity: newEduSchool,
      boardStudyField: newEduField,
      year: newEduYear,
    };
    setEducationList([...educationList, newEntry]);
    setNewEduSchool("");
    setNewEduField("");
  };

  const handleRemoveEducation = (id: string) => {
    setEducationList(educationList.filter((e) => e.id !== id));
  };

  // --- STEP 5: BANK DETAILS ---
  const [ifscCode, setIfscCode] = useState("HDFC0000052");
  const [bankAccountHolder, setBankAccountHolder] = useState("Ramesh Suresh Patil");
  const [bankName, setBankName] = useState("HDFC Bank Ltd.");
  const [bankAccountNo, setBankAccountNo] = useState("50100456789123");
  const [confirmAccountNo, setConfirmAccountNo] = useState("50100456789123");
  const [branchName, setBranchName] = useState("Shivaji Nagar Branch, Pune");
  const [nomineeName, setNomineeName] = useState("Sunita Patil");
  const [nomineeRelationship, setNomineeRelationship] = useState("Mother");

  // --- STEP 6: SOCIAL DETAILS ---
  const [linkedinId, setLinkedinId] = useState("https://linkedin.com/in/ramesh-patil-tech");
  const [instagramId, setInstagramId] = useState("@ramesh_codes");
  const [facebookId, setFacebookId] = useState("");
  const [twitterId, setTwitterId] = useState("@ramesh_p");
  const [portfolioUrl, setPortfolioUrl] = useState("https://rameshpatil.dev");

  // --- STEP 7: REFERENCE DETAILS ---
  const [ref1Name, setRef1Name] = useState("Vikram Malhotra");
  const [ref1Contact, setRef1Contact] = useState("+91 98450 11223");
  const [ref1Email, setRef1Email] = useState("v.malhotra@previousco.com");
  const [ref2Name, setRef2Name] = useState("Pooja Kulkarni");
  const [ref2Contact, setRef2Contact] = useState("+91 98220 44556");
  const [ref2Email, setRef2Email] = useState("pooja.k@techcorp.in");

  // --- STEP 8: WORK EXPERIENCE DETAILS ---
  const [workExpList, setWorkExpList] = useState<WorkExperienceRow[]>([
    {
      id: "exp-1",
      experienceLevel: "3-5 years",
      organisationName: "TechCorp Solutions India Pvt Ltd",
      from: "2021-06-01",
      to: "2026-09-15",
      designation: "Software Engineer",
      reasonOfLeaving: "Better Career Opportunity and Growth",
    },
    {
      id: "exp-2",
      experienceLevel: "1-3 years",
      organisationName: "InnoSoft Labs",
      from: "2018-07-15",
      to: "2021-05-30",
      designation: "Associate Developer",
      reasonOfLeaving: "Relocation to Pune HQ",
    },
  ]);

  const [newExpLevel, setNewExpLevel] = useState("1-3 years");
  const [newExpOrg, setNewExpOrg] = useState("");
  const [newExpFrom, setNewExpFrom] = useState("");
  const [newExpTo, setNewExpTo] = useState("");
  const [newExpDesig, setNewExpDesig] = useState("");
  const [newExpReason, setNewExpReason] = useState("");

  const handleAddExperience = () => {
    if (!newExpOrg || !newExpDesig) {
      alert("Please enter Organisation Name and Designation.");
      return;
    }
    const newEntry: WorkExperienceRow = {
      id: `exp-${Date.now()}`,
      experienceLevel: newExpLevel,
      organisationName: newExpOrg,
      from: newExpFrom || "2020-01-01",
      to: newExpTo || "2023-01-01",
      designation: newExpDesig,
      reasonOfLeaving: newExpReason || "Career Growth",
    };
    setWorkExpList([...workExpList, newEntry]);
    setNewExpOrg("");
    setNewExpDesig("");
    setNewExpReason("");
  };

  const handleRemoveExperience = (id: string) => {
    setWorkExpList(workExpList.filter((e) => e.id !== id));
  };

  // --- STEP 9: UPLOAD DOCUMENTS MATRIX ---
  const [documentItems, setDocumentItems] = useState<DocumentItem[]>([
    { id: "doc-1", title: "Aadhaar Card Front", required: true, fileName: "Aadhaar_Card_Front.pdf", status: "VERIFIED", category: "IDENTITY" },
    { id: "doc-2", title: "Aadhaar Card Back", required: true, fileName: "Aadhaar_Card_Back.pdf", status: "VERIFIED", category: "IDENTITY" },
    { id: "doc-3", title: "Passport Front", required: false, fileName: undefined, status: "PENDING", category: "IDENTITY" },
    { id: "doc-4", title: "Passport Back", required: false, fileName: undefined, status: "PENDING", category: "IDENTITY" },
    { id: "doc-5", title: "Pancard", required: true, fileName: "PAN_ABCDE1234F.pdf", status: "VERIFIED", category: "IDENTITY" },
    { id: "doc-6", title: "Driving License", required: false, fileName: undefined, status: "PENDING", category: "IDENTITY" },
    { id: "doc-7", title: "Resume", required: true, fileName: "Ramesh_Patil_Resume_2026.pdf", status: "VERIFIED", category: "EXPERIENCE" },
    { id: "doc-8", title: "Passport Size Photo", required: true, fileName: "Photo_Passport_Size.jpg", status: "VERIFIED", category: "IDENTITY" },
    { id: "doc-9", title: "10th Marksheet", required: false, fileName: "SSC_10th_Marksheet.pdf", status: "UPLOADED", category: "ACADEMIC" },
    { id: "doc-10", title: "12th Marksheet", required: false, fileName: "HSC_12th_Marksheet.pdf", status: "UPLOADED", category: "ACADEMIC" },
    { id: "doc-11", title: "Graduation Marksheets & Degree Certificate", required: true, fileName: "BTech_Degree_PICT.pdf", status: "VERIFIED", category: "ACADEMIC" },
    { id: "doc-12", title: "Post Graduation Marksheets & Degree Certificate", required: false, fileName: undefined, status: "PENDING", category: "ACADEMIC" },
    { id: "doc-13", title: "Previous Employer Relieving Letter & Experience", required: true, fileName: "TechCorp_Relieving_Letter.pdf", status: "VERIFIED", category: "EXPERIENCE" },
    { id: "doc-14", title: "Signed Appointment & Offer Letter", required: true, fileName: "Signed_Offer_Letter_Gryphon.pdf", status: "VERIFIED", category: "COMPANY_POLICY" },
  ]);

  const handleSimulateUpload = (id: string) => {
    setDocumentItems((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "UPLOADED",
              fileName: `${d.title.replace(/\s+/g, "_")}_Uploaded.pdf`,
            }
          : d
      )
    );
  };

  const handleUploadAllMockDocs = () => {
    setDocumentItems((prev) =>
      prev.map((d) => ({
        ...d,
        status: "VERIFIED",
        fileName: d.fileName || `${d.title.replace(/\s+/g, "_")}_Doc.pdf`,
      }))
    );
  };

  // --- STEP 10: COMPANY POLICIES STATE ---
  const [openPolicyAccordion, setOpenPolicyAccordion] = useState<string>("ip");
  const [ipAccepted, setIpAccepted] = useState(true);
  const [allPoliciesAccepted, setAllPoliciesAccepted] = useState(true);
  const [digitalSignature, setDigitalSignature] = useState("Ramesh Suresh Patil");

  // --- EMPLOYMENT & ORG PLACEMENT (Database bindings) ---
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || "dept-eng");
  const [designationId, setDesignationId] = useState(designations[0]?.id || "desig-sr-sde");
  const [branchId, setBranchId] = useState(branches[0]?.id || "branch-pune");
  const [managerId, setManagerId] = useState(employees[0]?.id || "EMP-1001");
  const [joiningDate, setJoiningDate] = useState("2026-10-06");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("FULL_TIME");
  const [shiftId, setShiftId] = useState(shifts[0]?.id || "shift-gen");
  const [workMode, setWorkMode] = useState<"ON_SITE" | "HYBRID" | "REMOTE">("HYBRID");
  const [probationMonths, setProbationMonths] = useState<number>(3);
  const [noticePeriodDays, setNoticePeriodDays] = useState<number>(60);
  const [monthlyCtc, setMonthlyCtc] = useState<number>(125000);
  const [performanceBonusAmount, setPerformanceBonusAmount] = useState<number>(0);
  const [performanceBonusFrequency, setPerformanceBonusFrequency] = useState<BonusFrequency>("QUARTERLY");

  // Annualized bonus and total CTC calculations
  const annualPerformanceBonus = useMemo(() => {
    if (!performanceBonusAmount || performanceBonusAmount <= 0) return 0;
    switch (performanceBonusFrequency) {
      case "MONTHLY":
        return performanceBonusAmount * 12;
      case "QUARTERLY":
        return performanceBonusAmount * 4;
      case "HALF_YEARLY":
        return performanceBonusAmount * 2;
      case "YEARLY":
        return performanceBonusAmount;
      default:
        return 0;
    }
  }, [performanceBonusAmount, performanceBonusFrequency]);

  // Employer PF contribution (12% of Basic, capped at 25,000 ceiling)
  const annualEmployerPf = useMemo(() => {
    const basicMonthly = Math.round(monthlyCtc * 0.5);
    const pfBase = Math.min(basicMonthly, 25000);
    return Math.round(pfBase * 0.12) * 12;
  }, [monthlyCtc]);

  const totalAnnualCtc = (monthlyCtc * 12) + annualEmployerPf + annualPerformanceBonus;

  // Stepper metadata matching the 10 screenshots!
  const steps = [
    { num: 1, title: "Accept Offer Letter", short: "Offer", icon: FileCheck2 },
    { num: 2, title: "Personal Details", short: "Personal", icon: User },
    { num: 3, title: "Family Details", short: "Family", icon: Users },
    { num: 4, title: "Education Details", short: "Education", icon: GraduationCap },
    { num: 5, title: "Bank Details", short: "Bank", icon: CreditCard },
    { num: 6, title: "Social Details", short: "Social", icon: Share2 },
    { num: 7, title: "Reference Details", short: "Reference", icon: HeartHandshake },
    { num: 8, title: "Work Experience", short: "Experience", icon: Briefcase },
    { num: 9, title: "Upload Documents", short: "Documents", icon: Upload },
    { num: 10, title: "Company Policies", short: "Policy", icon: ShieldCheck },
  ];

  // Age calculation
  const calculatedAge = useMemo(() => {
    if (!dob) return 28;
    const diff = Date.now() - new Date(dob).getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970) || 28;
  }, [dob]);

  // Sync permanent address if checkbox checked
  const handleToggleSameAddress = (checked: boolean) => {
    setSameAsPresentAddress(checked);
    if (checked) {
      setPermanentStreet(presentStreet);
      setPermanentCity(presentCity);
      setPermanentState(presentState);
      setPermanentPincode(presentPincode);
    }
  };

  // Pre-fill Preset Helper
  const loadPreset = (preset: "tech" | "design") => {
    if (preset === "tech") {
      setFirstName("Ramesh");
      setLastName("Patil");
      setPersonalEmail("ramesh.patil.pune@gmail.com");
      setWorkEmail("ramesh.patil@ga-hrms.io");
      setPersonalMobile("+91 98201 12345");
      setGender("MALE");
      setDob("1996-05-15");
      setMonthlyCtc(150000); // 18 LPA
      setPerformanceBonusAmount(0);
      setPerformanceBonusFrequency("QUARTERLY");
      setDepartmentId(departments.find((d) => d.name.includes("Eng"))?.id || departments[0]?.id);
      setDesignationId(designations.find((des) => des.title.includes("SDE") || des.title.includes("Engineer"))?.id || designations[0]?.id);
      setPan("ABCDE1234F");
      setAadhaar("4512 7890 2345");
      setUan("100912457899");
      setEsicNumber("3100456799");
      setBankName("HDFC Bank Ltd.");
      setBankAccountNo("50100456789123");
      setConfirmAccountNo("50100456789123");
      setIfscCode("HDFC0000052");
      setDigitalSignature("Ramesh Suresh Patil");
      handleUploadAllMockDocs();
    } else {
      setFirstName("Priya");
      setLastName("Sharma");
      setPersonalEmail("priya.sharma.design@gmail.com");
      setWorkEmail("priya.sharma@ga-hrms.io");
      setPersonalMobile("+91 98112 34567");
      setGender("FEMALE");
      setDob("1995-11-20");
      setMonthlyCtc(165000); // 19.8 LPA
      setPerformanceBonusAmount(0);
      setPerformanceBonusFrequency("QUARTERLY");
      setDepartmentId(departments.find((d) => d.name.includes("Product"))?.id || departments[0]?.id);
      setDesignationId(designations.find((des) => des.title.includes("Product") || des.title.includes("Lead"))?.id || designations[0]?.id);
      setPan("BNMPS5432K");
      setAadhaar("8945 1209 7623");
      setUan("100845123908");
      setEsicNumber("3100892341");
      setBankName("ICICI Bank Ltd.");
      setBankAccountNo("001801543290");
      setConfirmAccountNo("001801543290");
      setIfscCode("ICIC0000018");
      setDigitalSignature("Priya Sharma");
      handleUploadAllMockDocs();
    }
  };

  // Finish Onboarding & Register in HRMS
  const handleFinish = () => {
    if (!firstName || !lastName || !personalEmail) {
      alert("Please provide the candidate's first name, last name, and email.");
      setCurrentStep(2);
      return;
    }

    if (!offerAccepted) {
      alert("The candidate must accept the offer letter to complete enterprise onboarding.");
      setCurrentStep(1);
      return;
    }

    if (!allPoliciesAccepted) {
      alert("Company policies must be formally accepted.");
      setCurrentStep(10);
      return;
    }

    // Call addEmployee into system store
    const newEmp = addEmployee({
      employeeCode: "",
      firstName,
      lastName,
      email: workEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ga-hrms.io`,
      phone: personalMobile || "+91 98200 00000",
      gender,
      dob,
      avatar:
        gender === "FEMALE"
          ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      departmentId,
      designationId,
      branchId,
      managerId,
      joiningDate,
      employmentType,
      status: "ACTIVE" as EmploymentStatus,
      shiftId,
      pan,
      aadhaar,
      uan,
      esicNumber,
      bankName,
      accountNumber: bankAccountNo,
      ifscCode,
      accountHolderName: bankAccountHolder || `${firstName} ${lastName}`,
      monthlyCtc: Number(monthlyCtc),
      annualCtc: totalAnnualCtc,
      performanceBonusAmount: performanceBonusAmount > 0 ? performanceBonusAmount : undefined,
      performanceBonusFrequency: performanceBonusAmount > 0 ? performanceBonusFrequency : undefined,
      middleName,
      personalEmail,
      alternatePhone: emergencyMobile,
      bloodGroup,
      maritalStatus,
      nationality: "Indian",
      presentAddress: presentStreet,
      permanentAddress: permanentStreet,
      presentCity,
      permanentCity,
      presentState,
      permanentState,
      presentPincode,
      permanentPincode,
      emergencyContactName: emergencyName,
      emergencyContactRelation: emergencyRelation,
      emergencyContactPhone: emergencyMobile,
      workMode,
      probationMonths,
      noticePeriodDays,
      nomineeName,
      nomineeRelationship,
      branchName,
      familyDetails: {
        fathersName,
        mothersName,
        fathersDob,
        mothersDob,
        fathersAge: Number(fathersAge) || 58,
        mothersAge: Number(mothersAge) || 55,
        spouseName,
        spouseDob,
        firstChildName,
        firstChildDob,
        secondChildName,
        secondChildDob,
      },
      educationDetails: educationList,
      workExperienceDetails: workExpList,
      socialDetails: {
        linkedin: linkedinId,
        instagram: instagramId,
        facebook: facebookId,
        twitter: twitterId,
        portfolio: portfolioUrl,
      },
      firstReference: {
        name: ref1Name,
        contactNo: ref1Contact,
        email: ref1Email,
      },
      secondReference: {
        name: ref2Name,
        contactNo: ref2Contact,
        email: ref2Email,
      },
      policiesAccepted: allPoliciesAccepted,
      offerLetterAccepted: offerAccepted,
      onboardingCompleted: true,
    });

    // Upload verified documents to Document repository in batch (silent to prevent toast flooding)
    const uploadedDocs = documentItems.filter((d) => d.status === "VERIFIED" || d.status === "UPLOADED");
    if (uploadedDocs.length > 0) {
      uploadBatchDocuments(
        uploadedDocs.map((doc) => ({
          employeeId: newEmp.id,
          title: doc.title,
          category: doc.category,
          fileSize: "1.2 MB",
          fileType: "PDF",
        }))
      );
    }

    onClose();
  };

  const progressPercent = Math.round((currentStep / steps.length) * 100);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={onboardingMode === "QUICK_INVITE" ? "2xl" : isFullscreen ? "full" : "3xl"}
        bodyClassName="p-0 overflow-hidden flex flex-col"
        containerClassName="p-2 sm:p-3"
        className={onboardingMode === "QUICK_INVITE" ? "max-h-[92vh] my-auto transition-all" : "h-[94vh] max-h-[96vh] my-0.5 sm:my-1 transition-all duration-300"}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top Wizard Navigation Bar with Mode Switcher */}
          <div className="bg-white text-gray-950 px-4 py-2.5 flex items-center justify-between gap-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mode Switch Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setOnboardingMode("QUICK_INVITE")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    onboardingMode === "QUICK_INVITE"
                      ? "bg-white text-gray-950 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-gray-600" />
                  <span>Send Invite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOnboardingMode("FULL_ASSISTED")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    onboardingMode === "FULL_ASSISTED"
                      ? "bg-white text-gray-950 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-gray-600" />
                  <span>Detailed Entry</span>
                </button>
              </div>
            </div>

            {/* Quick Actions & Utilities */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onboardingMode === "FULL_ASSISTED" && (
                <div className="hidden lg:flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md p-0.5 text-xs">
                  <span className="text-gray-400 px-1 text-[10px] font-medium flex items-center gap-0.5">
                    Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => loadPreset("tech")}
                    className="px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 shadow-2xs transition-colors text-[11px] font-medium"
                  >
                    Sr. Eng
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset("design")}
                    className="px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 shadow-2xs transition-colors text-[11px] font-medium"
                  >
                    Lead
                  </button>
                </div>
              )}

              {/* CTC Calculator Launcher Button */}
              <button
                type="button"
                onClick={() => setIsCtcCalculatorOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold shadow-2xs transition-colors"
              >
                <Calculator className="w-3 h-3 text-gray-600" />
                <span>CTC Calc</span>
              </button>

              {onboardingMode === "FULL_ASSISTED" && (
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-gray-400 hover:text-gray-950 p-1 rounded-md hover:bg-gray-100 transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-950 p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {onboardingMode === "QUICK_INVITE" ? (
            inviteSuccessData ? (
              // SUCCESS VIEW: Invite Dispatched
              <div className="p-8 text-center space-y-5 flex-1 overflow-y-auto">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <Badge variant="success" size="sm" dot>
                    Invite Generated
                  </Badge>
                  <h3 className="text-lg font-bold text-gray-950">
                    Onboarding Invitation Ready
                  </h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    An onboarding account has been generated for {inviteSuccessData.name}. Share the credentials below with the employee to complete their profile.
                  </p>
                </div>

                {/* Credentials Card */}
                <div className="max-w-md mx-auto bg-gray-50 p-4 rounded-xl border border-gray-200 text-left text-xs space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-500">Employee ID:</span>
                    <span className="font-mono font-bold text-gray-950">{inviteSuccessData.code}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Work Email:</span>
                    <span className="font-mono font-medium text-gray-950">{inviteSuccessData.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Personal Email:</span>
                    <span className="font-mono text-gray-700">{inviteSuccessData.personalEmail}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Temporary Password:</span>
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-300 text-gray-950">
                      {inviteSuccessData.tempPass}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Portal Link:</span>
                    <span className="font-mono text-gray-700 truncate max-w-[200px]">{inviteSuccessData.inviteUrl}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleCopyInviteMessage}
                    variant="outline"
                    size="md"
                    leftIcon={isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  >
                    {isCopied ? "Credentials Copied" : "Copy Credentials"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setInviteSuccessData(null);
                      onClose();
                    }}
                    variant="primary"
                    size="md"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              // FORM VIEW: Quick Invite Form
              <form onSubmit={handleQuickInviteSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column: Personal Contact */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-700" />
                      <span>Candidate Information</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="First Name"
                        value={quickFirstName}
                        onChange={(e) => setQuickFirstName(e.target.value)}
                        placeholder="e.g. Ramesh"
                        required
                      />
                      <Input
                        label="Last Name"
                        value={quickLastName}
                        onChange={(e) => setQuickLastName(e.target.value)}
                        placeholder="e.g. Patil"
                        required
                      />
                    </div>

                    <Input
                      label="Personal Email (For Invite Delivery)"
                      type="email"
                      value={quickPersonalEmail}
                      onChange={(e) => setQuickPersonalEmail(e.target.value)}
                      placeholder="candidate@gmail.com"
                      required
                    />

                    <Input
                      label="Official Work Email (Generated/Custom)"
                      type="email"
                      value={quickWorkEmail}
                      onChange={(e) => setQuickWorkEmail(e.target.value)}
                      placeholder="ramesh.patil@ga-hrms.io"
                      required
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Mobile Number"
                        value={quickPhone}
                        onChange={(e) => setQuickPhone(e.target.value)}
                        placeholder="+91 98200 00000"
                        required
                      />
                      <Select
                        label="Gender"
                        value={quickGender}
                        onChange={(e) => setQuickGender(e.target.value as Gender)}
                        options={[
                          { value: "MALE", label: "Male" },
                          { value: "FEMALE", label: "Female" },
                          { value: "OTHER", label: "Other" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Right Column: Job Placement & Compensation */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-gray-700" />
                      <span>Job Placement & Compensation</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        label="Department"
                        value={quickDeptId}
                        onChange={(e) => setQuickDeptId(e.target.value)}
                        options={departments.map((d) => ({ value: d.id, label: d.name }))}
                      />
                      <Select
                        label="Designation"
                        value={quickDesigId}
                        onChange={(e) => setQuickDesigId(e.target.value)}
                        options={designations.map((d) => ({ value: d.id, label: d.title }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        label="Branch / Office"
                        value={quickBranchId}
                        onChange={(e) => setQuickBranchId(e.target.value)}
                        options={branches.map((b) => ({ value: b.id, label: `${b.name} (${b.city})` }))}
                      />
                      <Select
                        label="Reporting Manager"
                        value={quickManagerId}
                        onChange={(e) => setQuickManagerId(e.target.value)}
                        options={employees.slice(0, 15).map((e) => ({
                          value: e.id,
                          label: `${e.firstName} ${e.lastName}`,
                        }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Joining Date"
                        type="date"
                        value={quickJoiningDate}
                        onChange={(e) => setQuickJoiningDate(e.target.value)}
                        required
                      />
                      <Select
                        label="Employment Type"
                        value={quickEmpType}
                        onChange={(e) => setQuickEmpType(e.target.value as EmploymentType)}
                        options={[
                          { value: "FULL_TIME", label: "Full Time Permanent" },
                          { value: "CONTRACT", label: "Contract" },
                          { value: "INTERN", label: "Intern" },
                        ]}
                      />
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-900">Offered Annual CTC (INR)</label>
                        <button
                          type="button"
                          onClick={() => setIsCtcCalculatorOpen(true)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Calculate Breakdown</span>
                        </button>
                      </div>
                      <Input
                        type="number"
                        value={quickAnnualCtc}
                        onChange={(e) => setQuickAnnualCtc(Number(e.target.value))}
                        placeholder="1020000"
                        required
                      />
                      <div className="text-[11px] text-gray-500 flex justify-between pt-0.5">
                        <span>Gross Monthly Estimate:</span>
                        <span className="font-bold text-gray-950">{formatINR(Math.round(quickAnnualCtc / 12))} / month</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <Button type="button" onClick={onClose} variant="outline" size="md">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    Create Employee & Send Onboarding Invite
                  </Button>
                </div>
              </form>
            )
          ) : (
            // Full Assisted 10-Step Wizard
            <>

          {/* Stepper Progress Ribbon (Compact Single Rail) */}
          <div className="bg-gray-50/80 border-b border-gray-200 px-4 py-1.5 shrink-0">
            {/* Top mini progress line */}
            <div className="w-full bg-gray-200 h-0.5 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-gray-950 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Step buttons rail */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none pb-0.5">
              {steps.map((s) => {
                const isCompleted = currentStep > s.num;
                const isCurrent = currentStep === s.num;

                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setCurrentStep(s.num)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all shrink-0 ${
                      isCurrent
                        ? "bg-gray-950 text-white shadow-2xs"
                        : isCompleted
                        ? "bg-gray-100 text-gray-900 border border-gray-300"
                        : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        isCurrent
                          ? "bg-white/20 text-white"
                          : isCompleted
                          ? "bg-gray-950 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isCompleted ? "✓" : s.num}
                    </div>
                    <span>{s.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepper Content Area */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-white min-h-0">
            {/* ========================================================================= */}
            {/* STEP 1: ACCEPT OFFER LETTER */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <div className="max-w-3xl mx-auto space-y-3.5 animate-fade-in">
                <div className="text-center space-y-0.5">
                  <h3 className="text-base font-bold text-gray-950 tracking-tight">
                    Candidate Offer Letter Acceptance
                  </h3>
                  <p className="text-xs text-gray-500">
                    The formal employment offer has been dispatched. Please record the candidate's acknowledgment.
                  </p>
                </div>

                {/* Offer Summary Card with Compensation & Performance Bonus */}
                <div className="bg-white rounded-lg p-3.5 border border-gray-200 shadow-2xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 font-medium">Designation:</span>
                      <p className="font-bold text-gray-950 text-sm mt-0.5">
                        {designations.find((d) => d.id === designationId)?.title || "Senior Software Engineer"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Department:</span>
                      <p className="font-bold text-gray-950 text-sm mt-0.5">
                        {departments.find((d) => d.id === departmentId)?.name || "Engineering"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Expected Joining Date:</span>
                      <p className="font-bold text-gray-950 text-sm mt-0.5">{joiningDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Work Mode:</span>
                      <p className="font-bold text-gray-950 text-sm mt-0.5 capitalize">{workMode.toLowerCase().replace('_', ' ')}</p>
                    </div>
                  </div>

                  {/* Compensation Summary Ribbon */}
                  <div className="pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gray-50/70 p-3 rounded-lg border border-gray-200/80">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 block">Monthly Fixed Gross:</span>
                        <span className="font-bold text-gray-950 text-sm">{formatINR(monthlyCtc)}</span>
                      </div>
                      <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                      {performanceBonusAmount > 0 && (
                        <>
                          <div>
                            <span className="text-gray-500 block">Performance Bonus:</span>
                            <span className="font-bold text-gray-950 text-sm flex items-center gap-1.5">
                              {formatINR(performanceBonusAmount)}
                              <span className="text-[10px] font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                {performanceBonusFrequency.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500 font-normal">
                                ({formatINR(annualPerformanceBonus)}/yr)
                              </span>
                            </span>
                          </div>
                          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                        </>
                      )}
                      <div>
                        <span className="text-gray-500 block">Total Annual CTC:</span>
                        <span className="font-extrabold text-gray-950 text-base">
                          {formatINR(totalAnnualCtc)}
                          <span className="text-xs font-semibold text-gray-500 ml-1">
                            ({(totalAnnualCtc / 100000).toFixed(2)} LPA)
                          </span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCtcCalculatorOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-950 bg-white hover:bg-gray-100 rounded-md border border-gray-300 shadow-2xs transition-colors shrink-0"
                    >
                      <Calculator className="w-3.5 h-3.5 text-gray-600" />
                      <span>CTC Calculator</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2.5 text-xs text-gray-700">
                  <div className="space-y-0.5">
                    <h5 className="font-semibold text-gray-900">
                      1. What occurs upon candidate <span className="text-gray-950 font-bold">Acceptance</span>?
                    </h5>
                    <p className="text-gray-500 pl-3">
                      The onboarding workflow activates. The candidate advances to complete identity verification, statutory declarations, family details, education records, and document upload.
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-2 space-y-0.5">
                    <h5 className="font-semibold text-gray-900">
                      2. What occurs upon candidate <span className="text-gray-950 font-bold">Decline</span>?
                    </h5>
                    <p className="text-gray-500 pl-3">
                      The onboarding cycle terminates. Candidate record status is updated to declined and credentials will not be activated.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOfferDeclined(true);
                      setOfferAccepted(false);
                      alert("Candidate offer marked as declined.");
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 h-8 text-xs"
                  >
                    Decline Offer
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setOfferAccepted(true);
                      setOfferDeclined(false);
                      setCurrentStep(2);
                    }}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    className="h-8 text-xs"
                  >
                    Accept Offer & Proceed
                  </Button>
                </div>

                {offerAccepted && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-900 pt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-950" />
                    Offer confirmed accepted. Proceed to candidate dossier.
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: PERSONAL DETAILS (Screenshot 2) */}
            {/* ========================================================================= */}
            {currentStep === 2 && (
              <div className="max-w-5xl mx-auto space-y-3.5 animate-fade-in">
                <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-gray-950">Personal Details & Identification</h4>
                    <p className="text-xs text-gray-500">
                      As per official Indian government documents (Aadhaar, PAN & Voter ID)
                    </p>
                  </div>
                  <Badge variant="neutral" size="sm">Mandatory Step</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <Input
                    label="First Name *"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    required
                  />
                  <Input
                    label="Middle Name"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="e.g. Suresh"
                  />
                  <Input
                    label="Last Name *"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Patil"
                    required
                  />

                  <Input
                    label="Date of Birth *"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    helperText={`Calculated Age: ${calculatedAge} Years`}
                    required
                  />

                  <Select
                    label="Gender *"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    options={[
                      { label: "Male", value: "MALE" },
                      { label: "Female", value: "FEMALE" },
                      { label: "Other", value: "OTHER" },
                    ]}
                  />

                  <Select
                    label="Marital Status *"
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    options={[
                      { label: "Single", value: "Single" },
                      { label: "Married", value: "Married" },
                      { label: "Divorced", value: "Divorced" },
                      { label: "Widowed", value: "Widowed" },
                    ]}
                  />

                  <Input
                    label="Personal Mobile No. *"
                    value={personalMobile}
                    onChange={(e) => setPersonalMobile(e.target.value)}
                    placeholder="+91 98234 56789"
                    required
                  />

                  <Input
                    label="Personal Registered Email *"
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="ramesh@gmail.com"
                    required
                  />

                  <Input
                    label="Official Work Email"
                    type="email"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    placeholder="ramesh.patil@ga-hrms.io"
                  />

                  <Select
                    label="Blood Group *"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    options={[
                      { label: "O+", value: "O+" },
                      { label: "O-", value: "O-" },
                      { label: "A+", value: "A+" },
                      { label: "A-", value: "A-" },
                      { label: "B+", value: "B+" },
                      { label: "B-", value: "B-" },
                      { label: "AB+", value: "AB+" },
                      { label: "AB-", value: "AB-" },
                    ]}
                  />

                  <Input
                    label="Emergency Contact Name *"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="e.g. Suresh Patil"
                    required
                  />

                  <Input
                    label="Emergency Mobile No. *"
                    value={emergencyMobile}
                    onChange={(e) => setEmergencyMobile(e.target.value)}
                    placeholder="+91 98200 99999"
                    required
                  />
                </div>

                {/* Indian Statutory Numbers */}
                <div className="pt-2.5 border-t border-gray-200">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Statutory & Compliance Identification
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <Input
                      label="PAN No. *"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      required
                    />
                    <Input
                      label="Aadhaar No. *"
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value)}
                      placeholder="4512 7890 2345"
                      required
                    />
                    <Input
                      label="Existing UAN No. (If Any)"
                      value={uan}
                      onChange={(e) => setUan(e.target.value)}
                      placeholder="100912457899"
                    />
                    <Input
                      label="Existing ESIC No. (If Any)"
                      value={esicNumber}
                      onChange={(e) => setEsicNumber(e.target.value)}
                      placeholder="3100456799"
                    />
                  </div>
                </div>

                {/* Addresses */}
                <div className="pt-2.5 border-t border-gray-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Residential Address Details
                    </h5>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 hover:text-gray-950">
                      <input
                        type="checkbox"
                        checked={sameAsPresentAddress}
                        onChange={(e) => handleToggleSameAddress(e.target.checked)}
                        className="rounded border-gray-300 text-gray-950 focus:ring-gray-950/20"
                      />
                      Permanent Address same as Present Address
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Present Address */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                      <span className="text-xs font-bold text-gray-900 block">Present Address</span>
                      <Input
                        label="Street / House No. *"
                        value={presentStreet}
                        onChange={(e) => setPresentStreet(e.target.value)}
                        placeholder="e.g. Flat 402, Green Meadows"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          label="City *"
                          value={presentCity}
                          onChange={(e) => setPresentCity(e.target.value)}
                          placeholder="Pune"
                        />
                        <Input
                          label="State *"
                          value={presentState}
                          onChange={(e) => setPresentState(e.target.value)}
                          placeholder="Maharashtra"
                        />
                        <Input
                          label="PIN *"
                          value={presentPincode}
                          onChange={(e) => setPresentPincode(e.target.value)}
                          placeholder="411045"
                        />
                      </div>
                    </div>

                    {/* Permanent Address */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                      <span className="text-xs font-bold text-gray-900 block">Permanent Address</span>
                      <Input
                        label="Street / House No. *"
                        value={permanentStreet}
                        onChange={(e) => setPermanentStreet(e.target.value)}
                        disabled={sameAsPresentAddress}
                        placeholder="e.g. Flat 402, Green Meadows"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          label="City *"
                          value={permanentCity}
                          onChange={(e) => setPermanentCity(e.target.value)}
                          disabled={sameAsPresentAddress}
                          placeholder="Pune"
                        />
                        <Input
                          label="State *"
                          value={permanentState}
                          onChange={(e) => setPermanentState(e.target.value)}
                          disabled={sameAsPresentAddress}
                          placeholder="Maharashtra"
                        />
                        <Input
                          label="PIN *"
                          value={permanentPincode}
                          onChange={(e) => setPermanentPincode(e.target.value)}
                          disabled={sameAsPresentAddress}
                          placeholder="411045"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: FAMILY DETAILS (Screenshot 3) */}
            {/* ========================================================================= */}
            {currentStep === 3 && (
              <div className="max-w-4xl mx-auto space-y-3.5 animate-fade-in">
                <div className="border-b border-gray-200 pb-2">
                  <h4 className="text-base font-bold text-gray-950">Family Details & Dependent Records</h4>
                  <p className="text-xs text-gray-500">
                    Required for group medical insurance policy, gratuity nomination, and emergency protocols
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Father’s Name *"
                    value={fathersName}
                    onChange={(e) => setFathersName(e.target.value)}
                    placeholder="Enter Father's Name"
                    required
                  />
                  <Input
                    label="Mother’s Name *"
                    value={mothersName}
                    onChange={(e) => setMothersName(e.target.value)}
                    placeholder="Enter Mother's Name"
                    required
                  />

                  <Input
                    label="Father’s Date of Birth"
                    type="date"
                    value={fathersDob}
                    onChange={(e) => setFathersDob(e.target.value)}
                  />
                  <Input
                    label="Mother’s Date of Birth"
                    type="date"
                    value={mothersDob}
                    onChange={(e) => setMothersDob(e.target.value)}
                  />

                  <Input
                    label="Father’s Age"
                    value={fathersAge}
                    onChange={(e) => setFathersAge(e.target.value)}
                    placeholder="e.g. 58"
                  />
                  <Input
                    label="Mother’s Age"
                    value={mothersAge}
                    onChange={(e) => setMothersAge(e.target.value)}
                    placeholder="e.g. 55"
                  />

                  <div className="sm:col-span-2 pt-2.5 border-t border-gray-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                      Spouse & Children (If Applicable)
                    </span>
                  </div>

                  <Input
                    label="Spouse Name (If Applicable)"
                    value={spouseName}
                    onChange={(e) => setSpouseName(e.target.value)}
                    placeholder="Enter Spouse's Name"
                  />
                  <Input
                    label="Spouse’s Date of Birth (If Applicable)"
                    type="date"
                    value={spouseDob}
                    onChange={(e) => setSpouseDob(e.target.value)}
                  />

                  <Input
                    label="First Child’s Name (If Applicable)"
                    value={firstChildName}
                    onChange={(e) => setFirstChildName(e.target.value)}
                    placeholder="Enter First Child's Name"
                  />
                  <Input
                    label="First Child’s Date of Birth (If Applicable)"
                    type="date"
                    value={firstChildDob}
                    onChange={(e) => setFirstChildDob(e.target.value)}
                  />

                  <Input
                    label="Second Child’s Name (If Applicable)"
                    value={secondChildName}
                    onChange={(e) => setSecondChildName(e.target.value)}
                    placeholder="Enter Second Child's Name"
                  />
                  <Input
                    label="Second Child’s Date of Birth (If Applicable)"
                    type="date"
                    value={secondChildDob}
                    onChange={(e) => setSecondChildDob(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: EDUCATION DETAILS (Screenshot 4) */}
            {/* ========================================================================= */}
            {currentStep === 4 && (
              <div className="max-w-4xl mx-auto space-y-3.5 animate-fade-in">
                <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-gray-950">Education Qualifications</h4>
                    <p className="text-xs text-gray-500">
                      Record 10th, 12th, Degree, and Post-Graduation credentials
                    </p>
                  </div>
                  <Badge variant="neutral" size="sm">{educationList.length} Records Added</Badge>
                </div>

                {/* Table of added educations */}
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                        <th className="py-1.5 px-3">Education Class</th>
                        <th className="py-1.5 px-3">School / University</th>
                        <th className="py-1.5 px-3">Board / Study Field</th>
                        <th className="py-1.5 px-3">Year</th>
                        <th className="py-1.5 px-3">Grade / Score</th>
                        <th className="py-1.5 px-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {educationList.map((edu) => (
                        <tr key={edu.id} className="hover:bg-gray-50/50">
                          <td className="py-1.5 px-3 font-bold text-gray-900">{edu.educationClass}</td>
                          <td className="py-1.5 px-3 font-medium text-gray-800">{edu.schoolUniversity}</td>
                          <td className="py-1.5 px-3 text-gray-600">{edu.boardStudyField}</td>
                          <td className="py-1.5 px-3 font-semibold text-gray-700">{edu.year}</td>
                          <td className="py-1.5 px-3">
                            <Badge variant="success" size="sm">{edu.grade || "Passed"}</Badge>
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveEducation(edu.id)}
                              className="text-gray-400 hover:text-gray-700 p-1 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Education Box matching Screenshot 4 */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2.5">
                  <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-gray-950" /> Add New Education Record
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label="Education Class *"
                      value={newEduClass}
                      onChange={(e) => setNewEduClass(e.target.value)}
                      options={[
                        { label: "10th Standard (SSC)", value: "10th Standard" },
                        { label: "12th Standard (HSC)", value: "12th Standard" },
                        { label: "Diploma / ITI", value: "Diploma / ITI" },
                        { label: "Bachelor's Degree (B.E / B.Tech / B.Sc / B.Com)", value: "Bachelor's Degree" },
                        { label: "Master's Degree (M.Tech / M.Sc / MBA / MCA)", value: "Master's Degree" },
                        { label: "Doctorate (Ph.D)", value: "Doctorate (Ph.D)" },
                      ]}
                    />

                    <Input
                      label="School / University *"
                      value={newEduSchool}
                      onChange={(e) => setNewEduSchool(e.target.value)}
                      placeholder="e.g. Pune Institute of Computer Technology"
                    />

                    <Input
                      label="Board / Study Field *"
                      value={newEduField}
                      onChange={(e) => setNewEduField(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                    />

                    <Input
                      label="Passing Year *"
                      value={newEduYear}
                      onChange={(e) => setNewEduYear(e.target.value)}
                      placeholder="e.g. 2020"
                    />
                  </div>

                  <div className="flex justify-start">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAddEducation}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      className="h-8 text-xs"
                    >
                      + Add Education
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 5: BANK DETAILS (Screenshot 5) */}
            {/* ========================================================================= */}
            {currentStep === 5 && (
              <div className="max-w-4xl mx-auto space-y-3.5 animate-fade-in">
                <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-gray-950">Salary Disbursement Bank & Nominee</h4>
                    <p className="text-xs text-gray-500">
                      Primary bank account for automated monthly payroll direct deposit
                    </p>
                  </div>
                  <Badge variant="neutral" size="sm">Direct Deposit</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="IFSC Code *"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="HDFC0000052"
                    helperText="Branch verified: Pune Central"
                    required
                  />

                  <Input
                    label="Bank Account Holder Name *"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Full Name as per Bank Passbook"
                    required
                  />

                  <Input
                    label="Bank Name *"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank Ltd."
                    required
                  />

                  <Input
                    label="Branch Name *"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Shivaji Nagar Branch, Pune"
                    required
                  />

                  <Input
                    label="Bank Account No. *"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    placeholder="50100456789123"
                    required
                  />

                  <Input
                    label="Confirm Bank Account No. *"
                    value={confirmAccountNo}
                    onChange={(e) => setConfirmAccountNo(e.target.value)}
                    placeholder="Re-enter Account No."
                    helperText={
                      bankAccountNo === confirmAccountNo
                        ? "✓ Account numbers match"
                        : "⚠️ Numbers must match exactly"
                    }
                    required
                  />

                  <div className="sm:col-span-2 pt-2.5 border-t border-gray-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                      Nominee Information
                    </span>
                  </div>

                  <Input
                    label="Full Name of Nominee *"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    placeholder="Enter Name of Nominee"
                    required
                  />

                  <Select
                    label="Relationship with Nominee *"
                    value={nomineeRelationship}
                    onChange={(e) => setNomineeRelationship(e.target.value)}
                    options={[
                      { label: "Mother", value: "Mother" },
                      { label: "Father", value: "Father" },
                      { label: "Spouse", value: "Spouse" },
                      { label: "Child", value: "Child" },
                      { label: "Brother", value: "Brother" },
                      { label: "Sister", value: "Sister" },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 6: SOCIAL DETAILS (Screenshot 6) */}
            {/* ========================================================================= */}
            {currentStep === 6 && (
              <div className="max-w-4xl mx-auto space-y-3.5 animate-fade-in">
                <div className="border-b border-gray-200 pb-2">
                  <h4 className="text-base font-bold text-gray-950">Social & Professional Handles</h4>
                  <p className="text-xs text-gray-500">
                    LinkedIn and developer portfolio handles for internal company directory
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Linkedin ID / Profile URL"
                    value={linkedinId}
                    onChange={(e) => setLinkedinId(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />

                  <Input
                    label="Instagram ID"
                    value={instagramId}
                    onChange={(e) => setInstagramId(e.target.value)}
                    placeholder="@username"
                  />

                  <Input
                    label="Facebook ID"
                    value={facebookId}
                    onChange={(e) => setFacebookId(e.target.value)}
                    placeholder="facebook.com/username"
                  />

                  <Input
                    label="Twitter / X ID"
                    value={twitterId}
                    onChange={(e) => setTwitterId(e.target.value)}
                    placeholder="@handle"
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Developer Portfolio / GitHub URL"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 7: REFERENCE DETAILS (Screenshot 7) */}
            {/* ========================================================================= */}
            {currentStep === 7 && (
              <div className="max-w-4xl mx-auto space-y-3.5 animate-fade-in">
                <div className="border-b border-gray-200 pb-2">
                  <h4 className="text-base font-bold text-gray-950">Reference Details (Background Check)</h4>
                  <p className="text-xs text-gray-500">
                    Two professional or academic references for verification
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* First Reference */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <span className="text-xs font-bold text-gray-950 uppercase tracking-wider block">
                      FIRST REFERENCE
                    </span>
                    <Input
                      label="Name *"
                      value={ref1Name}
                      onChange={(e) => setRef1Name(e.target.value)}
                      placeholder="Enter Full Name"
                      required
                    />
                    <Input
                      label="Contact No. *"
                      value={ref1Contact}
                      onChange={(e) => setRef1Contact(e.target.value)}
                      placeholder="+91 98450 11223"
                      required
                    />
                    <Input
                      label="Email ID *"
                      type="email"
                      value={ref1Email}
                      onChange={(e) => setRef1Email(e.target.value)}
                      placeholder="reference1@company.com"
                      required
                    />
                  </div>

                  {/* Second Reference */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <span className="text-xs font-bold text-gray-950 uppercase tracking-wider block">
                      SECOND REFERENCE
                    </span>
                    <Input
                      label="Name *"
                      value={ref2Name}
                      onChange={(e) => setRef2Name(e.target.value)}
                      placeholder="Enter Full Name"
                      required
                    />
                    <Input
                      label="Contact No. *"
                      value={ref2Contact}
                      onChange={(e) => setRef2Contact(e.target.value)}
                      placeholder="+91 98220 44556"
                      required
                    />
                    <Input
                      label="Email ID *"
                      type="email"
                      value={ref2Email}
                      onChange={(e) => setRef2Email(e.target.value)}
                      placeholder="reference2@company.com"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 8: WORK EXPERIENCE DETAILS (Screenshot 8) */}
            {/* ========================================================================= */}
            {currentStep === 8 && (
              <div className="max-w-4xl mx-auto space-y-3.5 animate-fade-in">
                <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-gray-950">Prior Work Experience History</h4>
                    <p className="text-xs text-gray-500">
                      Previous organisations, designations, dates of employment and leaving reasons
                    </p>
                  </div>
                  <Badge variant="neutral" size="sm">{workExpList.length} Employments</Badge>
                </div>

                {/* Table of past experiences */}
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                        <th className="py-1.5 px-3">Organisation Name</th>
                        <th className="py-1.5 px-3">Designation</th>
                        <th className="py-1.5 px-3">Duration</th>
                        <th className="py-1.5 px-3">Reason of Leaving</th>
                        <th className="py-1.5 px-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {workExpList.map((exp) => (
                        <tr key={exp.id} className="hover:bg-gray-50/50">
                          <td className="py-1.5 px-3 font-bold text-gray-900">{exp.organisationName}</td>
                          <td className="py-1.5 px-3 font-semibold text-gray-800">{exp.designation}</td>
                          <td className="py-1.5 px-3 text-gray-600">
                            {exp.from} to {exp.to}
                          </td>
                          <td className="py-1.5 px-3 text-gray-600">{exp.reasonOfLeaving}</td>
                          <td className="py-1.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveExperience(exp.id)}
                              className="text-gray-400 hover:text-gray-700 p-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Work Experience Box matching Screenshot 8 */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2.5">
                  <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-gray-950" /> Add Past Employment Record
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Experience Level"
                      value={newExpLevel}
                      onChange={(e) => setNewExpLevel(e.target.value)}
                      options={[
                        { label: "Fresher (0 years)", value: "Fresher" },
                        { label: "0-1 Years", value: "0-1 years" },
                        { label: "1-3 Years", value: "1-3 years" },
                        { label: "3-5 Years", value: "3-5 years" },
                        { label: "5-8 Years", value: "5-8 years" },
                        { label: "8+ Years", value: "8+ years" },
                      ]}
                    />

                    <Input
                      label="Organisation Name"
                      value={newExpOrg}
                      onChange={(e) => setNewExpOrg(e.target.value)}
                      placeholder="Enter Organisation Name"
                    />

                    <Input
                      label="From Date"
                      type="date"
                      value={newExpFrom}
                      onChange={(e) => setNewExpFrom(e.target.value)}
                    />

                    <Input
                      label="To Date"
                      type="date"
                      value={newExpTo}
                      onChange={(e) => setNewExpTo(e.target.value)}
                    />

                    <Input
                      label="Designation"
                      value={newExpDesig}
                      onChange={(e) => setNewExpDesig(e.target.value)}
                      placeholder="Enter Designation"
                    />

                    <Input
                      label="Reason of Leaving"
                      value={newExpReason}
                      onChange={(e) => setNewExpReason(e.target.value)}
                      placeholder="Enter Reason of Leaving"
                    />
                  </div>

                  <div className="flex justify-start">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAddExperience}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      className="h-8 text-xs"
                    >
                      + Add Work Experience
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 9: UPLOAD DOCUMENTS (Screenshot 9) */}
            {/* ========================================================================= */}
            {currentStep === 9 && (
              <div className="max-w-5xl mx-auto space-y-3.5 animate-fade-in">
                <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-gray-950">Document Upload & Verification Matrix</h4>
                    <p className="text-xs text-gray-500">
                      Upload clear scanned copies (PDF / JPEG up to 5MB each)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUploadAllMockDocs}
                    leftIcon={<CheckCircle2 className="w-4 h-4 text-gray-950" />}
                  >
                    Quick-Verify All Sample Docs
                  </Button>
                </div>

                {/* 14 Documents Matrix matching Screenshot 9 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {documentItems.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2.5 bg-gray-50/70 rounded-lg border border-gray-200 flex flex-col justify-between gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">
                          {doc.title} {doc.required && <span className="text-red-600">*</span>}
                        </span>
                        <Badge
                          variant={doc.status === "VERIFIED" ? "success" : doc.status === "UPLOADED" ? "neutral" : "warning"}
                          size="sm"
                        >
                          {doc.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-2.5 py-1 bg-white border border-gray-300 rounded text-xs text-gray-600 truncate">
                          {doc.fileName ? doc.fileName : "No file chosen"}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSimulateUpload(doc.id)}
                          className="px-2.5 py-1 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
                          title="Upload file"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 10: COMPANY POLICIES & ACTIVATION (Screenshot 10) */}
            {/* ========================================================================= */}
            {currentStep === 10 && (
              <div className="max-w-4xl mx-auto space-y-3.5 animate-fade-in">
                <div className="border-b border-gray-200 pb-2 text-center space-y-0.5">
                  <h4 className="text-lg font-bold text-gray-950">Company Policies</h4>
                  <p className="text-xs text-gray-500">
                    Kindly read all the policies by clicking respective ones
                  </p>
                </div>

                {/* Accordion Policies matching Screenshot 10 */}
                <div className="space-y-3">
                  {/* 1. Intellectual Property Right (Exact text from screenshot!) */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setOpenPolicyAccordion(openPolicyAccordion === "ip" ? "" : "ip")}
                      className="w-full px-3.5 py-2 bg-gray-50 text-left font-bold text-xs text-gray-900 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <span>Intellectual Property Right</span>
                      {openPolicyAccordion === "ip" ? "▲" : "▼"}
                    </button>
                    {openPolicyAccordion === "ip" && (
                      <div className="p-3 bg-white text-xs text-gray-800 space-y-2 border-t border-gray-100">
                        <p className="leading-relaxed">
                          If during the period of your employment with us you achieve any invention, process improvement, operational improvement, or another process/method likely to result in the more efficient operation of any of the activities of the company, the company shall be entitled to use, utilize and exploit such improvement and you shall assign all rights thereof to the company for the purpose of seeking any patent rights or for any other purpose. The company shall have the sole ownership rights of all the intellectual property rights that you may create during the tenure of association with the company including but not limited to the creative concept that you may develop during your association with the company.
                        </p>
                        <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-gray-900 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-gray-950" />
                          <span>I have thoroughly read the instruction and accepted the policy.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Salary Policy */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setOpenPolicyAccordion(openPolicyAccordion === "salary" ? "" : "salary")}
                      className="w-full px-3.5 py-2 bg-gray-50 text-left font-bold text-xs text-gray-900 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <span>Salary Policy</span>
                      {openPolicyAccordion === "salary" ? "▲" : "▼"}
                    </button>
                    {openPolicyAccordion === "salary" && (
                      <div className="p-3 bg-white text-xs text-gray-800 space-y-1.5 border-t border-gray-100">
                        <p>
                          Salaries are credited on the last working day of each calendar month. Statutory deductions including Employee Provident Fund (EPF), ESIC, Professional Tax, and TDS under the Indian Income Tax Act will be deducted as applicable by law.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 3. Personal Particulars */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setOpenPolicyAccordion(openPolicyAccordion === "personal" ? "" : "personal")}
                      className="w-full px-3.5 py-2 bg-gray-50 text-left font-bold text-xs text-gray-900 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <span>Personal Particulars</span>
                      {openPolicyAccordion === "personal" ? "▲" : "▼"}
                    </button>
                    {openPolicyAccordion === "personal" && (
                      <div className="p-3 bg-white text-xs text-gray-800 space-y-1.5 border-t border-gray-100">
                        <p>
                          Employees are obligated to inform HR within 7 business days of any alteration to residential address, bank account, marital status, or dependent nominee declarations.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 4. Information Confidentiality */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setOpenPolicyAccordion(openPolicyAccordion === "confidentiality" ? "" : "confidentiality")}
                      className="w-full px-3.5 py-2 bg-gray-50 text-left font-bold text-xs text-gray-900 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <span>Information Confidentiality</span>
                      {openPolicyAccordion === "confidentiality" ? "▲" : "▼"}
                    </button>
                    {openPolicyAccordion === "confidentiality" && (
                      <div className="p-3 bg-white text-xs text-gray-800 space-y-1.5 border-t border-gray-100">
                        <p>
                          Proprietary source code, customer records, pricing methodologies, and confidential corporate data must not be disclosed or disseminated to any external unauthorized third party.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 5. Company's Assets/ Email */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setOpenPolicyAccordion(openPolicyAccordion === "assets" ? "" : "assets")}
                      className="w-full px-3.5 py-2 bg-gray-50 text-left font-bold text-xs text-gray-900 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <span>Company's Assets/ Email</span>
                      {openPolicyAccordion === "assets" ? "▲" : "▼"}
                    </button>
                    {openPolicyAccordion === "assets" && (
                      <div className="p-3 bg-white text-xs text-gray-800 space-y-1.5 border-t border-gray-100">
                        <p>
                          Corporate email, workstations, laptops, and credentials are provided exclusively for official duties. Assets must be surrendered in good working order upon separation.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 6. Training Policy */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setOpenPolicyAccordion(openPolicyAccordion === "training" ? "" : "training")}
                      className="w-full px-3.5 py-2 bg-gray-50 text-left font-bold text-xs text-gray-900 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <span>Training Policy</span>
                      {openPolicyAccordion === "training" ? "▲" : "▼"}
                    </button>
                    {openPolicyAccordion === "training" && (
                      <div className="p-3 bg-white text-xs text-gray-800 space-y-1.5 border-t border-gray-100">
                        <p>
                          New hires undergo a 30-day orientation, security training, and mentoring period. Completion of mandatory POSH and data security modules is required within 14 days of joining.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 7. Workplace Policy */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setOpenPolicyAccordion(openPolicyAccordion === "workplace" ? "" : "workplace")}
                      className="w-full px-3.5 py-2 bg-gray-50 text-left font-bold text-xs text-gray-900 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <span>Workplace Policy</span>
                      {openPolicyAccordion === "workplace" ? "▲" : "▼"}
                    </button>
                    {openPolicyAccordion === "workplace" && (
                      <div className="p-3 bg-white text-xs text-gray-800 space-y-1.5 border-t border-gray-100">
                        <p>
                          Our organization maintains a zero-tolerance policy against workplace harassment, discrimination, or abusive conduct, fully compliant with the POSH Act, 2013.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Digital Acceptance Checkbox & Signature */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4 text-xs">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allPoliciesAccepted}
                      onChange={(e) => setAllPoliciesAccepted(e.target.checked)}
                      className="w-5 h-5 text-gray-950 rounded border-gray-300 focus:ring-gray-950 mt-0.5 cursor-pointer accent-gray-950"
                    />
                    <div>
                      <span className="font-bold text-gray-950 text-sm">
                        I have thoroughly read all instructions and accept all Company Policies
                      </span>
                      <p className="text-gray-600 text-[11px] mt-0.5">
                        By checking this box, the candidate executes a binding agreement with Gryphon Academy / GA-HRMS.
                      </p>
                    </div>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <Input
                      label="Digital Signature (Candidate Full Name)"
                      value={digitalSignature}
                      onChange={(e) => setDigitalSignature(e.target.value)}
                      placeholder="e.g. Ramesh Suresh Patil"
                    />
                    <div className="flex flex-col justify-end">
                      <span className="text-[11px] text-gray-500">Signing Timestamp:</span>
                      <span className="font-mono font-bold text-gray-900 mt-1">
                        {new Date().toLocaleString("en-IN")} (IST)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Organization Placement Configuration */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Organization & Employment Assignment (HR Master Sync)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      label="Department"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      options={departments.map((d) => ({ label: d.name, value: d.id }))}
                    />
                    <Select
                      label="Designation"
                      value={designationId}
                      onChange={(e) => setDesignationId(e.target.value)}
                      options={designations.map((des) => ({ label: des.title, value: des.id }))}
                    />
                    <Select
                      label="Work Location"
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      options={branches.map((b) => ({ label: b.name, value: b.id }))}
                    />
                    <Select
                      label="Reporting Manager"
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      options={employees.map((e) => ({
                        label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
                        value: e.id,
                      }))}
                    />
                    <Input
                      label="Joining Date"
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                    />
                    <div className="sm:col-span-3 bg-white p-3.5 border border-gray-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div>
                          <span className="text-[11px] text-gray-500 block">Gross Monthly CTC:</span>
                          <span className="text-sm font-bold text-gray-950">{formatINR(monthlyCtc)}</span>
                        </div>
                        <div className="h-5 w-px bg-gray-200 hidden sm:block" />
                        {performanceBonusAmount > 0 && (
                          <>
                            <div>
                              <span className="text-[11px] text-gray-500 block">Performance Bonus:</span>
                              <span className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                                {formatINR(performanceBonusAmount)}
                                <span className="text-[10px] font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                  {performanceBonusFrequency.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] text-gray-500 font-normal">
                                  ({formatINR(annualPerformanceBonus)}/yr)
                                </span>
                              </span>
                            </div>
                            <div className="h-5 w-px bg-gray-200 hidden sm:block" />
                          </>
                        )}
                        <div>
                          <span className="text-[11px] text-gray-500 block">Total Annual CTC:</span>
                          <span className="text-sm font-extrabold text-gray-950">
                            {formatINR(totalAnnualCtc)} ({(totalAnnualCtc / 100000).toFixed(2)} LPA)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCtcCalculatorOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors shrink-0"
                      >
                        <Calculator className="w-3.5 h-3.5 text-gray-600" />
                        <span>CTC Calculator</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Navigation Footer (Compact Single Bar) */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentStep > 1) setCurrentStep(currentStep - 1);
                else onClose();
              }}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              className="h-8 text-xs px-3"
            >
              {currentStep === 1 ? "Cancel" : "Previous Step"}
            </Button>

            {/* Inlined Step Progress Indicator */}
            <div className="text-xs text-gray-500 font-medium hidden sm:flex items-center gap-1.5">
              <span className="font-semibold text-gray-900">Step {currentStep} of {steps.length}:</span>
              <span className="text-gray-700">{steps[currentStep - 1]?.title}</span>
              <span className="text-[10px] bg-gray-200 text-gray-700 font-semibold px-1.5 py-0.5 rounded-full">
                {progressPercent}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              {currentStep < steps.length ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  className="h-8 text-xs px-3.5"
                >
                  Continue to {steps[currentStep]?.short}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleFinish}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  className="h-8 text-xs px-4"
                >
                  Submit & Activate Employee
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  </Modal>

      {/* Embedded CTC Calculator Modal matching Screenshot 1 */}
      <CtcCalculatorModal
        isOpen={isCtcCalculatorOpen}
        onClose={() => setIsCtcCalculatorOpen(false)}
        initialGross={monthlyCtc}
        initialBonusAmount={performanceBonusAmount}
        initialBonusFrequency={performanceBonusFrequency}
        initialIncludeBonus={performanceBonusAmount > 0}
        onApply={(data) => {
          setMonthlyCtc(data.monthlyGross);
          setPerformanceBonusAmount(data.bonusAmount);
          setPerformanceBonusFrequency(data.bonusFrequency);
        }}
      />
    </>
  );
}
