import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  Plus,
  Coins,
  Briefcase,
  ChevronRight,
  Edit,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { useHrms } from "../../lib/hrmsContext";
import { Department } from "../../types/hrms";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Drawer } from "../../components/ui/Drawer";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Avatar } from "../../components/ui/Avatar";
import { formatCompactINR, formatINR } from "../../lib/utils";

export function DepartmentsPage() {
  const navigate = useNavigate();
  const { departments, employees, addDepartment, updateDepartment, deleteDepartment } = useHrms();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [viewingDept, setViewingDept] = useState<Department | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [headEmployeeId, setHeadEmployeeId] = useState(employees[0]?.id || "EMP-1001");
  const [budget, setBudget] = useState(25000000);
  const [openPositions, setOpenPositions] = useState(2);
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name || !code) return;
    const head = employees.find((e) => e.id === headEmployeeId);
    addDepartment({
      name,
      code: code.toUpperCase(),
      headEmployeeId,
      headName: head ? `${head.firstName} ${head.lastName}` : "Director",
      budget: Number(budget),
      openPositions: Number(openPositions),
      description: description || "Corporate business operations unit.",
    });
    setName("");
    setCode("");
    setIsAddOpen(false);
  };

  const handleUpdate = () => {
    if (!editingDept) return;
    const head = employees.find((e) => e.id === headEmployeeId);
    updateDepartment(editingDept.id, {
      name,
      code: code.toUpperCase(),
      headEmployeeId,
      headName: head ? `${head.firstName} ${head.lastName}` : editingDept.headName,
      budget: Number(budget),
      openPositions: Number(openPositions),
      description,
    });
    setEditingDept(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
            Departments
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Organize functional units, department heads, headcount budgets, and staffing.
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
          Add Department
        </Button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => {
          const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
          const deptMonthlyPayroll = deptEmployees.reduce((sum, e) => sum + e.monthlyCtc, 0);

          return (
            <Card
              key={dept.id}
              className="hover:border-gray-300 hover:shadow-card-hover transition-all duration-200 cursor-pointer"
              onClick={() => setViewingDept(dept)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900 font-bold">
                    <Building2 className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle>{dept.name}</CardTitle>
                    <Badge variant="neutral" size="sm" className="mt-0.5">
                      {dept.code}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setEditingDept(dept);
                      setName(dept.name);
                      setCode(dept.code);
                      setBudget(dept.budget);
                      setOpenPositions(dept.openPositions);
                      setDescription(dept.description);
                      setHeadEmployeeId(dept.headEmployeeId);
                    }}
                    className="p-1.5 text-text-muted hover:text-gray-950 hover:bg-gray-100 rounded-lg"
                    title="Edit Department"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (deptEmployees.length > 0) {
                        alert(`Cannot delete department with ${deptEmployees.length} active employees.`);
                        return;
                      }
                      deleteDepartment(dept.id);
                    }}
                    className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Delete Department"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {dept.description}
                </p>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-surface-subtle/60 rounded-xl text-xs">
                  <div>
                    <span className="text-[11px] text-text-muted">Staffing</span>
                    <p className="font-bold text-text-primary mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-700" />
                      {deptEmployees.length} Members
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-text-muted">Openings</span>
                    <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {dept.openPositions} Jobs
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-text-muted">Monthly CTC</span>
                    <p className="font-bold text-gray-950 mt-0.5">
                      {formatCompactINR(deptMonthlyPayroll)}
                    </p>
                  </div>
                </div>

                {/* Head Info */}
                <div className="pt-2 flex items-center justify-between text-xs border-t border-surface-border">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">Department Lead:</span>
                    <span className="font-semibold text-text-primary">{dept.headName}</span>
                  </div>
                  <span className="text-gray-900 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Team <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isAddOpen || !!editingDept}
        onClose={() => {
          setIsAddOpen(false);
          setEditingDept(null);
        }}
        title={editingDept ? "Edit Department" : "Create New Department"}
      >
        <div className="space-y-4">
          <Input
            label="Department Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sales & Customer Success"
            required
          />
          <Input
            label="Code / Acronym"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. SCS"
            required
          />
          <Select
            label="Department Head"
            value={headEmployeeId}
            onChange={(e) => setHeadEmployeeId(e.target.value)}
            options={employees.map((e) => ({
              label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
              value: e.id,
            }))}
          />
          <Input
            label="Annual Operational Budget (INR)"
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
          <Input
            label="Open Job Positions"
            type="number"
            value={openPositions}
            onChange={(e) => setOpenPositions(Number(e.target.value))}
          />
          <Input
            label="Department Mission / Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key functional mandate and responsibilities"
          />

          <div className="pt-4 flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                setEditingDept(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={editingDept ? handleUpdate : handleCreate}
            >
              {editingDept ? "Save Changes" : "Create Department"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Department Detail Drawer (View Team Members) */}
      <Drawer
        isOpen={!!viewingDept}
        onClose={() => setViewingDept(null)}
        title={viewingDept?.name}
        subtitle={`${viewingDept?.code} • ${employees.filter((e) => e.departmentId === viewingDept?.id).length} Active Team Members`}
      >
        {viewingDept && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <span className="font-semibold text-gray-950">Department Mandate</span>
              <p className="text-text-secondary">{viewingDept.description}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                Team Members
              </h4>
              <div className="divide-y divide-gray-100">
                {employees
                  .filter((e) => e.departmentId === viewingDept.id)
                  .map((emp) => (
                    <div
                      key={emp.id}
                      className="py-3 flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 transition-colors cursor-pointer"
                      onClick={() => navigate(`/people/employees/${emp.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={emp.avatar}
                          name={`${emp.firstName} ${emp.lastName}`}
                          size="sm"
                        />
                        <div>
                          <p className="text-xs font-semibold text-text-primary">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[11px] text-text-muted">{emp.email}</p>
                        </div>
                      </div>
                      <Badge variant="neutral" size="sm">
                        {emp.employeeCode}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
