import React from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { Badge } from "../../components/ui/Badge";
import { formatDate } from "../../lib/utils";

export function HolidaysPage() {
  const { holidays, branches } = useHrms();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
          Annual Holiday Calendar
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Declared public holidays and optional cultural festival leaves for Calendar Year 2026.
        </p>
      </div>

      <div className="bg-white rounded-card border border-surface-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                <th className="py-3 px-4">Holiday Name</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Day of Week</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Applicable Locations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {holidays.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-gray-900 flex items-center gap-2.5">
                    <CalendarDays className="w-4 h-4 text-gray-700" />
                    <span>{h.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-xs text-gray-900">
                    {formatDate(h.date)}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-600">{h.day}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={h.isOptional ? "warning" : "neutral"} size="sm">
                      {h.isOptional ? "Optional Leave" : "Mandatory Public Holiday"}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500">
                    {h.applicableBranchIds.length === branches.length
                      ? "All Pan-India Branches"
                      : `${h.applicableBranchIds.length} Regional Branches`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
