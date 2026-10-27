import React, { useState, useMemo } from "react";
import {
  CalendarCheck2,
  Plus,
  CheckCircle2,
  XCircle,
  Filter,
  Calendar,
  Search,
  Clock,
  RotateCcw,
  AlertCircle,
  Check,
  X,
  FileText,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { formatDate } from "../../lib/utils";

export interface LeaveRequestsPageProps {
  onOpenApplyLeave?: () => void;
}

export function LeaveRequestsPage({ onOpenApplyLeave }: LeaveRequestsPageProps) {
  const { leaveRequests, leaveTypes, employees, approveLeave, rejectLeave } = useHrms();
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Rejection modal state
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Counts for tabs
  const pendingCount = leaveRequests.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaveRequests.filter((l) => l.status === "APPROVED").length;
  const rejectedCount = leaveRequests.filter((l) => l.status === "REJECTED").length;
  const totalApprovedDays = leaveRequests
    .filter((l) => l.status === "APPROVED")
    .reduce((sum, l) => sum + (l.days || 0), 0);

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) => {
      const matchesStatus = selectedStatus === "ALL" || req.status === selectedStatus;
      const matchesType = selectedType === "ALL" || req.leaveTypeId === selectedType;

      if (!matchesStatus || !matchesType) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const emp = employees.find((e) => e.id === req.employeeId);
      const fullName = `${emp?.firstName || ""} ${emp?.lastName || ""}`.toLowerCase();
      const empCode = (emp?.employeeCode || "").toLowerCase();
      const reason = (req.reason || "").toLowerCase();

      return fullName.includes(q) || empCode.includes(q) || reason.includes(q);
    });
  }, [leaveRequests, selectedStatus, selectedType, searchQuery, employees]);

  const handleOpenReject = (id: string) => {
    setRejectingRequestId(id);
    setRejectionReason("Operational exigencies require roster coverage.");
  };

  const handleConfirmReject = () => {
    if (!rejectingRequestId) return;
    rejectLeave(rejectingRequestId, rejectionReason);
    setRejectingRequestId(null);
    setRejectionReason("");
  };

  const resetFilters = () => {
    setSelectedStatus("ALL");
    setSelectedType("ALL");
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight whitespace-nowrap">
            Leave Requests & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate hidden sm:block">
            Review submitted leave applications, verify statutory quotas, and process manager signoffs.
          </p>
        </div>

        {onOpenApplyLeave && (
          <Button
            onClick={onOpenApplyLeave}
            variant="primary"
            size="sm"
            className="h-8 text-xs font-semibold whitespace-nowrap px-3 sm:px-3.5 shadow-xs shrink-0"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Apply for Leave
          </Button>
        )}
      </div>

      {/* Summary Metrics Strip */}
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
            <span className="text-xs font-semibold text-gray-500">Approved Leaves</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-950">{approvedCount}</span>
            <span className="text-[11px] text-gray-500">granted</span>
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
            <span className="text-xs font-semibold text-gray-500">Declined Requests</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-950">{rejectedCount}</span>
            <span className="text-[11px] text-gray-500">declined</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl border bg-white border-gray-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Approved Days</span>
            <CalendarCheck2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-950">{totalApprovedDays}</span>
            <span className="text-[11px] text-gray-500">working days</span>
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tab Segmented Control */}
          <div className="inline-flex items-center p-1 bg-gray-100/90 rounded-xl border border-gray-200/80 gap-1 shrink-0 overflow-x-auto">
            {[
              { id: "ALL", label: "All Requests", count: leaveRequests.length },
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

          {/* Search & Leave Type Dropdown */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee or reason..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-gray-50/70 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5 transition-all"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 px-3 text-xs bg-gray-50/70 border border-gray-200 rounded-lg text-gray-800 focus:bg-white focus:outline-none focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5 transition-all"
            >
              <option value="ALL">All Leave Categories</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>

            {(selectedStatus !== "ALL" || selectedType !== "ALL" || searchQuery) && (
              <button
                onClick={resetFilters}
                className="h-9 px-2.5 text-xs text-gray-500 hover:text-gray-950 hover:bg-gray-100 rounded-lg flex items-center gap-1 transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
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
                <th className="py-3.5 px-4">Leave Category</th>
                <th className="py-3.5 px-4">Dates</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Reason / Purpose</th>
                <th className="py-3.5 px-4">Applied Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                      <CalendarCheck2 className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">No Applications Found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      No leave applications match the selected status or search filter.
                    </p>
                    {(selectedStatus !== "ALL" || selectedType !== "ALL" || searchQuery) && (
                      <button
                        onClick={resetFilters}
                        className="mt-3 text-xs text-indigo-600 hover:underline font-medium"
                      >
                        Clear active filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const emp = employees.find((e) => e.id === req.employeeId);
                  const lt = leaveTypes.find((t) => t.id === req.leaveTypeId);

                  return (
                    <tr key={req.id} className="hover:bg-gray-50/70 transition-colors">
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
                            <span className="text-[11px] font-mono text-gray-500">{emp?.employeeCode}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: lt?.color || "#94A3B8" }}
                          />
                          <span className="text-xs font-medium text-gray-900">
                            {lt?.name || "Leave"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-gray-900">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span>{formatDate(req.fromDate)}</span>
                          {req.fromDate !== req.toDate && (
                            <>
                              <span className="text-gray-400">→</span>
                              <span>{formatDate(req.toDate)}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-gray-950 bg-gray-100 px-2 py-0.5 rounded">
                          {req.days} {req.days === 1 ? "Day" : "Days"}
                          {req.isHalfDay && (
                            <span className="text-[10px] font-normal text-gray-600">(Half)</span>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {req.appliedDate ? formatDate(req.appliedDate) : "—"}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            req.status === "APPROVED"
                              ? "success"
                              : req.status === "REJECTED"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                          dot
                        >
                          {req.status === "PENDING"
                            ? "Pending"
                            : req.status === "APPROVED"
                            ? "Approved"
                            : "Rejected"}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {req.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              onClick={() => approveLeave(req.id)}
                              variant="success"
                              size="sm"
                              className="h-7 text-xs px-2.5 font-medium shadow-none"
                              leftIcon={<Check className="w-3.5 h-3.5" />}
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleOpenReject(req.id)}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                              leftIcon={<X className="w-3.5 h-3.5" />}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-xs text-gray-500 font-medium block">
                              {req.reviewedBy ? `By ${req.reviewedBy}` : "Completed"}
                            </span>
                            {req.rejectionReason && (
                              <span className="text-[10px] text-rose-600 max-w-[140px] truncate block ml-auto" title={req.rejectionReason}>
                                {req.rejectionReason}
                              </span>
                            )}
                          </div>
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

      {/* Reject Leave Modal */}
      <Modal
        isOpen={!!rejectingRequestId}
        onClose={() => setRejectingRequestId(null)}
        title="Reject Leave Application"
        description="Provide a justification note for the applicant regarding the decision."
      >
        <div className="space-y-4">
          <Input
            label="Reason for Declining"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Project deliverable deadline conflict; roster coverage required."
            required
          />

          <div className="pt-3 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setRejectingRequestId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReject}
              className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
