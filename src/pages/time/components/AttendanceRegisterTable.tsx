import React, { useState, useMemo } from "react";
import {
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
} from "lucide-react";
import { AttendanceRecord, AttendanceStatus } from "../../../types/hrms";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Avatar } from "../../../components/ui/Avatar";
import { useHrms } from "../../../lib/hrmsContext";
import { formatTime } from "../../../lib/utils";

export interface AttendanceRegisterTableProps {
  records: AttendanceRecord[];
  onOpenTimeline: (record: AttendanceRecord) => void;
  onOpenCorrection: (record: AttendanceRecord) => void;
  canCorrect?: boolean;
  canExport?: boolean;
  showFilters?: boolean;
  customTitle?: string;
  showDateColumn?: boolean;
  showEmployeeColumn?: boolean;
  defaultSortField?: "date" | "name" | "firstIn" | "lastOut" | "workingHours" | "status";
  defaultSortAsc?: boolean;
}

export function AttendanceRegisterTable({
  records,
  onOpenTimeline,
  onOpenCorrection,
  canCorrect = true,
  canExport = true,
  showFilters = true,
  customTitle,
  showDateColumn = false,
  showEmployeeColumn = true,
  defaultSortField,
  defaultSortAsc,
}: AttendanceRegisterTableProps) {
  const { employees, departments, branches, shifts } = useHrms();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedShift, setSelectedShift] = useState("ALL");

  // Sorting state
  const [sortField, setSortField] = useState<"date" | "name" | "firstIn" | "lastOut" | "workingHours" | "status">(
    defaultSortField || (showDateColumn && !showEmployeeColumn ? "date" : "name")
  );
  const [sortAsc, setSortAsc] = useState(
    defaultSortAsc !== undefined ? defaultSortAsc : showDateColumn && !showEmployeeColumn ? false : true
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const emp = employees.find((e) => e.id === rec.employeeId);
      if (!emp && showEmployeeColumn) return false;

      if (searchQuery.trim() && emp) {
        const q = searchQuery.toLowerCase();
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const code = (emp.employeeCode || "").toLowerCase();
        if (!fullName.includes(q) && !code.includes(q)) return false;
      }

      if (selectedDept !== "ALL" && emp && emp.departmentId !== selectedDept) return false;
      if (selectedBranch !== "ALL" && emp && emp.branchId !== selectedBranch) return false;
      if (selectedShift !== "ALL" && rec.shiftId !== selectedShift) return false;
      if (selectedStatus !== "ALL" && rec.status !== selectedStatus) return false;

      return true;
    });
  }, [records, employees, searchQuery, selectedDept, selectedBranch, selectedShift, selectedStatus, showEmployeeColumn]);

  // Sort records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const empA = employees.find((e) => e.id === a.employeeId);
      const empB = employees.find((e) => e.id === b.employeeId);

      let valA: any = "";
      let valB: any = "";

      if (sortField === "date") {
        valA = a.date;
        valB = b.date;
      } else if (sortField === "name") {
        valA = `${empA?.firstName || ""} ${empA?.lastName || ""}`.toLowerCase();
        valB = `${empB?.firstName || ""} ${empB?.lastName || ""}`.toLowerCase();
      } else if (sortField === "firstIn") {
        valA = a.firstIn || "";
        valB = b.firstIn || "";
      } else if (sortField === "lastOut") {
        valA = a.lastOut || "";
        valB = b.lastOut || "";
      } else if (sortField === "workingHours") {
        valA = a.workingHours || 0;
        valB = b.workingHours || 0;
      } else if (sortField === "status") {
        valA = a.status;
        valB = b.status;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortAsc, employees]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === "date" ? false : true);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT":
        return <Badge variant="success" size="sm" dot>Present</Badge>;
      case "LATE":
        return <Badge variant="warning" size="sm" dot>Late</Badge>;
      case "HALF_DAY":
        return <Badge variant="neutral" size="sm" dot>Half Day</Badge>;
      case "ABSENT":
        return <Badge variant="danger" size="sm" dot>Absent</Badge>;
      case "LEAVE":
        return <Badge variant="cyan" size="sm" dot>On Leave</Badge>;
      case "WEEK_OFF":
        return <Badge variant="neutral" size="sm">Weekly Off</Badge>;
      case "HOLIDAY":
        return <Badge variant="purple" size="sm">Holiday</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const handleExportCSV = () => {
    if (sortedRecords.length === 0) return;

    const headers = showEmployeeColumn
      ? ["Employee Code", "Name", "Date", "Shift", "First In", "Last Out", "Worked Hours", "Late (mins)", "Status"]
      : ["Date", "Day", "Shift", "First In", "Last Out", "Worked Hours", "Late (mins)", "Status"];

    const rows = sortedRecords.map((r) => {
      const emp = employees.find((e) => e.id === r.employeeId);
      const shift = shifts.find((s) => s.id === r.shiftId);
      const dayName = new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });

      if (showEmployeeColumn) {
        return [
          emp?.employeeCode || "",
          `"${emp?.firstName || ""} ${emp?.lastName || ""}"`,
          r.date,
          shift?.name || "General Shift",
          r.firstIn || "",
          r.lastOut || "",
          r.workingHours || 0,
          r.lateMinutes || 0,
          r.status,
        ].join(",");
      }

      return [
        r.date,
        dayName,
        shift?.name || "General Shift",
        r.firstIn || "",
        r.lastOut || "",
        r.workingHours || 0,
        r.lateMinutes || 0,
        r.status,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedDept !== "ALL" ||
    selectedBranch !== "ALL" ||
    selectedShift !== "ALL" ||
    selectedStatus !== "ALL";

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDept("ALL");
    setSelectedBranch("ALL");
    setSelectedShift("ALL");
    setSelectedStatus("ALL");
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-card border border-surface-border shadow-card overflow-hidden">
      {/* Table Header / Toolbar (Seamlessly integrated into the card header) */}
      <div className="px-4 py-2.5 border-b border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-white">
        <div className="flex items-center gap-3">
          {customTitle ? (
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              {customTitle}
            </h3>
          ) : (
            <span className="text-xs font-semibold text-text-primary">
              Register Records
            </span>
          )}
          <span className="text-[11px] text-text-secondary tabular-nums">
            {sortedRecords.length} total
          </span>
        </div>

        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input - only when showing employees */}
            {showEmployeeColumn && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search employee or ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-48 pl-8 pr-6 h-8 text-xs bg-surface-bg border border-surface-border rounded-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Department Filter - only when showing employees */}
            {showEmployeeColumn && departments.length > 0 && (
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-xs bg-surface-bg border border-surface-border rounded-input text-text-primary focus:outline-none focus:border-brand-primary"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-2 text-xs bg-surface-bg border border-surface-border rounded-input text-text-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">On Leave</option>
              <option value="WEEK_OFF">Weekly Off</option>
              <option value="HOLIDAY">Holiday</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="h-8 px-2 text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                Reset
              </button>
            )}

            {canExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 text-xs font-medium ml-auto"
                leftIcon={<Download className="w-3.5 h-3.5 text-text-secondary" />}
              >
                Export
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-subtle/70 border-b border-surface-border text-[11px] uppercase tracking-wider text-text-secondary font-medium select-none">
              {showDateColumn && (
                <th
                  onClick={() => handleSort("date")}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-text-primary transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-text-muted" />
                  </div>
                </th>
              )}

              {showEmployeeColumn && (
                <th
                  onClick={() => handleSort("name")}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-text-primary transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Employee</span>
                    <ArrowUpDown className="w-3 h-3 text-text-muted" />
                  </div>
                </th>
              )}

              <th className="py-2.5 px-3.5">Shift</th>
              <th
                onClick={() => handleSort("firstIn")}
                className="py-2.5 px-3.5 cursor-pointer hover:text-text-primary transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>In Time</span>
                  <ArrowUpDown className="w-3 h-3 text-text-muted" />
                </div>
              </th>
              <th
                onClick={() => handleSort("lastOut")}
                className="py-2.5 px-3.5 cursor-pointer hover:text-text-primary transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Out Time</span>
                  <ArrowUpDown className="w-3 h-3 text-text-muted" />
                </div>
              </th>
              <th
                onClick={() => handleSort("workingHours")}
                className="py-2.5 px-3.5 cursor-pointer hover:text-text-primary transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Worked</span>
                  <ArrowUpDown className="w-3 h-3 text-text-muted" />
                </div>
              </th>
              <th className="py-2.5 px-3.5">Late / On-Time</th>
              <th
                onClick={() => handleSort("status")}
                className="py-2.5 px-3.5 cursor-pointer hover:text-text-primary transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-text-muted" />
                </div>
              </th>
              <th className="py-2.5 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={showDateColumn && showEmployeeColumn ? 9 : 8} className="py-12 text-center text-text-muted">
                  <p className="text-xs font-medium text-text-primary">No attendance records found</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {hasActiveFilters
                      ? "No records match the active filter criteria."
                      : "No attendance recorded for this scope."}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((rec) => {
                const emp = employees.find((e) => e.id === rec.employeeId);
                const shift = shifts.find((s) => s.id === rec.shiftId);

                return (
                  <tr key={rec.id} className="hover:bg-surface-subtle/50 transition-colors">
                    {showDateColumn && (
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary text-xs font-mono">
                            {rec.date}
                          </span>
                          <span className="text-[10px] text-text-secondary font-mono uppercase bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border/60">
                            {new Date(rec.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                          </span>
                        </div>
                      </td>
                    )}

                    {showEmployeeColumn && (
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={emp?.avatar}
                            name={`${emp?.firstName || ""} ${emp?.lastName || ""}`}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <span className="font-medium text-text-primary truncate block leading-tight">
                              {emp?.firstName} {emp?.lastName}
                            </span>
                            <span className="text-[10px] text-text-secondary font-mono leading-none">
                              {emp?.employeeCode}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

                    <td className="py-2.5 px-3.5 text-text-secondary text-[11px]">
                      {shift?.name || "General Shift"}
                    </td>

                    <td className="py-2.5 px-3.5 font-mono tabular-nums text-xs text-text-primary">
                      {rec.firstIn ? formatTime(rec.firstIn) : "--:--"}
                    </td>

                    <td className="py-2.5 px-3.5 font-mono tabular-nums text-xs text-text-primary">
                      {rec.lastOut ? formatTime(rec.lastOut) : "--:--"}
                    </td>

                    <td className="py-2.5 px-3.5 font-mono tabular-nums font-semibold text-text-primary text-xs">
                      {rec.workingHours ? `${rec.workingHours}h` : "--"}
                    </td>

                    <td className="py-2.5 px-3.5">
                      {rec.lateMinutes > 0 ? (
                        <span className="font-mono tabular-nums font-medium text-amber-700 text-xs">
                          +{rec.lateMinutes}m
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">On-time</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5">{getStatusBadge(rec.status)}</td>

                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenTimeline(rec)}
                          className="h-6 px-2 text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded transition-colors"
                          title="View punch timeline"
                        >
                          Punches
                        </button>

                        {canCorrect && (
                          <button
                            onClick={() => onOpenCorrection(rec)}
                            className="h-6 px-2 text-[11px] font-medium text-brand-cyan hover:text-brand-cyan-dark hover:bg-brand-cyan-light rounded transition-colors"
                          >
                            Correct
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {sortedRecords.length > pageSize && (
        <div className="px-4 py-2 border-t border-surface-border flex items-center justify-between text-xs text-text-secondary bg-surface-subtle/30">
          <span className="tabular-nums">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, sortedRecords.length)} of {sortedRecords.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1 rounded text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-medium tabular-nums text-text-primary">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1 rounded text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
