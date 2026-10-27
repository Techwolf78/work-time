import React from "react";
import { Download, Printer, Building2, ShieldCheck, X } from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { PayrollRecord } from "../../types/hrms";
import { Button } from "../../components/ui/Button";
import { formatINR, formatDate } from "../../lib/utils";
import { GaHrmsLogo } from "../../components/ui/GaHrmsLogo";

export interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payrollRecord: PayrollRecord | null;
}

export function PayslipModal({ isOpen, onClose, payrollRecord }: PayslipModalProps) {
  const { company, employees, departments, designations, branches, salaryStructures } = useHrms();

  if (!isOpen || !payrollRecord) return null;

  const emp = employees.find((e) => e.id === payrollRecord.employeeId);
  const dept = departments.find((d) => d.id === emp?.departmentId);
  const desig = designations.find((d) => d.id === emp?.designationId);
  const branch = branches.find((b) => b.id === emp?.branchId);
  const salary = salaryStructures.find((s) => s.employeeId === payrollRecord.employeeId);

  const basic = salary?.basic || Math.round(payrollRecord.grossSalary * 0.5);
  const hra = salary?.hra || Math.round(payrollRecord.grossSalary * 0.25);
  const special = salary?.specialAllowance || Math.max(0, payrollRecord.grossSalary - (basic + hra));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-10 animate-scale-in my-6">
        {/* Modal Controls Bar */}
        <div className="px-6 py-3.5 bg-gray-950 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Salary Payslip Preview
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs font-mono text-gray-200">{payrollRecord.monthName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="bg-transparent text-white border-white/20 hover:bg-white/10 h-8 text-xs"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Corporate Payslip Sheet */}
        <div id="printable-payslip" className="p-8 sm:p-10 space-y-6 bg-white text-gray-950">
          {/* Company Branding & Header */}
          <div className="border-b-2 border-gray-950 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-950 flex items-center justify-center p-2 shadow-xs">
                <GaHrmsLogo size="md" variant="dark" iconOnly />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-950 uppercase tracking-tight">
                  {company.name}
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5 max-w-md">
                  {company.headquarters} • CIN: {company.cin}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                Payslip for the month of
              </span>
              <p className="text-lg font-extrabold text-gray-950">{payrollRecord.monthName}</p>
            </div>
          </div>

          {/* Employee & Statutory Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50/80 rounded-xl text-xs border border-gray-200/80">
            <div>
              <span className="text-gray-500 text-[11px]">Employee Code:</span>
              <p className="font-bold text-gray-950 font-mono mt-0.5">{emp?.employeeCode}</p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Employee Name:</span>
              <p className="font-bold text-gray-950 mt-0.5">
                {emp?.firstName} {emp?.lastName}
              </p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Department:</span>
              <p className="font-medium text-gray-900 mt-0.5">{dept?.name}</p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Designation:</span>
              <p className="font-medium text-gray-900 mt-0.5">{desig?.title}</p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">PAN:</span>
              <p className="font-mono font-semibold text-gray-950 mt-0.5">{emp?.pan}</p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">EPFO UAN:</span>
              <p className="font-mono font-semibold text-gray-950 mt-0.5">{emp?.uan}</p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Bank & A/C No:</span>
              <p className="font-mono font-semibold text-gray-950 mt-0.5 truncate">
                {emp?.bankName} ({emp?.accountNumber.slice(-4)})
              </p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Payable Days:</span>
              <p className="font-bold text-emerald-700 mt-0.5">
                {payrollRecord.presentDays + payrollRecord.paidLeaveDays} / {payrollRecord.workingDaysInMonth} Days
              </p>
            </div>
          </div>

          {/* Earnings & Deductions Tables (Two Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border border-gray-200 rounded-xl overflow-hidden text-xs">
            {/* Earnings Column */}
            <div className="border-b sm:border-b-0 sm:border-r border-gray-200">
              <div className="bg-gray-50 px-4 py-2.5 font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 flex justify-between">
                <span>Earnings Description</span>
                <span>Amount (INR)</span>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-600">Basic Salary</span>
                  <span className="font-semibold font-mono text-gray-950">{formatINR(basic)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">House Rent Allowance (HRA)</span>
                  <span className="font-semibold font-mono text-gray-950">{formatINR(hra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Special Allowance</span>
                  <span className="font-semibold font-mono text-gray-950">{formatINR(special)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statutory Conveyance</span>
                  <span className="font-semibold font-mono text-gray-950">₹1,600</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50/70 border-t border-gray-200 flex justify-between font-bold text-xs sm:text-sm">
                <span className="text-gray-900">Total Gross Earnings:</span>
                <span className="text-emerald-700 font-mono">{formatINR(payrollRecord.grossSalary)}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div>
              <div className="bg-gray-50 px-4 py-2.5 font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 flex justify-between">
                <span>Deductions Description</span>
                <span>Amount (INR)</span>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-600">Provident Fund (EPF 12%)</span>
                  <span className="font-semibold font-mono text-rose-600">
                    -{formatINR(payrollRecord.pfDeduction)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ESIC Contribution</span>
                  <span className="font-semibold font-mono text-rose-600">
                    -{formatINR(payrollRecord.esicDeduction)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Professional Tax (PT)</span>
                  <span className="font-semibold font-mono text-rose-600">
                    -{formatINR(payrollRecord.ptDeduction)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax Deducted at Source (TDS)</span>
                  <span className="font-semibold font-mono text-rose-600">
                    -{formatINR(payrollRecord.tdsDeduction)}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50/70 border-t border-gray-200 flex justify-between font-bold text-xs sm:text-sm">
                <span className="text-gray-900">Total Deductions:</span>
                <span className="text-rose-700 font-mono">-{formatINR(payrollRecord.totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary Highlight Box */}
          <div className="p-5 bg-gray-950 text-white rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-gray-400 block">
                Net Salary Disbursed (Take-Home)
              </span>
              <p className="text-xs text-gray-300 mt-0.5">
                Payment Mode: Direct Bank Credit NEFT/RTGS
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {formatINR(payrollRecord.netSalary)}
              </span>
            </div>
          </div>

          {/* Signoff Footer */}
          <div className="pt-5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
            <p>This is a computer-generated document and requires no physical signature.</p>
            <div className="flex items-center gap-1.5 font-semibold text-gray-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Certified by Corporate Finance & People Operations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
