import React, { useState } from "react";
import { Briefcase, Users, Plus, Building2 } from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { formatINR } from "../../lib/utils";

export function DesignationsPage() {
  const { designations, departments, employees } = useHrms();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
            Designations & Job Levels
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Corporate hierarchy levels, role titles, and standard compensation brackets.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-card border border-surface-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                <th className="py-3 px-4">Designation Title</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Career Level</th>
                <th className="py-3 px-4">Standard CTC Band (Monthly)</th>
                <th className="py-3 px-4 text-center">Incumbents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {designations.map((desig) => {
                const dept = departments.find((d) => d.id === desig.departmentId);
                const count = employees.filter((e) => e.designationId === desig.id).length;

                return (
                  <tr key={desig.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900 flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4 text-gray-700" />
                      <span>{desig.title}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-gray-800">
                      {desig.code}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs">
                      {dept?.name || "Corporate"}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" size="sm">
                        {desig.level}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {formatINR(desig.minCtc)} - {formatINR(desig.maxCtc)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-full text-xs border border-gray-200/50">
                        <Users className="w-3.5 h-3.5 text-gray-500" />
                        {count}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
