import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Users,
  ChevronDown,
  ChevronRight,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { GaHrmsLogo } from "../../components/ui/GaHrmsLogo";

export function OrganizationPage() {
  const { company, branches, departments, employees } = useHrms();
  const navigate = useNavigate();

  const [expandedBranch, setExpandedBranch] = useState<string | null>(branches[0]?.id || null);
  const [expandedDept, setExpandedDept] = useState<string | null>(departments[0]?.id || null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
          Organization Hierarchy
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Multi-branch organizational structure, functional department trees, and reporting lines.
        </p>
      </div>

      {/* Root Company Card */}
      <div className="bg-gray-950 text-white p-6 sm:p-8 rounded-card border border-gray-800 shadow-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 text-white border border-white/10 flex items-center justify-center p-2.5 shadow-sm">
              <GaHrmsLogo size="md" variant="dark" iconOnly />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {company.name}
                </h2>
                <Badge variant="neutral" size="sm" className="bg-white/10 text-white border border-white/20">
                  Root Parent
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {company.headquarters} • CIN: {company.cin}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-300 bg-white/5 p-3 rounded-xl border border-white/10">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Total Branches</span>
              <p className="text-base font-bold text-white">{branches.length}</p>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Departments</span>
              <p className="text-base font-bold text-white">{departments.length}</p>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Staff Strength</span>
              <p className="text-base font-bold text-emerald-400">{employees.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Branches Tier */}
      <div className="space-y-4 pl-4 sm:pl-8 border-l-2 border-gray-200 ml-4 sm:ml-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Pan-India Operating Locations & Campuses
        </h3>

        {branches.map((b) => {
          const isBranchExpanded = expandedBranch === b.id;
          const branchEmployees = employees.filter((e) => e.branchId === b.id);

          return (
            <div key={b.id} className="bg-white rounded-card border border-surface-border shadow-card overflow-hidden">
              {/* Branch Header */}
              <div
                onClick={() => setExpandedBranch(isBranchExpanded ? null : b.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4 text-gray-700" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-text-primary">
                      {b.name}
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">{b.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200/60">
                    {branchEmployees.length} Staff
                  </span>
                  {isBranchExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Departments inside this branch */}
              {isBranchExpanded && (
                <div className="p-4 sm:p-6 bg-surface-subtle/50 border-t border-surface-border space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Departments Located at {b.city}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map((d) => {
                      const branchDeptEmployees = branchEmployees.filter((e) => e.departmentId === d.id);
                      if (branchDeptEmployees.length === 0) return null;

                      return (
                        <div
                          key={d.id}
                          className="bg-white p-4 rounded-xl border border-surface-border shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-700" />
                              <span className="text-xs font-bold text-gray-950">{d.name}</span>
                            </div>
                            <Badge variant="neutral" size="sm">
                              {branchDeptEmployees.length} Members
                            </Badge>
                          </div>

                          {/* Member avatars */}
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            {branchDeptEmployees.map((emp) => (
                              <div
                                key={emp.id}
                                onClick={() => navigate(`/people/employees/${emp.id}`)}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <Avatar
                                    src={emp.avatar}
                                    name={`${emp.firstName} ${emp.lastName}`}
                                    size="xs"
                                  />
                                  <div>
                                    <p className="text-xs font-semibold text-text-primary group-hover:text-black">
                                      {emp.firstName} {emp.lastName}
                                    </p>
                                    <p className="text-[10px] text-text-muted">
                                      {emp.employeeCode}
                                    </p>
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
