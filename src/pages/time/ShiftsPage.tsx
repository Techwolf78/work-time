import React, { useState } from "react";
import {
  CalendarRange,
  Clock,
  Plus,
  Users,
  Edit,
  ShieldAlert,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { Shift } from "../../types/hrms";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";

export function ShiftsPage() {
  const { shifts, employees, addShift, updateShift } = useHrms();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("18:30");
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [halfDayThresholdHours, setHalfDayThresholdHours] = useState(4.5);

  const handleCreate = () => {
    if (!name || !code) return;
    addShift({
      name,
      code: code.toUpperCase(),
      startTime,
      endTime,
      graceMinutes: Number(graceMinutes),
      halfDayThresholdHours: Number(halfDayThresholdHours),
      workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    });
    setName("");
    setCode("");
    setIsAddOpen(false);
  };

  const handleUpdate = () => {
    if (!editingShift) return;
    updateShift(editingShift.id, {
      name,
      code: code.toUpperCase(),
      startTime,
      endTime,
      graceMinutes: Number(graceMinutes),
      halfDayThresholdHours: Number(halfDayThresholdHours),
    });
    setEditingShift(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
            Shift Rostering & Policies
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure working hours, late arrival grace buffers, and half-day thresholds.
          </p>
        </div>

        <Button
          onClick={() => {
            setName("");
            setCode("");
            setIsAddOpen(true);
          }}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Shift Policy
        </Button>
      </div>

      {/* Shift Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {shifts.map((shift) => {
          const assignedCount = employees.filter((e) => e.shiftId === shift.id).length;

          return (
            <Card key={shift.id} className="hover:border-gray-300 transition-all flex flex-col justify-between">
              <CardHeader>
                <div>
                  <CardTitle>{shift.name}</CardTitle>
                  <Badge variant="neutral" size="sm" className="mt-1">
                    {shift.code}
                  </Badge>
                </div>
                <button
                  onClick={() => {
                    setEditingShift(shift);
                    setName(shift.name);
                    setCode(shift.code);
                    setStartTime(shift.startTime);
                    setEndTime(shift.endTime);
                    setGraceMinutes(shift.graceMinutes);
                    setHalfDayThresholdHours(shift.halfDayThresholdHours);
                  }}
                  className="p-1.5 text-text-muted hover:text-gray-950 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl text-center">
                  <span className="text-[11px] text-text-muted font-medium">Standard Timings</span>
                  <p className="text-lg font-bold text-gray-950 mt-0.5">
                    {shift.startTime} – {shift.endTime}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Grace Period Buffer:</span>
                    <span className="font-semibold text-emerald-700">
                      {shift.graceMinutes} Minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Half-Day Threshold:</span>
                    <span className="font-semibold text-text-primary">
                      {shift.halfDayThresholdHours} Hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Assigned Employees:</span>
                    <span className="font-bold text-gray-950">
                      {assignedCount} Staff
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Shift Modal */}
      <Modal
        isOpen={isAddOpen || !!editingShift}
        onClose={() => {
          setIsAddOpen(false);
          setEditingShift(null);
        }}
        title={editingShift ? "Edit Shift Policy" : "Create New Shift Policy"}
      >
        <div className="space-y-4">
          <Input
            label="Shift Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Afternoon Support Shift"
            required
          />
          <Input
            label="Shift Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. AFT-01"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Shift Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="Shift End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Grace Minutes Buffer"
              type="number"
              value={graceMinutes}
              onChange={(e) => setGraceMinutes(Number(e.target.value))}
            />
            <Input
              label="Half-Day Min Hours"
              type="number"
              value={halfDayThresholdHours}
              onChange={(e) => setHalfDayThresholdHours(Number(e.target.value))}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                setEditingShift(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={editingShift ? handleUpdate : handleCreate}>
              Save Shift Policy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
