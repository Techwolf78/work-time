import React, { useState } from "react";
import {
  ClockAlert,
  Plus,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Filter,
  Search,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { useAuth } from "../../lib/authContext";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { formatDate } from "../../lib/utils";
import { AttendanceCorrectionModal } from "./AttendanceCorrectionModal";

export function RegularizationPage() {
  const { regularizations, employees, approveRegularization, rejectRegularization } = useHrms();
  const { user } = useAuth();

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const pendingCount = regularizations.filter((r) => r.status === "PENDING").length;
  const approvedCount = regularizations.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = regularizations.filter((r) => r.status === "REJECTED").length;

  const filteredRequests = regularizations.filter((reg) => {
    if (selectedStatus !== "ALL" && reg.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const emp = employees.find((e) => e.id === reg.employeeId);
      const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
      const code = emp?.employeeCode?.toLowerCase() || "";
      const reason = (reg.reason || "").toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !reason.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight whitespace-nowrap">
            Attendance Regularization
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate hidden sm:block">
            Resolve missed punches, hardware failures, or outdoor duty with manager approval.
          </p>
        </div>

        <Button
          onClick={() => setIsApplyOpen(true)}
          variant="primary"
          size="sm"
          className="h-8 text-xs font-semibold whitespace-nowrap px-3 sm:px-3.5 shadow-xs shrink-0"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Request Regularization
        </Button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setSelectedStatus("PENDING")}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === "PENDING"
              ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/10"
              : "bg-white border-gray-200/80 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-950">{pendingCount}</span>
            {pendingCount > 0 && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                Action Req.
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => setSelectedStatus("APPROVED")}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === "APPROVED"
              ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/10"
              : "bg-white border-gray-200/80 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-950">{approvedCount}</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedStatus("REJECTED")}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === "REJECTED"
              ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/10"
              : "bg-white border-gray-200/80 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-950">{rejectedCount}</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl border bg-white border-gray-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Recorded</span>
            <ClockAlert className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-950">{regularizations.length}</span>
            <span className="text-[11px] text-gray-500">requests</span>
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tab Segmented Control */}
          <div className="inline-flex items-center p-1 bg-gray-100/90 rounded-xl border border-gray-200/80 gap-1 shrink-0 overflow-x-auto">
            {[
              { id: "ALL", label: "All Requests", count: regularizations.length },
              { id: "PENDING", label: "Pending Review", count: pendingCount },
              { id: "APPROVED", label: "Approved", count: approvedCount },
              { id: "REJECTED", label: "Rejected", count: rejectedCount },
            ].map((tab) => {
              const isActive = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? "bg-white text-gray-950 shadow-xs"
                      : "text-gray-600 hover:text-gray-950 hover:bg-white/50"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-gray-950 text-white"
                        : "bg-gray-200/80 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee or reason..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-gray-50/70 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Attendance Date</th>
                <th className="py-3.5 px-4">Correction Type</th>
                <th className="py-3.5 px-4">Requested Time</th>
                <th className="py-3.5 px-4">Reason / Justification</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-gray-400 text-sm">
                    No regularization requests found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((reg) => {
                  const emp = employees.find((e) => e.id === reg.employeeId);
                  return (
                    <tr key={reg.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-950">
                          {emp ? `${emp.firstName} ${emp.lastName}` : reg.employeeId}
                        </div>
                        <div className="text-xs text-gray-500">{emp?.employeeCode}</div>
                      </td>

                      <td className="py-3 px-4 text-xs font-medium text-gray-900">
                        {formatDate(reg.date)}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="neutral" size="sm">
                          {reg.missingPunchType} Punch
                        </Badge>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-900">
                        {reg.requestedTime}
                      </td>

                      <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate">
                        {reg.reason}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            reg.status === "APPROVED"
                              ? "success"
                              : reg.status === "REJECTED"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                          dot
                        >
                          {reg.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {reg.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              onClick={() => approveRegularization(reg.id)}
                              variant="success"
                              size="sm"
                              className="h-8 text-xs px-2.5"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => rejectRegularization(reg.id)}
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs px-2.5 text-rose-600 hover:bg-rose-50 border-rose-200"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {reg.approvedBy ? `Reviewed by ${reg.approvedBy}` : "Completed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Correction Modal */}
      <AttendanceCorrectionModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
      />
    </div>
  );
}
