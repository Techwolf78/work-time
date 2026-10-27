import React, { useState } from "react";
import {
  FileSpreadsheet,
  Eye,
  Download,
  Printer,
  Search,
  Filter,
  RotateCcw,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { PayrollRecord } from "../../types/hrms";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { PayslipModal } from "./PayslipModal";
import { formatINR, exportToCsv } from "../../lib/utils";

export function PayslipsPage() {
  const { payroll, employees, departments } = useHrms();

  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingRecord, setViewingRecord] = useState<PayrollRecord | null>(null);

  const filteredPayroll = payroll.filter((p) => {
    const emp = employees.find((e) => e.id === p.employeeId);
    if (!emp) return false;

    const matchesMonth = selectedMonth === "ALL" || p.month === selectedMonth;
    const matchesDept = selectedDept === "ALL" || emp.departmentId === selectedDept;
    const matchesSearch =
      searchQuery === "" ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMonth && matchesDept && matchesSearch;
  });

  const totalGrossDisbursed = filteredPayroll.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalNetDisbursed = filteredPayroll.reduce((sum, p) => sum + p.netSalary, 0);

  const handleExportCSV = () => {
    const headers = [
      "Month",
      "Employee ID",
      "Employee Name",
      "Gross Salary (INR)",
      "Total Deductions (INR)",
      "Net Salary (INR)",
      "Status",
    ];

    const rows = filteredPayroll.map((p) => {
      const emp = employees.find((e) => e.id === p.employeeId);
      return [
        p.monthName,
        emp?.employeeCode || p.employeeId,
        `${emp?.firstName || ""} ${emp?.lastName || ""}`,
        p.grossSalary,
        p.totalDeductions,
        p.netSalary,
        p.status,
      ];
    });

    exportToCsv("GA_HRMS_Payslips_Register", headers, rows);
  };

  const resetFilters = () => {
    setSelectedMonth("ALL");
    setSelectedDept("ALL");
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
            Payslip Management & Salary Register
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Search, preview, print, and export individual monthly salary slips and NEFT statements.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="md"
          leftIcon={<Download className="w-4 h-4 text-gray-500" />}
        >
          Export Register (CSV)
        </Button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Total Slips Filtered
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-950">{filteredPayroll.length}</span>
            <span className="text-xs text-gray-500">records</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Gross Disbursed
          </span>
          <p className="text-2xl font-bold text-gray-950 mt-1 font-mono">
            {formatINR(totalGrossDisbursed)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Net Take-Home Disbursed
          </span>
          <p className="text-2xl font-bold text-gray-950 mt-1 font-mono">
            {formatINR(totalNetDisbursed)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3 flex-wrap justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee name or code..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-gray-50/70 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 px-3 text-xs bg-gray-50/70 border border-gray-200 rounded-lg text-gray-800 focus:bg-white focus:outline-none focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5 transition-all"
          >
            <option value="ALL">All Pay Months</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-9 px-3 text-xs bg-gray-50/70 border border-gray-200 rounded-lg text-gray-800 focus:bg-white focus:outline-none focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5 transition-all"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {(selectedMonth !== "ALL" || selectedDept !== "ALL" || searchQuery) && (
            <button
              onClick={resetFilters}
              className="h-9 px-2.5 text-xs text-gray-500 hover:text-gray-950 hover:bg-gray-100 rounded-lg flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4 text-rose-700">Deductions</th>
                <th className="py-3 px-4 font-bold text-gray-950">Net Take-Home</th>
                <th className="py-3 px-4">Disbursement Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">No Payslips Found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      No records match the selected month, department, or search filters.
                    </p>
                    {(selectedMonth !== "ALL" || selectedDept !== "ALL" || searchQuery) && (
                      <button
                        onClick={resetFilters}
                        className="mt-3 text-xs text-indigo-600 hover:underline font-medium"
                      >
                        Reset active filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((p) => {
                  const emp = employees.find((e) => e.id === p.employeeId);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors text-xs">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={emp?.avatar}
                            name={`${emp?.firstName} ${emp?.lastName}`}
                            size="xs"
                          />
                          <div>
                            <span className="font-semibold text-gray-950 block text-xs">
                              {emp?.firstName} {emp?.lastName}
                            </span>
                            <span className="text-[11px] text-gray-500 font-mono">{emp?.employeeCode}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {p.monthName}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-gray-950 font-mono">
                        {formatINR(p.grossSalary)}
                      </td>

                      <td className="py-3.5 px-4 text-rose-600 font-semibold font-mono">
                        -{formatINR(p.totalDeductions)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-950 text-xs font-mono">
                        {formatINR(p.netSalary)}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="success" size="sm" dot>
                          {p.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          onClick={() => setViewingRecord(p)}
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5 text-gray-500" />}
                          className="h-7 text-xs px-2.5 text-gray-700 hover:text-gray-950"
                        >
                          View Payslip
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      <PayslipModal
        isOpen={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        payrollRecord={viewingRecord}
      />
    </div>
  );
}
