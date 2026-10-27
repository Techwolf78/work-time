export type UserRole = 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  crmOriginalRole?: string;
  crmDepartment?: string;
}

export interface Company {
  id: string;
  name: string;
  tagline: string;
  cin: string;
  gstin: string;
  pan: string;
  logo: string;
  website: string;
  phone: string;
  email: string;
  headquarters: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  headCount: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headEmployeeId: string;
  headName: string;
  budget: number;
  openPositions: number;
  description: string;
}

export interface Designation {
  id: string;
  title: string;
  code: string;
  departmentId: string;
  level: string;
  minCtc: number;
  maxCtc: number;
}

export type EmploymentStatus = 'ACTIVE' | 'PROBATION' | 'NOTICE_PERIOD' | 'RESIGNED' | 'TERMINATED';
export type EmploymentType = 'FULL_TIME' | 'CONTRACT' | 'INTERN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: string;
  avatar: string;
  
  // Employment
  departmentId: string;
  designationId: string;
  branchId: string;
  managerId?: string;
  joiningDate: string;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  shiftId: string;
  
  // Statutory (Indian Compliance)
  pan: string;
  aadhaar: string;
  uan: string;
  esicNumber: string;
  
  // Banking
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  
  // Compensation summary
  monthlyCtc: number;
  annualCtc: number;
  performanceBonusAmount?: number;
  performanceBonusFrequency?: "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";

  // Extended Onboarding & Profile details (from Onboarding Wizard)
  middleName?: string;
  personalEmail?: string;
  alternatePhone?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  nationality?: string;
  presentAddress?: string;
  permanentAddress?: string;
  presentCity?: string;
  permanentCity?: string;
  presentState?: string;
  permanentState?: string;
  presentPincode?: string;
  permanentPincode?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  workMode?: 'ON_SITE' | 'HYBRID' | 'REMOTE';
  probationMonths?: number;
  noticePeriodDays?: number;
  secondaryManagerId?: string;
  buddyId?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
  branchName?: string;
  familyDetails?: FamilyDetails;
  educationDetails?: EducationDetail[];
  workExperienceDetails?: WorkExperienceDetail[];
  socialDetails?: SocialDetails;
  firstReference?: ReferenceDetail;
  secondReference?: ReferenceDetail;
  policiesAccepted?: boolean;
  offerLetterAccepted?: boolean;
  onboardingCompleted?: boolean;
  onboardingStatus?: 'INVITED' | 'IN_PROGRESS' | 'SUBMITTED' | 'VERIFIED';
}

export interface FamilyDetails {
  fathersName?: string;
  mothersName?: string;
  fathersDob?: string;
  mothersDob?: string;
  fathersAge?: number;
  mothersAge?: number;
  spouseName?: string;
  spouseDob?: string;
  firstChildName?: string;
  firstChildDob?: string;
  secondChildName?: string;
  secondChildDob?: string;
}

export interface EducationDetail {
  id: string;
  educationClass: string;
  schoolUniversity: string;
  boardStudyField: string;
  year: string;
  grade?: string;
}

export interface WorkExperienceDetail {
  id: string;
  experienceLevel?: string;
  organisationName: string;
  from: string;
  to: string;
  designation: string;
  reasonOfLeaving?: string;
}

export interface SocialDetails {
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  portfolio?: string;
}

export interface ReferenceDetail {
  name: string;
  contactNo: string;
  email: string;
  designation?: string;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'WEEK_OFF';

export interface PunchLog {
  id: string;
  time: string;
  type: 'IN' | 'OUT';
  source: 'WEB' | 'BIOMETRIC_DEVICE' | 'MOBILE_GPS';
  location?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftId: string;
  firstIn: string | null; // HH:mm
  lastOut: string | null; // HH:mm
  workingHours: number; // in hours, e.g. 8.5
  lateMinutes: number;
  status: AttendanceStatus;
  punches: PunchLog[];
  regularizationId?: string;
}

export interface AttendanceRegularization {
  id: string;
  employeeId: string;
  date: string;
  missingPunchType: 'IN' | 'OUT' | 'BOTH';
  requestedTime: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  appliedDate: string;
  comments?: string;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string; // "09:30"
  endTime: string;   // "18:30"
  graceMinutes: number; // e.g. 15
  halfDayThresholdHours: number; // e.g. 4.5
  workDays: string[]; // ["Monday", "Tuesday", ...]
}

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  annualQuota: number;
  monthlyAccrual: number;
  carryForwardMax: number;
  isEncashable: boolean;
  isPaid: boolean;
  color: string;
  description: string;
}

export interface LeaveBalance {
  leaveTypeId: string;
  allocated: number;
  used: number;
  pending: number;
  available: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  days: number;
  isHalfDay: boolean;
  halfDaySession?: 'MORNING' | 'AFTERNOON';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedDate: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  day: string;
  isOptional: boolean;
  applicableBranchIds: string[];
}

export interface SalaryStructure {
  employeeId: string;
  monthlyCtc: number;
  annualCtc: number;
  // Earnings
  basic: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  medicalAllowance: number;
  bonus: number;
  // Deductions
  pfEmployee: number; // 12% of basic
  esicEmployee: number; // 0.75% of gross (if <= 21,000)
  professionalTax: number; // INR 200 state slab
  tdsMonthly: number;
  otherDeductions: number;
}

export interface PayrollRecord {
  id: string;
  month: string; // "2026-10"
  monthName: string; // "October 2026"
  employeeId: string;
  workingDaysInMonth: number;
  presentDays: number;
  paidLeaveDays: number;
  lopDays: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  pfDeduction: number;
  esicDeduction: number;
  ptDeduction: number;
  tdsDeduction: number;
  lopDeduction: number;
  status: 'DRAFT' | 'PROCESSED' | 'LOCKED';
  processedDate?: string;
  paymentMode: 'BANK_TRANSFER' | 'CHEQUE';
  transactionRef?: string;
}

export interface Payslip {
  id: string;
  payrollRecordId: string;
  employeeId: string;
  month: string;
  year: number;
  issueDate: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  title: string;
  category: 'IDENTITY' | 'ACADEMIC' | 'EXPERIENCE' | 'PAYROLL' | 'COMPANY_POLICY' | 'OTHER';
  fileSize: string;
  uploadDate: string;
  fileType: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'leave' | 'attendance' | 'payroll' | 'employee' | 'system';
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: 'EMPLOYEE' | 'ATTENDANCE' | 'LEAVE' | 'PAYROLL' | 'SETTINGS' | 'SYSTEM' | 'DEPARTMENT';
  recordId?: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface CompanySettings {
  companyName: string;
  legalEntityName: string;
  cin: string;
  gstin: string;
  pan: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  workingDaysPerWeek: number;
  dailyStandardHours: number;
  gracePeriodMinutes: number;
  payrollCycleDay: number;
  epfEnabled: boolean;
  esicEnabled: boolean;
  ptEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
}

// ----------------------------------------------------
// RECRUITMENT & ATS MODULE TYPES
// ----------------------------------------------------
export type JobStatus = 'OPEN' | 'DRAFT' | 'ON_HOLD' | 'CLOSED';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'REMOTE' | 'HYBRID';
export type CandidateStage = 'SOURCED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

export interface JobPosting {
  id: string;
  title: string;
  departmentId: string;
  departmentName: string;
  location: string;
  type: JobType;
  experience: string;
  salaryRange: string;
  openingsCount: number;
  applicantsCount: number;
  status: JobStatus;
  postedDate: string;
  closingDate?: string;
  description: string;
  requirements: string[];
}

export interface Candidate {
  id: string;
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  currentCompany?: string;
  currentDesignation?: string;
  experienceYears: number;
  expectedCtc: number;
  stage: CandidateStage;
  rating: number; // 1 to 5
  appliedDate: string;
  resumeUrl?: string;
  notes?: string;
}

// ----------------------------------------------------
// ASSET & IT MANAGEMENT MODULE TYPES
// ----------------------------------------------------
export type AssetCategory = 'LAPTOP' | 'MONITOR' | 'MOBILE' | 'ACCESSORY' | 'LICENSE';
export type AssetStatus = 'ALLOCATED' | 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED';
export type AssetCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR';

export interface CompanyAsset {
  id: string;
  assetTag: string; // e.g. AST-LT-001
  name: string;
  category: AssetCategory;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  purchaseCost: number;
  status: AssetStatus;
  condition: AssetCondition;
  assignedToEmployeeId?: string;
  assignedToEmployeeName?: string;
  assignedDate?: string;
  department?: string;
  notes?: string;
}

// ----------------------------------------------------
// PERFORMANCE & OKRs MODULE TYPES
// ----------------------------------------------------
export type GoalPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BEHIND' | 'COMPLETED';

export interface KeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
}

export interface PerformanceGoal {
  id: string;
  title: string;
  quarter: string; // e.g. Q3 2026
  departmentId: string;
  departmentName: string;
  ownerEmployeeId: string;
  ownerName: string;
  ownerAvatar?: string;
  priority: GoalPriority;
  status: GoalStatus;
  progressPercent: number; // 0 - 100
  dueDate: string;
  keyResults: KeyResult[];
}

export interface AppraisalReview {
  id: string;
  cycle: string; // e.g. Annual Review 2026
  employeeId: string;
  employeeName: string;
  employeeDesignation: string;
  department: string;
  reviewerId: string;
  reviewerName: string;
  selfRating: number; // 1 to 5
  managerRating: number; // 1 to 5
  status: 'PENDING_SELF' | 'PENDING_MANAGER' | 'COMPLETED';
  feedback?: string;
  submittedDate?: string;
}

// ----------------------------------------------------
// DYNAMIC ONBOARDING CONFIGURATION & DOSSIER TYPES
// ----------------------------------------------------
export type OnboardingSubmissionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

export type OnboardingFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'EMAIL'
  | 'PHONE'
  | 'NUMBER'
  | 'DATE'
  | 'SELECT'
  | 'MULTISELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'ADDRESS'
  | 'READONLY';

export interface OnboardingCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'IS_EMPTY' | 'IS_NOT_EMPTY';
  value?: any;
}

export interface OnboardingFieldOption {
  label: string;
  value: string;
}

export interface OnboardingFieldValidation {
  pattern?: string;
  min?: number;
  max?: number;
  message?: string;
}

export interface OnboardingFieldConfig {
  id: string;
  name: string;
  label: string;
  type: OnboardingFieldType;
  required: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  readOnly?: boolean;
  options?: OnboardingFieldOption[];
  validation?: OnboardingFieldValidation;
  condition?: OnboardingCondition;
}

export interface OnboardingDocRequirement {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  acceptedFormats: string[]; // e.g. ['PDF', 'JPG', 'PNG']
  maxSizeBytes: number; // e.g. 5242880 for 5MB
  category: 'IDENTITY' | 'ACADEMIC' | 'EXPERIENCE' | 'PAYROLL' | 'OTHER';
  condition?: OnboardingCondition;
}

export interface OnboardingRepeatingConfig {
  minItems?: number;
  maxItems?: number;
  itemLabel?: string;
}

export interface OnboardingSectionConfig {
  id: string;
  title: string;
  description?: string;
  order: number;
  enabled: boolean;
  icon?: string;
  applicableCategories?: string[]; // e.g. ['ALL'], ['TECH'], ['OPERATIONS']
  condition?: OnboardingCondition;
  isRepeating?: boolean;
  repeatingConfig?: OnboardingRepeatingConfig;
  fields: OnboardingFieldConfig[];
  documents?: OnboardingDocRequirement[];
}

export interface OnboardingConfig {
  id: string;
  tenantId: string;
  title: string;
  version: number;
  isPublished: boolean;
  publishedAt?: string;
  sections: OnboardingSectionConfig[];
}

export interface CandidateUploadedDoc {
  id: string;
  requirementId: string;
  name: string;
  size: string;
  type: string;
  url?: string;
  uploadedAt: string;
  status?: 'UPLOADED' | 'VERIFIED' | 'REJECTED';
}

export interface CandidateDossier {
  id: string;
  employeeId: string;
  configId: string;
  configVersion: number;
  status: OnboardingSubmissionStatus;
  currentSectionId?: string;
  formData: Record<string, any>;
  uploadedDocuments: CandidateUploadedDoc[];
  reviewNotes?: string;
  lastSavedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedAt?: string;
}
