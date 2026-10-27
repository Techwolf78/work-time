import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  Coins,
  FileText,
  CalendarCheck2,
  Receipt,
  Download,
  Upload,
  Edit,
  CheckCircle2,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Tabs, TabList, TabTrigger, TabContent } from "../../components/ui/Tabs";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { formatDate, formatINR, formatTime } from "../../lib/utils";

export function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    employees,
    departments,
    designations,
    branches,
    shifts,
    attendance,
    leaveRequests,
    leaveTypes,
    salaryStructures,
    payroll,
    documents,
    auditLogs,
    updateEmployee,
    uploadDocument,
  } = useHrms();

  const employee = employees.find((e) => e.id === id) || employees[0];
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edit form state
  const [editPhone, setEditPhone] = useState(employee?.phone || "");
  const [editEmail, setEditEmail] = useState(employee?.email || "");
  const [editCtc, setEditCtc] = useState(employee?.monthlyCtc || 100000);

  if (!employee) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-text-muted">Employee not found.</p>
        <Button onClick={() => navigate("/people/employees")} className="mt-4">
          Back to Employees
        </Button>
      </div>
    );
  }

  const dept = departments.find((d) => d.id === employee.departmentId);
  const desig = designations.find((d) => d.id === employee.designationId);
  const branch = branches.find((b) => b.id === employee.branchId);
  const shift = shifts.find((s) => s.id === employee.shiftId);
  const manager = employees.find((e) => e.id === employee.managerId);
  const salary = salaryStructures.find((s) => s.employeeId === employee.id);

  // Employee-specific records
  const empAttendance = attendance.filter((a) => a.employeeId === employee.id);
  const empLeaves = leaveRequests.filter((l) => l.employeeId === employee.id);
  const empPayroll = payroll.filter((p) => p.employeeId === employee.id);
  const empDocs = documents.filter((d) => d.employeeId === employee.id);
  const empLogs = auditLogs.filter(
    (l) => l.details.includes(employee.id) || l.userId === employee.id
  );

  const handleSaveProfile = () => {
    updateEmployee(employee.id, {
      phone: editPhone,
      email: editEmail,
      monthlyCtc: Number(editCtc),
      annualCtc: Number(editCtc) * 12,
    });
    setIsEditOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate("/people/employees")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employee Directory</span>
        </button>
      </div>

      {/* Profile Header Banner */}
      <div className="bg-white rounded-card border border-surface-border shadow-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar
              src={employee.avatar}
              name={`${employee.firstName} ${employee.lastName}`}
              size="xl"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
                  {employee.firstName} {employee.lastName}
                </h1>
                <Badge variant="neutral" size="sm">
                  {employee.employeeCode}
                </Badge>
                <Badge variant={employee.status === "ACTIVE" ? "success" : "warning"} size="sm" dot>
                  {employee.status}
                </Badge>
              </div>

              <p className="text-sm font-semibold text-text-primary">
                {desig?.title || "Staff Member"}
              </p>

              <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap pt-1">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-text-muted" />
                  {dept?.name || "Engineering"}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-text-muted" />
                  {branch?.city || "Pune"} ({branch?.code})
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  Joined {formatDate(employee.joiningDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              onClick={() => {
                setEditPhone(employee.phone);
                setEditEmail(employee.email);
                setEditCtc(employee.monthlyCtc);
                setIsEditOpen(true);
              }}
              variant="outline"
              size="md"
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit Profile
            </Button>

            <Button
              onClick={() => navigate(`/payroll/payslips?emp=${employee.id}`)}
              variant="primary"
              size="md"
              leftIcon={<Receipt className="w-4 h-4" />}
            >
              Payslips
            </Button>
          </div>
        </div>
      </div>

      {/* 8 Profile Tabs */}
      <Tabs defaultValue="overview">
        <TabList className="bg-white px-4 rounded-t-card border border-b-0 border-surface-border">
          <TabTrigger value="overview">Overview</TabTrigger>
          <TabTrigger value="personal">Personal</TabTrigger>
          <TabTrigger value="employment">Employment</TabTrigger>
          <TabTrigger value="attendance" badge={empAttendance.length}>
            Attendance
          </TabTrigger>
          <TabTrigger value="leave" badge={empLeaves.length}>
            Leave
          </TabTrigger>
          <TabTrigger value="payroll">Payroll</TabTrigger>
          <TabTrigger value="documents" badge={empDocs.length}>
            Documents
          </TabTrigger>
          <TabTrigger value="activity">Activity</TabTrigger>
        </TabList>

        <div className="bg-white rounded-b-card border border-surface-border p-6 shadow-card">
          {/* TAB 1: OVERVIEW */}
          <TabContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Info card */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                    Contact & Communication
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-text-muted">Corporate Email:</span>
                      <p className="font-semibold text-text-primary mt-0.5">{employee.email}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Mobile Number:</span>
                      <p className="font-semibold text-text-primary mt-0.5">{employee.phone}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Reporting Manager:</span>
                      <p className="font-semibold text-gray-950 mt-0.5">
                        {manager ? `${manager.firstName} ${manager.lastName}` : "Executive Board"}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-muted">Assigned Shift:</span>
                      <p className="font-semibold text-text-primary mt-0.5">
                        {shift?.name} ({shift?.startTime} - {shift?.endTime})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                    Statutory Identification
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Income Tax PAN:</span>
                      <span className="font-mono font-semibold">{employee.pan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Aadhaar Card:</span>
                      <span className="font-mono font-semibold">{employee.aadhaar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">EPFO UAN:</span>
                      <span className="font-mono font-semibold">{employee.uan}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Attendance & Leave Overview */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                    Attendance This Month (October)
                  </h4>
                  <div className="p-4 bg-surface-subtle/50 rounded-xl border border-surface-border space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Present Days:</span>
                      <span className="font-bold text-emerald-600">
                        {empAttendance.filter((a) => a.status === "PRESENT").length || 21} Days
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Late Arrivals:</span>
                      <span className="font-bold text-amber-600">
                        {empAttendance.filter((a) => a.status === "LATE").length || 1}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Approved Leaves:</span>
                      <span className="font-bold text-indigo-600">
                        {empAttendance.filter((a) => a.status === "LEAVE").length || 1} Days
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                    Leave Balance
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-[11px] text-blue-700 font-semibold">Casual Leave</span>
                      <p className="text-lg font-bold text-blue-900 mt-1">9.0 / 12</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[11px] text-emerald-700 font-semibold">Sick Leave</span>
                      <p className="text-lg font-bold text-emerald-900 mt-1">11.0 / 12</p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <span className="text-[11px] text-indigo-700 font-semibold">Privilege Leave</span>
                      <p className="text-lg font-bold text-indigo-900 mt-1">15.5 / 18</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-[11px] text-amber-700 font-semibold">Comp-off</span>
                      <p className="text-lg font-bold text-amber-900 mt-1">2.0 / 6</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Payroll Summary */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                    Salary Summary
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div>
                      <span className="text-[11px] text-gray-500 font-medium">Monthly CTC</span>
                      <p className="text-xl font-bold text-gray-950">
                        {formatINR(employee.monthlyCtc)}
                      </p>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-gray-200">
                      <span className="text-text-secondary">Annual CTC:</span>
                      <span className="font-semibold text-text-primary">
                        {formatINR(employee.annualCtc)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">Disbursement Bank:</span>
                      <span className="font-semibold text-text-primary">{employee.bankName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">Account Number:</span>
                      <span className="font-mono text-text-primary">{employee.accountNumber}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Recent Activity
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-text-primary">September Payslip Generated</p>
                        <p className="text-[11px] text-text-muted">30 Sep 2026</p>
                      </div>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-text-primary">Shift Confirmed (GEN-01)</p>
                        <p className="text-[11px] text-text-muted">01 Oct 2026</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabContent>

          {/* TAB 2: PERSONAL */}
          <TabContent value="personal">
            <div className="space-y-6">
              {/* Basic Bio Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  Basic Personal Dossier
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-text-muted">Full Name</span>
                    <p className="text-sm font-semibold text-text-primary mt-1">
                      {employee.firstName} {employee.middleName ? `${employee.middleName} ` : ""}{employee.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-muted">Gender</span>
                    <p className="text-sm font-semibold text-text-primary mt-1">{employee.gender}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Date of Birth</span>
                    <p className="text-sm font-semibold text-text-primary mt-1">{formatDate(employee.dob)}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Blood Group</span>
                    <p className="text-sm font-semibold text-text-primary mt-1">{employee.bloodGroup || "O+"}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Marital Status</span>
                    <p className="text-sm font-semibold text-text-primary mt-1">{employee.maritalStatus || "Single"}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Personal Email</span>
                    <p className="text-sm font-semibold text-text-primary mt-1">{employee.personalEmail || employee.email}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Contact Phone</span>
                    <p className="text-sm font-semibold text-text-primary mt-1">{employee.phone}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Emergency Contact</span>
                    <p className="text-sm font-semibold text-text-primary mt-1">
                      {employee.emergencyContactName ? `${employee.emergencyContactName} (${employee.emergencyContactRelation || "Family"})` : employee.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Residential Addresses */}
              <div className="pt-4 border-t border-surface-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  Residential Addresses
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-bold text-gray-900 block mb-1">Present Residential Address</span>
                    <p className="text-gray-700">{employee.presentAddress || "Flat 402, Green Meadows, Baner Road"}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      {employee.presentCity || "Pune"}, {employee.presentState || "Maharashtra"} - {employee.presentPincode || "411045"}
                    </p>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-bold text-gray-900 block mb-1">Permanent Hometown Address</span>
                    <p className="text-gray-700">{employee.permanentAddress || employee.presentAddress || "Flat 402, Green Meadows, Baner Road"}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      {employee.permanentCity || employee.presentCity || "Pune"}, {employee.permanentState || employee.presentState || "Maharashtra"} - {employee.permanentPincode || employee.presentPincode || "411045"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Family & Dependents */}
              <div className="pt-4 border-t border-surface-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  Family & Nominee Records
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-text-muted">Father's Name & Age:</span>
                    <p className="font-semibold text-text-primary mt-1">
                      {employee.familyDetails?.fathersName || "Suresh Patil"} {employee.familyDetails?.fathersAge ? `(${employee.familyDetails.fathersAge} yrs)` : ""}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-text-muted">Mother's Name & Age:</span>
                    <p className="font-semibold text-text-primary mt-1">
                      {employee.familyDetails?.mothersName || "Sunita Patil"} {employee.familyDetails?.mothersAge ? `(${employee.familyDetails.mothersAge} yrs)` : ""}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-text-muted">Bank Payout Nominee:</span>
                    <p className="font-semibold text-text-primary mt-1">
                      {employee.nomineeName || employee.familyDetails?.mothersName || "Sunita Patil"} ({employee.nomineeRelationship || "Mother"})
                    </p>
                  </div>
                </div>
              </div>

              {/* Education Qualifications */}
              {employee.educationDetails && employee.educationDetails.length > 0 && (
                <div className="pt-4 border-t border-surface-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                    Educational Qualifications
                  </h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Qualification</th>
                          <th className="py-2 px-3">Institute / University</th>
                          <th className="py-2 px-3">Specialization</th>
                          <th className="py-2 px-3">Year</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {employee.educationDetails.map((edu) => (
                          <tr key={edu.id}>
                            <td className="py-2 px-3 font-semibold text-gray-900">{edu.educationClass}</td>
                            <td className="py-2 px-3 text-gray-700">{edu.schoolUniversity}</td>
                            <td className="py-2 px-3 text-gray-600">{edu.boardStudyField}</td>
                            <td className="py-2 px-3 text-gray-600">{edu.year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Prior Work Experience */}
              {employee.workExperienceDetails && employee.workExperienceDetails.length > 0 && (
                <div className="pt-4 border-t border-surface-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                    Prior Work Experience History
                  </h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Organisation</th>
                          <th className="py-2 px-3">Designation</th>
                          <th className="py-2 px-3">Duration</th>
                          <th className="py-2 px-3">Reason for Leaving</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {employee.workExperienceDetails.map((exp) => (
                          <tr key={exp.id}>
                            <td className="py-2 px-3 font-semibold text-gray-900">{exp.organisationName}</td>
                            <td className="py-2 px-3 text-gray-700">{exp.designation}</td>
                            <td className="py-2 px-3 text-gray-600">{exp.from} to {exp.to}</td>
                            <td className="py-2 px-3 text-gray-600">{exp.reasonOfLeaving}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabContent>

          {/* TAB 3: EMPLOYMENT */}
          <TabContent value="employment">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
              <div>
                <span className="text-text-muted">Employee Code</span>
                <p className="text-sm font-semibold text-text-primary mt-1">{employee.employeeCode}</p>
              </div>
              <div>
                <span className="text-text-muted">Joining Date</span>
                <p className="text-sm font-semibold text-text-primary mt-1">{formatDate(employee.joiningDate)}</p>
              </div>
              <div>
                <span className="text-text-muted">Department</span>
                <p className="text-sm font-semibold text-text-primary mt-1">{dept?.name}</p>
              </div>
              <div>
                <span className="text-text-muted">Designation</span>
                <p className="text-sm font-semibold text-text-primary mt-1">{desig?.title}</p>
              </div>
              <div>
                <span className="text-text-muted">Employment Type</span>
                <p className="text-sm font-semibold text-text-primary mt-1">{employee.employmentType}</p>
              </div>
              <div>
                <span className="text-text-muted">Branch Office</span>
                <p className="text-sm font-semibold text-text-primary mt-1">{branch?.name}</p>
              </div>
            </div>
          </TabContent>

          {/* TAB 4: ATTENDANCE */}
          <TabContent value="attendance">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-950">Attendance Records</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-surface-border font-semibold text-text-secondary">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">First In</th>
                      <th className="py-2.5 px-3">Last Out</th>
                      <th className="py-2.5 px-3">Hours Logged</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {empAttendance.map((a) => (
                      <tr key={a.id}>
                        <td className="py-2.5 px-3 font-medium">{formatDate(a.date)}</td>
                        <td className="py-2.5 px-3">{formatTime(a.firstIn)}</td>
                        <td className="py-2.5 px-3">{formatTime(a.lastOut)}</td>
                        <td className="py-2.5 px-3 font-semibold">{a.workingHours} hrs</td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={a.status === "PRESENT" ? "success" : a.status === "LATE" ? "warning" : "neutral"}
                            size="sm"
                          >
                            {a.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabContent>

          {/* TAB 5: LEAVE */}
          <TabContent value="leave">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-950">Leave Applications</h4>
              {empLeaves.length === 0 ? (
                <p className="text-xs text-text-muted">No leave requests recorded for this employee.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {empLeaves.map((l) => {
                    const lt = leaveTypes.find((t) => t.id === l.leaveTypeId);
                    return (
                      <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-text-primary">
                            {lt?.name} ({l.days} Days)
                          </p>
                          <p className="text-text-muted mt-0.5">
                            {formatDate(l.fromDate)} to {formatDate(l.toDate)} • {l.reason}
                          </p>
                        </div>
                        <Badge variant={l.status === "APPROVED" ? "success" : "warning"} size="sm">
                          {l.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabContent>

          {/* TAB 6: PAYROLL */}
          <TabContent value="payroll">
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium">Monthly Compensation Structure</span>
                  <p className="text-2xl font-bold text-gray-950 mt-0.5">
                    {formatINR(employee.monthlyCtc)} / month
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/payroll/payslips?emp=${employee.id}`)}
                  variant="primary"
                  size="sm"
                >
                  View All Payslips
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Earnings */}
                <div className="p-4 border border-surface-border rounded-xl space-y-2.5">
                  <h5 className="font-bold text-emerald-700 uppercase tracking-wider text-[11px]">
                    Earnings Breakdown
                  </h5>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Basic Salary (50%):</span>
                    <span className="font-semibold text-text-primary">
                      {formatINR(salary?.basic || employee.monthlyCtc * 0.5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">House Rent Allowance (HRA):</span>
                    <span className="font-semibold text-text-primary">
                      {formatINR(salary?.hra || employee.monthlyCtc * 0.25)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Special Allowance:</span>
                    <span className="font-semibold text-text-primary">
                      {formatINR(salary?.specialAllowance || employee.monthlyCtc * 0.25)}
                    </span>
                  </div>
                </div>

                {/* Statutory Deductions */}
                <div className="p-4 border border-surface-border rounded-xl space-y-2.5">
                  <h5 className="font-bold text-rose-700 uppercase tracking-wider text-[11px]">
                    Statutory Deductions
                  </h5>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Employee PF (12%):</span>
                    <span className="font-semibold text-rose-600">
                      {formatINR(salary?.pfEmployee || 1800)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Professional Tax (PT):</span>
                    <span className="font-semibold text-rose-600">
                      {formatINR(salary?.professionalTax || 200)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Estimated Monthly TDS:</span>
                    <span className="font-semibold text-rose-600">
                      {formatINR(salary?.tdsMonthly || 8500)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabContent>

          {/* TAB 7: DOCUMENTS */}
          <TabContent value="documents">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-950">Employee Document Vault</h4>
                <Button
                  onClick={() => {
                    uploadDocument({
                      employeeId: employee.id,
                      title: "PAN Card Verified Copy",
                      category: "IDENTITY",
                      fileSize: "640 KB",
                      fileType: "PDF",
                    });
                  }}
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                >
                  Upload New Doc
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {empDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-700" />
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{doc.title}</p>
                        <p className="text-[10px] text-text-muted">
                          {doc.category} • {doc.fileSize} • Uploaded {formatDate(doc.uploadDate)}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="w-4 h-4 text-gray-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabContent>

          {/* TAB 8: ACTIVITY */}
          <TabContent value="activity">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-950">Audit Trail for {employee.firstName}</h4>
              {empLogs.length === 0 ? (
                <p className="text-xs text-text-muted">No specific audit logs recorded.</p>
              ) : (
                empLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-lg text-xs flex justify-between">
                    <div>
                      <span className="font-semibold text-text-primary">{log.action}</span>
                      <p className="text-text-secondary mt-0.5">{log.details}</p>
                    </div>
                    <span className="text-[11px] text-text-muted shrink-0">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </TabContent>
        </div>
      </Tabs>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Profile — ${employee.firstName} ${employee.lastName}`}
      >
        <div className="space-y-4">
          <Input
            label="Work Email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />
          <Input
            label="Phone Number"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />
          <Input
            label="Monthly CTC (INR)"
            type="number"
            value={editCtc}
            onChange={(e) => setEditCtc(Number(e.target.value))}
          />
          <div className="pt-4 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
