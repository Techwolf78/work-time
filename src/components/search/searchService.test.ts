import { ClientSearchService } from "./searchService";
import {
  Employee,
  Department,
  Designation,
  Branch,
  LeaveRequest,
  LeaveType,
  AttendanceRecord,
  AttendanceRegularization,
} from "../../types/hrms";

// Mock data strictly matching HRMS interfaces
const mockEmployees: Employee[] = [
  {
    id: "emp-1",
    employeeCode: "EMP-1001",
    firstName: "Aarav",
    lastName: "Sharma",
    email: "aarav.sharma@example.com",
    phone: "9876543210",
    gender: "MALE",
    dob: "1992-05-10",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    designationId: "desig-1",
    departmentId: "dept-1",
    branchId: "branch-1",
    joiningDate: "2022-01-01",
    status: "ACTIVE",
    employmentType: "FULL_TIME",
    shiftId: "shift-1",
    pan: "ABCDE1234F",
    aadhaar: "123456789012",
    uan: "100900800700",
    esicNumber: "3100012345",
    bankName: "HDFC Bank",
    accountNumber: "1234567890",
    ifscCode: "HDFC0001234",
    accountHolderName: "Aarav Sharma",
    monthlyCtc: 125000,
    annualCtc: 1500000,
  },
  {
    id: "emp-2",
    employeeCode: "EMP-1002",
    firstName: "Priya",
    lastName: "Patel",
    email: "priya.patel@example.com",
    phone: "9876543211",
    gender: "FEMALE",
    dob: "1994-08-20",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    designationId: "desig-2",
    departmentId: "dept-2",
    branchId: "branch-1",
    joiningDate: "2023-03-15",
    status: "ACTIVE",
    employmentType: "FULL_TIME",
    shiftId: "shift-1",
    pan: "PQRST5678G",
    aadhaar: "987654321098",
    uan: "100900800701",
    esicNumber: "3100012346",
    bankName: "ICICI Bank",
    accountNumber: "9876543210",
    ifscCode: "ICIC0005678",
    accountHolderName: "Priya Patel",
    monthlyCtc: 100000,
    annualCtc: 1200000,
  },
];

const mockDepartments: Department[] = [
  {
    id: "dept-1",
    name: "Engineering",
    code: "ENG",
    headEmployeeId: "emp-1",
    headName: "Aarav Sharma",
    budget: 15000000,
    openPositions: 3,
    description: "Core software engineering and infrastructure",
  },
  {
    id: "dept-2",
    name: "Human Resources",
    code: "HR",
    headEmployeeId: "emp-2",
    headName: "Priya Patel",
    budget: 5000000,
    openPositions: 1,
    description: "People operations and recruitment",
  },
];

const mockDesignations: Designation[] = [
  {
    id: "desig-1",
    title: "Software Engineer",
    code: "SE",
    departmentId: "dept-1",
    level: "L2",
    minCtc: 800000,
    maxCtc: 1800000,
  },
  {
    id: "desig-2",
    title: "HR Business Partner",
    code: "HRBP",
    departmentId: "dept-2",
    level: "L3",
    minCtc: 700000,
    maxCtc: 1400000,
  },
];

const mockBranches: Branch[] = [
  {
    id: "branch-1",
    name: "Bangalore HQ",
    code: "BLR",
    city: "Bangalore",
    state: "Karnataka",
    address: "Tower 4, Embassy Tech Village, Outer Ring Road",
    headCount: 32,
  },
];

const mockLeaveTypes: LeaveType[] = [
  {
    id: "lt-1",
    name: "Casual Leave",
    code: "CL",
    annualQuota: 12,
    monthlyAccrual: 1,
    carryForwardMax: 6,
    isEncashable: false,
    isPaid: true,
    color: "#10B981",
    description: "Casual time off for personal errands",
  },
];

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "lr-1",
    employeeId: "emp-1",
    leaveTypeId: "lt-1",
    fromDate: "2026-10-10",
    toDate: "2026-10-12",
    days: 3,
    isHalfDay: false,
    reason: "Family function",
    status: "APPROVED",
    appliedDate: "2026-10-01",
  },
  {
    id: "lr-2",
    employeeId: "emp-2",
    leaveTypeId: "lt-1",
    fromDate: "2026-10-15",
    toDate: "2026-10-16",
    days: 2,
    isHalfDay: false,
    reason: "Personal work",
    status: "PENDING",
    appliedDate: "2026-10-02",
  },
];

const mockAttendance: AttendanceRecord[] = [
  {
    id: "att-1",
    employeeId: "emp-1",
    date: "2026-10-06",
    shiftId: "shift-1",
    firstIn: "09:05",
    lastOut: "18:15",
    workingHours: 9.1,
    lateMinutes: 5,
    status: "PRESENT",
    punches: [],
  },
];

const mockRegularizations: AttendanceRegularization[] = [
  {
    id: "reg-1",
    employeeId: "emp-1",
    date: "2026-10-05",
    missingPunchType: "OUT",
    requestedTime: "18:00",
    reason: "System offline at gate",
    status: "PENDING",
    appliedDate: "2026-10-06",
  },
];

async function runTests() {
  console.log("=== RUNNING GLOBAL SEARCH ENGINE TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  };

  const service = new ClientSearchService({
    employees: mockEmployees,
    departments: mockDepartments,
    designations: mockDesignations,
    branches: mockBranches,
    leaveRequests: mockLeaveRequests,
    leaveTypes: mockLeaveTypes,
    attendance: mockAttendance,
    regularizations: mockRegularizations,
  });

  // TEST 1: Exact Employee Code Matching and Boosting
  const searchResult1 = await service.search({
    query: "EMP-1001",
    category: "PEOPLE",
    role: "SUPER_ADMIN",
  });
  const peopleGroup = searchResult1.groups.find((g) => g.category === "PEOPLE");
  assert(peopleGroup !== undefined, "Finds PEOPLE group on exact code");
  assert(peopleGroup?.items[0]?.title === "Aarav Sharma", "Exact match EMP-1001 returns Aarav Sharma first");

  // TEST 2: Category Filtering (Only ACTIVITY)
  const actResult = await service.search({
    query: "timeline",
    category: "ACTIVITY",
    role: "SUPER_ADMIN",
  });
  const actGroup = actResult.groups.find((g) => g.category === "ACTIVITY");
  assert(actGroup !== undefined && actGroup.items.length > 0, "Finds ACTIVITY group on query timeline");

  // TEST 3: Category Filtering (Only DEVICES)
  const devResult = await service.search({
    query: "windows",
    category: "DEVICES",
    role: "SUPER_ADMIN",
  });
  const devGroup = devResult.groups.find((g) => g.category === "DEVICES");
  assert(devGroup !== undefined && devGroup.items.length > 0, "Finds DEVICES group on query windows");

  // TEST 4: Pages and Settings Navigation Search
  const pageResult = await service.search({
    query: "timeline",
    category: "PAGES",
    role: "SUPER_ADMIN",
  });
  const pageGroup = pageResult.groups.find((g) => g.category === "PAGES");
  assert(
    pageGroup !== undefined && pageGroup.items.some((p) => p.path === "/time/timeline"),
    "Pages search indexes 24-Hour Continuous Timeline"
  );

  // TEST 5: Quick Actions Role Permissions
  const empActions = service.getQuickActions("EMPLOYEE", {
    onCloseSearch: () => {},
    navigate: () => {},
  });
  const adminActions = service.getQuickActions("SUPER_ADMIN", {
    onCloseSearch: () => {},
    navigate: () => {},
  });

  const empHasFleet = empActions.some((a) => a.id === "qa-fleet-telemetry");
  const adminHasFleet = adminActions.some((a) => a.id === "qa-fleet-telemetry");

  assert(!empHasFleet, "Employee cannot see 'qa-fleet-telemetry' quick action");
  assert(adminHasFleet, "Super Admin can see 'qa-fleet-telemetry' quick action");

  // TEST 7: AbortSignal Handling
  try {
    const controller = new AbortController();
    controller.abort();
    await service.search(
      {
        query: "Aarav",
        category: "ALL",
        role: "SUPER_ADMIN",
      },
      controller.signal
    );
    assert(false, "Aborted search should throw AbortError");
  } catch (err: any) {
    assert(err?.name === "AbortError", "Search honors AbortSignal cancellation");
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
