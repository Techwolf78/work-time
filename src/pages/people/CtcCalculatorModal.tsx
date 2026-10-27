import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Calculator,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { formatINR } from "../../lib/utils";

export type BonusFrequency = "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";

export interface CtcCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGross?: number;
  initialBonusAmount?: number;
  initialBonusFrequency?: BonusFrequency;
  initialIncludeBonus?: boolean;
  onApply?: (data: {
    monthlyGross: number;
    annualCtc: number;
    basicMonthly: number;
    hraMonthly: number;
    specialMonthly: number;
    pfMonthly: number;
    esiMonthly: number;
    ptMonthly: number;
    netInHand: number;
    bonusAmount: number;
    bonusFrequency: BonusFrequency;
    bonusAnnual: number;
    bonusMonthlyEquivalent: number;
    totalCtcWithBonus: number;
    employerPfMonthly?: number;
    employerEsiMonthly?: number;
    epsMonthly?: number;
    epfEmployerMonthly?: number;
  }) => void;
}

interface SalaryComponentRow {
  id: string;
  name: string;
  type: "PERCENT" | "FIXED";
  value: number; // percentage or fixed amount
  category: "EARNING" | "EMPLOYEE_DEDUCTION" | "EMPLOYER_DEDUCTION";
  isDeletable?: boolean;
}

/**
 * Calculates TDS under the New Tax Regime (FY 2025-26 rules).
 * Standard deduction: ₹75,000.
 * Section 87A rebate makes taxable income up to ₹12,00,000 have ₹0 tax liability.
 */
function calculateNewRegimeTds(annualGross: number): { monthlyTds: number; annualTds: number; note: string } {
  const standardDeduction = 75000;
  const taxableIncome = Math.max(0, annualGross - standardDeduction);

  // Under New Regime FY 2025-26, full tax rebate under Section 87A for taxable income up to 12,00,000 (Tax = 0)
  if (taxableIncome <= 1200000) {
    return {
      monthlyTds: 0,
      annualTds: 0,
      note: "₹0 Taxable below ₹12L (Rebate u/s 87A)",
    };
  }

  // Slabs for taxable income > 12L
  // 0 - 4L: 0%
  // 4L - 8L (400,000 @ 5%): 20,000
  // 8L - 12L (400,000 @ 10%): 40,000
  // 12L - 16L (400,000 @ 15%): 60,000
  // 16L - 20L (400,000 @ 20%): 80,000
  // 20L - 24L (400,000 @ 25%): 1,00,000
  // Above 24L: 30%
  let tax = 0;
  if (taxableIncome > 400000) {
    tax += Math.min(taxableIncome - 400000, 400000) * 0.05;
  }
  if (taxableIncome > 800000) {
    tax += Math.min(taxableIncome - 800000, 400000) * 0.10;
  }
  if (taxableIncome > 1200000) {
    tax += Math.min(taxableIncome - 1200000, 400000) * 0.15;
  }
  if (taxableIncome > 1600000) {
    tax += Math.min(taxableIncome - 1600000, 400000) * 0.20;
  }
  if (taxableIncome > 2000000) {
    tax += Math.min(taxableIncome - 2000000, 400000) * 0.25;
  }
  if (taxableIncome > 2400000) {
    tax += (taxableIncome - 2400000) * 0.30;
  }

  // 4% Health & Education Cess
  const totalTax = Math.round(tax * 1.04);
  const monthlyTds = Math.round(totalTax / 12);

  return {
    monthlyTds,
    annualTds: totalTax,
    note: `₹${monthlyTds.toLocaleString("en-IN")}/mo (New Regime Slabs)`,
  };
}

export function CtcCalculatorModal({
  isOpen,
  onClose,
  initialGross = 40000,
  initialBonusAmount = 0,
  initialBonusFrequency = "YEARLY",
  initialIncludeBonus = false,
  onApply,
}: CtcCalculatorModalProps) {
  const [monthlyGross, setMonthlyGross] = useState<number>(initialGross || 40000);
  const [grossInputStr, setGrossInputStr] = useState<string>(() => String(initialGross || 40000));
  const [isPfChecked, setIsPfChecked] = useState<boolean>(true);
  const [isEsiChecked, setIsEsiChecked] = useState<boolean>((initialGross || 40000) / 2 <= 21000);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      const gross = initialGross ?? 40000;
      setMonthlyGross(gross);
      setGrossInputStr(gross > 0 ? String(gross) : "");
      setBonusAmount(initialBonusAmount || 0);
      setBonusFrequency(initialBonusFrequency || "YEARLY");
      setIncludeBonus(initialIncludeBonus || (Boolean(initialBonusAmount) && initialBonusAmount > 0));
      setIsPfChecked(true);
      setIsEsiChecked(gross / 2 <= 21000);
    }
  }, [isOpen, initialGross, initialBonusAmount, initialBonusFrequency, initialIncludeBonus]);

  // Handle Gross input change: clean non-digits and eliminate annoying leading zeros (e.g. 025000 -> 25000)
  const handleGrossChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, "");
    const cleaned = digitsOnly.replace(/^0+(?=\d)/, "");
    setGrossInputStr(cleaned);
    const num = cleaned === "" ? 0 : Number(cleaned);
    setMonthlyGross(num);
  };

  const handleGrossBlur = () => {
    if (!grossInputStr || Number(grossInputStr) === 0) {
      if (grossInputStr === "") {
        setGrossInputStr("0");
        setMonthlyGross(0);
      }
    } else {
      setGrossInputStr(String(monthlyGross));
    }
  };

  // Performance Bonus state (Monthly, Quarterly, Half Yearly, Yearly) - OFF by default
  const [includeBonus, setIncludeBonus] = useState<boolean>(initialIncludeBonus || (Boolean(initialBonusAmount) && initialBonusAmount > 0));
  const [bonusFrequency, setBonusFrequency] = useState<BonusFrequency>(initialBonusFrequency || "YEARLY");
  const [bonusAmount, setBonusAmount] = useState<number>(initialBonusAmount || 0);

  // Accordion open/close state
  const [isEarningsOpen, setIsEarningsOpen] = useState(true);
  const [isDeductionsOpen, setIsDeductionsOpen] = useState(true);

  // Components state (default components compliant with Indian payroll standards)
  const [components, setComponents] = useState<SalaryComponentRow[]>([
    { id: "basic", name: "Basic", type: "PERCENT", value: 50, category: "EARNING", isDeletable: false },
    { id: "hra", name: "HRA", type: "PERCENT", value: 30, category: "EARNING", isDeletable: true },
    { id: "special", name: "Special Allowance", type: "PERCENT", value: 20, category: "EARNING", isDeletable: true },
    { id: "pf_emp", name: "PF - Employee Contribution", type: "PERCENT", value: 12, category: "EMPLOYEE_DEDUCTION", isDeletable: true },
    { id: "esi_emp", name: "ESI - Employee Contribution", type: "PERCENT", value: 0.75, category: "EMPLOYEE_DEDUCTION", isDeletable: true },
    { id: "pt", name: "Profession Tax", type: "FIXED", value: 200, category: "EMPLOYEE_DEDUCTION", isDeletable: true },
    { id: "tds", name: "TDS / Income Tax (New Regime)", type: "PERCENT", value: 0, category: "EMPLOYEE_DEDUCTION", isDeletable: true },
  ]);

  // Handle value change for a component
  const updateComponentValue = (id: string, newVal: number) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: Math.max(0, newVal) } : c))
    );
  };

  // Toggle component type between PERCENT (%) and FIXED (₹)
  const toggleComponentType = (id: string) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (c.type === "PERCENT") {
          // Switching from % to ₹ (rupees): calculate percentage of monthlyGross
          const rupeeVal = Math.round((monthlyGross * c.value) / 100);
          return { ...c, type: "FIXED", value: rupeeVal };
        } else {
          // Switching from ₹ to % (percentage): calculate percentage of monthlyGross
          const pct = monthlyGross > 0 ? Math.round((c.value / monthlyGross) * 100) : 0;
          return { ...c, type: "PERCENT", value: pct };
        }
      })
    );
  };

  // Remove component
  const removeComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  };

  // Add component helper
  const addComponent = (
    name: string,
    category: "EARNING" | "EMPLOYEE_DEDUCTION" | "EMPLOYER_DEDUCTION",
    type: "PERCENT" | "FIXED",
    defaultValue: number
  ) => {
    if (name.toLowerCase().includes("performance bonus")) {
      setIncludeBonus(true);
      if (bonusAmount <= 0) setBonusAmount(25000);
      return;
    }
    const existing = components.find((c) => c.name === name);
    if (existing) return;
    const newRow: SalaryComponentRow = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      category,
      type,
      value: defaultValue,
      isDeletable: true,
    };
    setComponents((prev) => [...prev, newRow]);
  };

  // Performance Bonus Calculations based on user selected frequency
  const bonusMetrics = useMemo(() => {
    if (!includeBonus || bonusAmount <= 0) {
      return {
        annualBonus: 0,
        monthlyBonusEquivalent: 0,
        frequencyLabel: "None",
        periodLabel: "None",
        periodCount: 0,
        displayLabel: "Disabled",
      };
    }

    switch (bonusFrequency) {
      case "MONTHLY": {
        const annualBonus = bonusAmount * 12;
        return {
          annualBonus,
          monthlyBonusEquivalent: bonusAmount,
          frequencyLabel: "Monthly",
          periodLabel: "Month",
          periodCount: 12,
          displayLabel: `₹${bonusAmount.toLocaleString("en-IN")} / month`,
        };
      }
      case "QUARTERLY": {
        const annualBonus = bonusAmount * 4;
        const monthlyBonusEquivalent = Math.round(annualBonus / 12);
        return {
          annualBonus,
          monthlyBonusEquivalent,
          frequencyLabel: "Quarterly",
          periodLabel: "Quarter",
          periodCount: 4,
          displayLabel: `₹${bonusAmount.toLocaleString("en-IN")} / quarter`,
        };
      }
      case "HALF_YEARLY": {
        const annualBonus = bonusAmount * 2;
        const monthlyBonusEquivalent = Math.round(annualBonus / 12);
        return {
          annualBonus,
          monthlyBonusEquivalent,
          frequencyLabel: "Half Yearly",
          periodLabel: "Half-Year",
          periodCount: 2,
          displayLabel: `₹${bonusAmount.toLocaleString("en-IN")} / half-year`,
        };
      }
      case "YEARLY": {
        const annualBonus = bonusAmount;
        const monthlyBonusEquivalent = Math.round(annualBonus / 12);
        return {
          annualBonus,
          monthlyBonusEquivalent,
          frequencyLabel: "Yearly",
          periodLabel: "Year",
          periodCount: 1,
          displayLabel: `₹${bonusAmount.toLocaleString("en-IN")} / year`,
        };
      }
    }
  }, [includeBonus, bonusFrequency, bonusAmount]);

  // Main Indian Payroll & CTC Calculations Engine
  const calculations = useMemo(() => {
    // 1. Basic calculation (Default 50% of Gross for Code on Wages compliance)
    const basicComp = components.find((c) => c.id === "basic");
    const basicType = basicComp?.type || "PERCENT";
    const basicVal = basicComp ? basicComp.value : 50;
    const basicMonthly = basicType === "PERCENT"
      ? Math.round((monthlyGross * basicVal) / 100)
      : basicVal;
    const basicAnnual = basicMonthly * 12;

    // 2. HRA calculation (percentage of Gross or fixed rupees)
    const hraComp = components.find((c) => c.id === "hra");
    const hraType = hraComp?.type || "PERCENT";
    const hraVal = hraComp ? hraComp.value : 30;
    const hraMonthly = hraComp
      ? hraType === "PERCENT"
        ? Math.round((monthlyGross * hraVal) / 100)
        : hraVal
      : 0;
    const hraAnnual = hraMonthly * 12;

    // 3. Other fixed earnings (Conveyance, Medical, custom allowances)
    const otherEarningsComps = components.filter(
      (c) =>
        c.category === "EARNING" &&
        c.id !== "basic" &&
        c.id !== "hra" &&
        c.id !== "special" &&
        !c.name.toLowerCase().includes("performance bonus")
    );
    const calculatedOtherEarnings = otherEarningsComps.map((c) => {
      const monthly = c.type === "PERCENT" ? Math.round((monthlyGross * c.value) / 100) : c.value;
      return {
        ...c,
        monthly,
        annual: monthly * 12,
      };
    });
    const totalOtherEarningsMonthly = calculatedOtherEarnings.reduce((acc, curr) => acc + curr.monthly, 0);

    // 4. Special Allowance (percentage of Gross or fixed rupees)
    const specialComp = components.find((c) => c.id === "special");
    const specialType = specialComp?.type || "PERCENT";
    const specialVal = specialComp ? specialComp.value : 20;
    const specialMonthly = specialComp
      ? specialType === "PERCENT"
        ? Math.round((monthlyGross * specialVal) / 100)
        : specialVal
      : 0;
    const specialAnnual = specialMonthly * 12;

    // Compiled calculated earnings for table
    const calculatedEarnings = [
      ...(basicComp
        ? [
            {
              id: "basic",
              name: "Basic",
              type: basicType,
              value: basicVal,
              monthly: basicMonthly,
              annual: basicAnnual,
              isDeletable: false,
            },
          ]
        : []),
      ...(hraComp
        ? [
            {
              id: "hra",
              name: "HRA",
              type: hraType,
              value: hraVal,
              monthly: hraMonthly,
              annual: hraAnnual,
              isDeletable: true,
            },
          ]
        : []),
      ...(specialComp
        ? [
            {
              id: "special",
              name: "Special Allowance",
              type: specialType,
              value: specialVal,
              monthly: specialMonthly,
              annual: specialAnnual,
              isDeletable: true,
            },
          ]
        : []),
      ...calculatedOtherEarnings,
    ];

    const totalGrossMonthly = calculatedEarnings.reduce((sum, item) => sum + item.monthly, 0);
    const totalGrossAnnual = totalGrossMonthly * 12;

    // 5. Employer Contributions (PF, EPS, EPF, ESI)
    // Excel formula: =IF((F4+F6)>25000, 3250, ROUND((F4+F6)*0.13, 0))
    const pfCeiling = 25000;
    const pfWages = basicMonthly + specialMonthly;
    const isPfCapped = pfWages > pfCeiling;
    const pfCeilingNote = isPfChecked
      ? isPfCapped
        ? `Capped at ₹${pfCeiling.toLocaleString("en-IN")} wage ceiling (Max ₹3,000 / ₹3,250)`
        : `PF on ₹${pfWages.toLocaleString("en-IN")} (Basic + Special Allowance)`
      : "PF Disabled";

    // Employer PF = IF((Basic+Special)>25000, 3250, ROUND((Basic+Special)*0.13, 0))
    const employerPfMonthly = isPfChecked ? (isPfCapped ? 3250 : Math.round(pfWages * 0.13)) : 0;
    const employerPfAnnual = employerPfMonthly * 12;

    // EPS = 8.33% of pfWages [capped at max ₹2,083/mo]
    const epsMonthly = isPfChecked ? Math.min(2083, Math.round(Math.min(pfWages, pfCeiling) * 0.0833)) : 0;
    const epsAnnual = epsMonthly * 12;

    // EPF Employer = Employer PF (12%) - EPS (8.33%) [approx 3.67%]
    const epfEmployerMonthly = Math.max(0, (isPfCapped ? 3000 : Math.round(pfWages * 0.12)) - epsMonthly);
    const epfEmployerAnnual = epfEmployerMonthly * 12;

    // Employer ESI = IF((Gross/2)>21000, 0, ROUND(Basic*3.25%, 0))
    const isEsiApplicable = (totalGrossMonthly / 2) <= 21000;
    const employerEsiMonthly = isEsiChecked && isEsiApplicable ? Math.round(basicMonthly * 0.0325) : 0;
    const employerEsiAnnual = employerEsiMonthly * 12;

    const totalEmployerMonthly = employerPfMonthly + employerEsiMonthly;
    const totalEmployerAnnual = employerPfAnnual + employerEsiAnnual;

    // 6. Total Cost to Company (CTC) = Gross + Employer Contributions + Bonus
    const bonusMonthly = bonusMetrics.monthlyBonusEquivalent;
    const bonusAnnual = bonusMetrics.annualBonus;
    const totalCtcMonthly = totalGrossMonthly + totalEmployerMonthly + bonusMonthly;
    const totalCtcAnnual = totalGrossAnnual + totalEmployerAnnual + bonusAnnual;

    // 7. Employee Deductions (Deducted from Gross)
    // Employee PF = IF((Basic+Special)>25000, 3000, ROUND((Basic+Special)*0.12, 0))
    const employeePfMonthly = isPfChecked ? (isPfCapped ? 3000 : Math.round(pfWages * 0.12)) : 0;
    const employeePfAnnual = employeePfMonthly * 12;

    // Employee ESI = IF((Gross/2)>21000, 0, ROUND(Basic*0.0075, 0))
    const employeeEsiMonthly = isEsiChecked && isEsiApplicable ? Math.round(basicMonthly * 0.0075) : 0;
    const employeeEsiAnnual = employeeEsiMonthly * 12;

    // Profession Tax (PT) = IF(Gross>10000, 200, IF(Gross>7500, 175, 0))
    const ptComp = components.find((c) => c.id === "pt");
    const ptDefault = totalGrossMonthly > 10000 ? 200 : totalGrossMonthly > 7500 ? 175 : 0;
    const ptMonthly = ptComp ? (ptComp.value !== undefined ? ptComp.value : ptDefault) : 0;
    const ptAnnual = ptMonthly * 12;

    // TDS Auto-calculation (New Tax Regime FY 2025-26)
    const tdsResult = calculateNewRegimeTds(totalGrossAnnual);
    const tdsComp = components.find((c) => c.id === "tds");
    const tdsMonthly = tdsComp ? (tdsComp.value > 0 ? tdsComp.value : tdsResult.monthlyTds) : 0;
    const tdsAnnual = tdsMonthly * 12;

    // Custom other deductions
    const otherDeductionsComps = components.filter(
      (c) =>
        c.category === "EMPLOYEE_DEDUCTION" &&
        c.id !== "pf_emp" &&
        c.id !== "esi_emp" &&
        c.id !== "pt" &&
        c.id !== "tds"
    );
    const calculatedOtherDeductions = otherDeductionsComps.map((c) => {
      const monthly = c.type === "PERCENT" ? Math.round((monthlyGross * c.value) / 100) : c.value;
      return {
        ...c,
        monthly,
        annual: monthly * 12,
      };
    });
    const totalOtherDeductionsMonthly = calculatedOtherDeductions.reduce((acc, curr) => acc + curr.monthly, 0);

    const totalDeductionsMonthly =
      employeePfMonthly + employeeEsiMonthly + ptMonthly + tdsMonthly + totalOtherDeductionsMonthly;
    const totalDeductionsAnnual = totalDeductionsMonthly * 12;

    // 8. Net In-Hand (Take-Home Pay) = Gross - Deductions
    const netInHandMonthly = Math.max(0, totalGrossMonthly - totalDeductionsMonthly);
    const netInHandAnnual = netInHandMonthly * 12;

    // 9. Code on Wages compliance: Basic >= 50% of Gross
    const basicRatio = (basicMonthly / monthlyGross) * 100;
    const isCodeOnWagesCompliant = basicRatio >= 50;

    return {
      basicMonthly,
      basicAnnual,
      basicPercent: basicVal,
      hraMonthly,
      hraAnnual,
      hraPercent: hraVal,
      specialMonthly,
      specialAnnual,
      calculatedEarnings,
      totalGrossMonthly,
      totalGrossAnnual,
      employerPfMonthly,
      employerPfAnnual,
      epsMonthly,
      epsAnnual,
      epfEmployerMonthly,
      epfEmployerAnnual,
      pfCeilingNote,
      isPfCapped,
      isEsiApplicable,
      employerEsiMonthly,
      employerEsiAnnual,
      totalEmployerMonthly,
      totalEmployerAnnual,
      totalCtcMonthly,
      totalCtcAnnual,
      employeePfMonthly,
      employeePfAnnual,
      employeeEsiMonthly,
      employeeEsiAnnual,
      ptMonthly,
      ptAnnual,
      tdsMonthly,
      tdsAnnual,
      tdsNote: tdsResult.note,
      calculatedOtherDeductions,
      totalDeductionsMonthly,
      totalDeductionsAnnual,
      netInHandMonthly,
      netInHandAnnual,
      basicRatio,
      isCodeOnWagesCompliant,
    };
  }, [monthlyGross, components, isPfChecked, isEsiChecked, bonusMetrics]);

  const handleApply = () => {
    if (onApply) {
      onApply({
        monthlyGross,
        annualCtc: calculations.totalCtcAnnual,
        basicMonthly: calculations.basicMonthly,
        hraMonthly: calculations.hraMonthly,
        specialMonthly: calculations.specialMonthly,
        pfMonthly: calculations.employeePfMonthly,
        esiMonthly: calculations.employeeEsiMonthly,
        ptMonthly: calculations.ptMonthly,
        netInHand: calculations.netInHandMonthly,
        bonusAmount: includeBonus ? bonusAmount : 0,
        bonusFrequency,
        bonusAnnual: bonusMetrics.annualBonus,
        bonusMonthlyEquivalent: bonusMetrics.monthlyBonusEquivalent,
        totalCtcWithBonus: calculations.totalCtcAnnual,
        employerPfMonthly: calculations.employerPfMonthly,
        employerEsiMonthly: calculations.employerEsiMonthly,
        epsMonthly: calculations.epsMonthly,
        epfEmployerMonthly: calculations.epfEmployerMonthly,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Main Container styled with clean GA-HRMS design, strictly bounded in viewport */}
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[94vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-10 animate-scale-in">
        {/* Compact Modal Header */}
        <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-gray-900 shrink-0">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-950 tracking-tight">
                CTC Compensation Calculator
              </h3>
              <span className="text-[11px] text-gray-400 font-normal hidden md:inline">
                • Simulate gross salary, statutory PF/ESI, & net take-home
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-950 p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Executive Top KPI Toolbar (Compact Single Bar) */}
        <div className="px-4 py-1.5 bg-gray-50/90 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Quick Metrics & Gross Input */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Monthly Gross Input */}
              <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-gray-300 shadow-2xs focus-within:border-gray-950 focus-within:ring-1 focus-within:ring-gray-950">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Gross:</span>
                <span className="text-xs font-bold text-gray-400">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={grossInputStr}
                  onChange={handleGrossChange}
                  onBlur={handleGrossBlur}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className="w-20 text-xs font-bold text-gray-950 bg-transparent focus:outline-none font-mono"
                />
                <span className="text-[10px] text-gray-400 font-mono">
                  ({formatINR(calculations.totalGrossAnnual)}/yr)
                </span>
              </div>

              {/* Annual CTC Badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-md border border-gray-200 shadow-2xs text-xs font-mono">
                <span className="text-[10px] font-bold text-gray-500 uppercase font-sans">CTC:</span>
                <span className="font-bold text-gray-950">{formatINR(calculations.totalCtcAnnual)}</span>
                <span className="text-[10px] text-gray-500 font-sans">({(calculations.totalCtcAnnual / 100000).toFixed(2)} LPA)</span>
              </div>

              {/* Monthly Deductions Badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-md border border-gray-200 shadow-2xs text-xs font-mono">
                <span className="text-[10px] font-bold text-gray-500 uppercase font-sans">Deductions:</span>
                <span className="font-bold text-red-600">-{formatINR(calculations.totalDeductionsMonthly)}</span>
                <span className="text-[10px] text-gray-400">/mo</span>
              </div>

              {/* Net Take-Home Badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md shadow-2xs text-xs font-mono">
                <span className="text-[10px] font-bold text-emerald-800 uppercase font-sans">Take-Home:</span>
                <span className="font-bold text-emerald-950">{formatINR(calculations.netInHandMonthly)}</span>
                <span className="text-[10px] text-emerald-700 font-sans">/mo</span>
              </div>

              {/* Performance Bonus (if active) */}
              {includeBonus && bonusAmount > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 rounded-md shadow-2xs text-xs font-mono">
                  <span className="text-[10px] font-bold text-purple-800 uppercase font-sans">Bonus:</span>
                  <span className="font-bold text-purple-950">+{formatINR(bonusMetrics.annualBonus)}</span>
                  <span className="text-[10px] text-purple-700 font-sans">({bonusMetrics.frequencyLabel})</span>
                </div>
              )}
            </div>

            {/* Statutory Checkboxes Inline Right */}
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 hover:text-gray-950">
                <input
                  type="checkbox"
                  checked={isPfChecked}
                  onChange={(e) => setIsPfChecked(e.target.checked)}
                  className="w-3.5 h-3.5 text-gray-950 rounded border-gray-300 focus:ring-gray-950/20 cursor-pointer accent-gray-950"
                />
                <span className="text-[11px] font-medium">PF (12%)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 hover:text-gray-950">
                <input
                  type="checkbox"
                  checked={isEsiChecked}
                  onChange={(e) => setIsEsiChecked(e.target.checked)}
                  className="w-3.5 h-3.5 text-gray-950 rounded border-gray-300 focus:ring-gray-950/20 cursor-pointer accent-gray-950"
                />
                <span className="text-[11px] font-medium">ESIC</span>
              </label>

              <span className="text-[10px] text-gray-400 border-l border-gray-200 pl-2 hidden sm:inline">
                New Tax Regime
              </span>
            </div>
          </div>
        </div>

        {/* Main Body: 2 Columns with no nested scrollbar trap */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Library Column (Compact w-56) */}
          <div className="w-full md:w-56 shrink-0 border-r border-gray-200 bg-gray-50/40 p-2 space-y-1.5 overflow-y-auto">
            <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-0.5 px-1">
              Add Salary Components
            </div>

            {/* Allowances Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-2xs">
              <button
                onClick={() => setIsEarningsOpen(!isEarningsOpen)}
                className="w-full px-2.5 py-1.5 bg-gray-50 flex items-center justify-between text-xs font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <span>Allowances & Earnings</span>
                {isEarningsOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
              </button>
              {isEarningsOpen && (
                <div className="p-1.5 space-y-1 text-xs divide-y divide-gray-100">
                  <div className="flex items-center justify-between py-1 px-1.5 hover:bg-gray-50 rounded">
                    <span className="text-gray-700">Conveyance (₹1,600)</span>
                    {components.some((c) => c.id === "conveyance") ? (
                      <span className="text-[10px] text-gray-400 font-medium px-1">Added</span>
                    ) : (
                      <button
                        onClick={() => addComponent("Conveyance Allowance", "EARNING", "FIXED", 1600)}
                        className="p-1 rounded text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-colors"
                        title="Add to Earnings"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between py-1 px-1.5 hover:bg-gray-50 rounded">
                    <span className="text-gray-700">Medical (₹1,250)</span>
                    {components.some((c) => c.id === "medical") ? (
                      <span className="text-[10px] text-gray-400 font-medium px-1">Added</span>
                    ) : (
                      <button
                        onClick={() => addComponent("Medical Allowance", "EARNING", "FIXED", 1250)}
                        className="p-1 rounded text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-colors"
                        title="Add to Earnings"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between py-1 px-1.5 hover:bg-gray-50 rounded">
                    <span className="text-gray-700">Special Allowance</span>
                    {components.some((c) => c.id === "special") ? (
                      <span className="text-[10px] text-gray-400 font-medium px-1">Added</span>
                    ) : (
                      <button
                        onClick={() => addComponent("Special Allowance", "EARNING", "PERCENT", 20)}
                        className="p-1 rounded text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-colors"
                        title="Add to Earnings"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between py-1 px-1.5 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-700">Performance Bonus</span>
                      {includeBonus && (
                        <span className="text-[9px] font-semibold text-gray-800 bg-gray-100 px-1 rounded border border-gray-200">
                          Active
                        </span>
                      )}
                    </div>
                    {includeBonus ? (
                      <span className="text-[10px] text-gray-500 font-medium px-1">Active</span>
                    ) : (
                      <button
                        onClick={() => {
                          setIncludeBonus(true);
                          if (bonusAmount <= 0) setBonusAmount(25000);
                        }}
                        className="p-1 rounded text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-colors"
                        title="Add Performance Bonus"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Deductions Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-2xs">
              <button
                onClick={() => setIsDeductionsOpen(!isDeductionsOpen)}
                className="w-full px-2.5 py-1.5 bg-gray-50 flex items-center justify-between text-xs font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <span>Deductions & Statutory</span>
                {isDeductionsOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
              </button>
              {isDeductionsOpen && (
                <div className="p-1.5 space-y-1 text-xs divide-y divide-gray-100">
                  <div className="flex items-center justify-between py-1 px-1.5 hover:bg-gray-50 rounded">
                    <span className="text-gray-700">PF - Employee (12%)</span>
                    {components.some((c) => c.id === "pf_emp") ? (
                      <span className="text-[10px] text-gray-400 font-medium px-1">Added</span>
                    ) : (
                      <button
                        onClick={() => addComponent("PF - Employee Contribution", "EMPLOYEE_DEDUCTION", "PERCENT", 12)}
                        className="p-1 rounded text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between py-1 px-1.5 hover:bg-gray-50 rounded">
                    <span className="text-gray-700">ESI - Employee (0.75%)</span>
                    {components.some((c) => c.id === "esi_emp") ? (
                      <span className="text-[10px] text-gray-400 font-medium px-1">Added</span>
                    ) : (
                      <button
                        onClick={() => addComponent("ESI - Employee Contribution", "EMPLOYEE_DEDUCTION", "PERCENT", 0.75)}
                        className="p-1 rounded text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between py-1 px-1.5 hover:bg-gray-50 rounded">
                    <span className="text-gray-700">Profession Tax (₹200)</span>
                    {components.some((c) => c.id === "pt") ? (
                      <span className="text-[10px] text-gray-400 font-medium px-1">Added</span>
                    ) : (
                      <button
                        onClick={() => addComponent("Profession Tax", "EMPLOYEE_DEDUCTION", "FIXED", 200)}
                        className="p-1 rounded text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between py-1 px-1.5 hover:bg-gray-50 rounded">
                    <span className="text-gray-700">TDS / Income Tax</span>
                    {components.some((c) => c.id === "tds") ? (
                      <span className="text-[10px] text-gray-400 font-medium px-1">Added</span>
                    ) : (
                      <button
                        onClick={() => addComponent("TDS / Income Tax (New Regime)", "EMPLOYEE_DEDUCTION", "PERCENT", 0)}
                        className="p-1 rounded text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Table Column: Fixed Header + Smooth Scroll Body + Executive Summary */}
          <div className="flex-1 min-w-0 flex flex-col bg-white overflow-hidden">
            {/* Scrollable Table Area with Bulletproof Sticky Header */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs border-separate border-spacing-0 table-fixed">
                <colgroup>
                  <col className="w-[32%]" />
                  <col className="w-[28%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[4%]" />
                </colgroup>

                <thead className="sticky top-0 z-20">
                  <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-bold shadow-2xs">
                    <th className="py-1.5 px-3 font-bold bg-gray-50 border-b border-gray-200 text-gray-600">
                      Salary Component
                    </th>
                    <th className="py-1.5 px-3 font-bold bg-gray-50 border-b border-gray-200 text-gray-600">
                      Type & Split
                    </th>
                    <th className="py-1.5 px-3 text-right font-bold bg-gray-50 border-b border-gray-200 text-gray-600 whitespace-nowrap">
                      Monthly (₹)
                    </th>
                    <th className="py-1.5 px-3 text-right font-bold bg-gray-50 border-b border-gray-200 text-gray-600 whitespace-nowrap">
                      Annual (₹)
                    </th>
                    <th className="py-1.5 px-2 text-center font-bold bg-gray-50 border-b border-gray-200"></th>
                  </tr>
                </thead>

                <tbody>
                  {/* 1. EARNINGS & ALLOWANCES */}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="py-1.5 px-3 bg-gray-50 border-y border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-900">
                            1. Earnings & Allowances
                          </span>
                          <span className="text-[10px] text-gray-600 font-semibold bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs">
                            {calculations.calculatedEarnings.length} components
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">
                          Gross: <span className="font-bold text-gray-950 font-mono">{formatINR(calculations.totalGrossMonthly)}</span>/mo
                        </span>
                      </div>
                    </td>
                  </tr>

                  {calculations.calculatedEarnings.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors group">
                      <td className="py-1.5 px-3 border-b border-gray-100">
                        <div className="font-semibold text-gray-950 text-xs flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.id === "basic" && (
                            <span className="text-[9px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                              50% Base
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {item.type === "PERCENT" ? `${item.value}% of Monthly Gross` : "Fixed rupee allowance"}
                        </p>
                      </td>

                      <td className="py-1.5 px-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          {/* Segmented Switch (% vs ₹) */}
                          <div className="inline-flex items-center p-0.5 bg-gray-100 rounded-lg border border-gray-200/80 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.type !== "PERCENT") toggleComponentType(item.id);
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                                item.type === "PERCENT"
                                  ? "bg-white text-gray-950 shadow-2xs"
                                  : "text-gray-500 hover:text-gray-900"
                              }`}
                              title="Calculate as Percentage of Gross"
                            >
                              %
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (item.type !== "FIXED") toggleComponentType(item.id);
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                                item.type === "FIXED"
                                  ? "bg-white text-gray-950 shadow-2xs"
                                  : "text-gray-500 hover:text-gray-900"
                              }`}
                              title="Set Fixed Rupee Amount"
                            >
                              ₹
                            </button>
                          </div>

                          {/* Numerical Input */}
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.value === 0 ? "" : item.value}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value.replace(/^0+(?=\d)/, "");
                                updateComponentValue(item.id, val === "" ? 0 : Number(val));
                              }}
                              className="w-20 px-2 py-1 text-xs font-semibold text-gray-950 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-950 focus:ring-1 focus:ring-gray-950 font-mono text-right pr-6 shadow-2xs transition-all"
                            />
                            <span className="absolute right-2 text-[10px] font-bold text-gray-400 pointer-events-none">
                              {item.type === "PERCENT" ? "%" : "₹"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-1.5 px-3 text-right font-bold text-gray-950 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                        ₹{item.monthly.toLocaleString("en-IN")}
                      </td>
                      <td className="py-1.5 px-3 text-right font-medium text-gray-600 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                        ₹{item.annual.toLocaleString("en-IN")}
                      </td>
                      <td className="py-1.5 px-2 text-center border-b border-gray-100">
                        {item.isDeletable ? (
                          <button
                            onClick={() => removeComponent(item.id)}
                            className="text-gray-400 hover:text-gray-950 p-1 rounded-md hover:bg-gray-100 transition-colors opacity-70 group-hover:opacity-100"
                            title="Remove Component"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-300 select-none">•</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Total Fixed Gross Row */}
                  <tr className="bg-gray-100/70 border-y border-gray-200/90 font-bold text-gray-950">
                    <td className="py-1.5 px-3 border-b border-gray-200">
                      <span className="text-[11px] uppercase tracking-wider font-extrabold text-gray-900">
                        Total Fixed Gross
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-xs text-gray-500 font-normal border-b border-gray-200">
                      100% Monthly Gross Base
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-gray-950 whitespace-nowrap text-xs border-b border-gray-200">
                      {formatINR(calculations.totalGrossMonthly)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-gray-950 whitespace-nowrap text-xs border-b border-gray-200">
                      {formatINR(calculations.totalGrossAnnual)}
                    </td>
                    <td className="border-b border-gray-200"></td>
                  </tr>

                  {/* 2. EMPLOYER CONTRIBUTIONS (COMPANY COST) */}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="py-1.5 px-3 bg-gray-50 border-y border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-900">
                            2. Employer Contributions (Company Cost)
                          </span>
                          <span className="text-[10px] text-gray-600 font-semibold bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs">
                            Added to CTC
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">
                          Total: <span className="font-bold text-gray-950 font-mono">+{formatINR(calculations.totalEmployerMonthly)}</span>/mo
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Employer PF */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <div className="font-semibold text-gray-950 text-xs">Employer PF Contribution (13%)</div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{calculations.pfCeilingNote}</p>
                    </td>
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/70 inline-block font-mono">
                        13% (Basic + Special)
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-gray-950 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      +{formatINR(calculations.employerPfMonthly)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-gray-600 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      +{formatINR(calculations.employerPfAnnual)}
                    </td>
                    <td className="border-b border-gray-100"></td>
                  </tr>

                  {/* EPS Breakdown Sub-row */}
                  {isPfChecked && calculations.employerPfMonthly > 0 && (
                    <tr className="border-b border-gray-100/60 bg-gray-50/30 text-gray-500">
                      <td className="py-1 px-3 pl-7 text-xs text-gray-600 border-b border-gray-100/60">
                        <span className="text-gray-400 mr-1.5">↳</span>
                        <span>EPS (Pension Scheme @ 8.33%)</span>
                      </td>
                      <td className="py-1.5 px-3 text-[11px] text-gray-500 font-mono border-b border-gray-100/60">
                        8.33% of Wages (Cap ₹2,083)
                      </td>
                      <td className="py-1 px-3 text-right text-xs text-gray-600 font-mono whitespace-nowrap border-b border-gray-100/60">
                        +{formatINR(calculations.epsMonthly)}
                      </td>
                      <td className="py-1 px-3 text-right text-xs text-gray-400 font-mono whitespace-nowrap border-b border-gray-100/60">
                        +{formatINR(calculations.epsAnnual)}
                      </td>
                      <td className="border-b border-gray-100/60"></td>
                    </tr>
                  )}

                  {/* EPF Breakdown Sub-row */}
                  {isPfChecked && calculations.employerPfMonthly > 0 && (
                    <tr className="border-b border-gray-100/60 bg-gray-50/30 text-gray-500">
                      <td className="py-1 px-3 pl-7 text-xs text-gray-600 border-b border-gray-100/60">
                        <span className="text-gray-400 mr-1.5">↳</span>
                        <span>EPF (Provident Fund @ 3.67%)</span>
                      </td>
                      <td className="py-1.5 px-3 text-[11px] text-gray-500 font-mono border-b border-gray-100/60">
                        Difference to EPF A/c 1
                      </td>
                      <td className="py-1 px-3 text-right text-xs text-gray-600 font-mono whitespace-nowrap border-b border-gray-100/60">
                        +{formatINR(calculations.epfEmployerMonthly)}
                      </td>
                      <td className="py-1 px-3 text-right text-xs text-gray-400 font-mono whitespace-nowrap border-b border-gray-100/60">
                        +{formatINR(calculations.epfEmployerAnnual)}
                      </td>
                      <td className="border-b border-gray-100/60"></td>
                    </tr>
                  )}

                  {/* Employer ESI */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <div className="font-semibold text-gray-950 text-xs">Employer ESI Contribution (3.25%)</div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {calculations.isEsiApplicable ? "Statutory ESIC on Basic salary" : "Exempt: Basic exceeds statutory ₹21,000 threshold"}
                      </p>
                    </td>
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/70 inline-block font-mono">
                        {calculations.isEsiApplicable ? "3.25% of Basic" : "Exempt"}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-gray-950 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      {calculations.isEsiApplicable && isEsiChecked ? `+${formatINR(calculations.employerEsiMonthly)}` : "—"}
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-gray-600 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      {calculations.isEsiApplicable && isEsiChecked ? `+${formatINR(calculations.employerEsiAnnual)}` : "—"}
                    </td>
                    <td className="border-b border-gray-100"></td>
                  </tr>

                  {/* Optional Performance Bonus */}
                  {includeBonus && (
                    <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                      <td className="py-1.5 px-3 border-b border-gray-100">
                        <div className="font-semibold text-gray-950 text-xs flex items-center gap-2">
                          <span>Performance Bonus (Variable)</span>
                          <select
                            value={bonusFrequency}
                            onChange={(e) => setBonusFrequency(e.target.value as BonusFrequency)}
                            className="text-[10px] font-bold text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                          >
                            <option value="MONTHLY">Monthly</option>
                            <option value="QUARTERLY">Quarterly</option>
                            <option value="HALF_YEARLY">Half Yearly</option>
                            <option value="YEARLY">Yearly</option>
                          </select>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{bonusMetrics.displayLabel}</p>
                      </td>
                      <td className="py-1.5 px-3 border-b border-gray-100">
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-xs font-bold text-gray-500">₹</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={bonusAmount === 0 ? "" : bonusAmount}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
                              setBonusAmount(raw === "" ? 0 : Number(raw));
                            }}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="w-24 pl-6 pr-2 py-1 text-xs font-semibold text-gray-950 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-950 focus:ring-1 focus:ring-gray-950 font-mono shadow-2xs"
                          />
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-gray-950 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                        +{formatINR(bonusMetrics.monthlyBonusEquivalent)}
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-gray-950 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                        +{formatINR(bonusMetrics.annualBonus)}
                      </td>
                      <td className="py-1.5 px-2 text-center border-b border-gray-100">
                        <button
                          onClick={() => {
                            setIncludeBonus(false);
                            setBonusAmount(0);
                          }}
                          className="text-gray-400 hover:text-gray-950 p-1 rounded-md hover:bg-gray-100 transition-colors"
                          title="Remove Performance Bonus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )}

                  {/* 3. EMPLOYEE DEDUCTIONS */}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="py-1.5 px-3 bg-gray-50 border-y border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-900">
                            3. Statutory & Employee Deductions
                          </span>
                          <span className="text-[10px] text-gray-600 font-semibold bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs">
                            Deducted from Gross
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">
                          Total: <span className="font-bold text-gray-950 font-mono">-{formatINR(calculations.totalDeductionsMonthly)}</span>/mo
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Employee PF */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <div className="font-semibold text-gray-950 text-xs">PF - Employee Contribution (12%)</div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Deducted on PF wages (Basic + Special)</p>
                    </td>
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/70 inline-block font-mono">
                        12% (Basic + Special)
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-gray-950 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      -{formatINR(calculations.employeePfMonthly)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-gray-600 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      -{formatINR(calculations.employeePfAnnual)}
                    </td>
                    <td className="border-b border-gray-100"></td>
                  </tr>

                  {/* PT */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <div className="font-semibold text-gray-950 text-xs">Profession Tax (PT)</div>
                      <p className="text-[10px] text-gray-400 mt-0.5">State statutory PT slab rate</p>
                    </td>
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-gray-500">₹</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={calculations.ptMonthly === 0 ? "" : calculations.ptMonthly}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
                            updateComponentValue("pt", raw === "" ? 0 : Number(raw));
                          }}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          className="w-20 pl-6 pr-2 py-1 text-xs font-semibold text-gray-950 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-950 focus:ring-1 focus:ring-gray-950 font-mono text-right shadow-2xs"
                        />
                      </div>
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-gray-950 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      -{formatINR(calculations.ptMonthly)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-gray-600 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      -{formatINR(calculations.ptAnnual)}
                    </td>
                    <td className="border-b border-gray-100"></td>
                  </tr>

                  {/* Employee ESI */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <div className="font-semibold text-gray-950 text-xs">ESI - Employee Contribution (0.75%)</div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {calculations.isEsiApplicable ? "Statutory ESIC on Basic salary" : "Exempt: Basic exceeds statutory ₹21,000 threshold"}
                      </p>
                    </td>
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/70 inline-block font-mono">
                        {calculations.isEsiApplicable ? "0.75% of Basic" : "Exempt"}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-gray-950 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      {calculations.isEsiApplicable && isEsiChecked ? `-${formatINR(calculations.employeeEsiMonthly)}` : "—"}
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-gray-600 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      {calculations.isEsiApplicable && isEsiChecked ? `-${formatINR(calculations.employeeEsiAnnual)}` : "—"}
                    </td>
                    <td className="border-b border-gray-100"></td>
                  </tr>

                  {/* TDS / Income Tax */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <div className="font-semibold text-gray-950 text-xs">TDS / Income Tax (New Regime)</div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{calculations.tdsNote}</p>
                    </td>
                    <td className="py-1.5 px-3 border-b border-gray-100">
                      <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/70 inline-block font-mono">
                        Auto (u/s 87A)
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-gray-950 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      {calculations.tdsMonthly > 0 ? `-${formatINR(calculations.tdsMonthly)}` : "₹0"}
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-gray-500 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                      {calculations.tdsAnnual > 0 ? `-${formatINR(calculations.tdsAnnual)}` : "₹0"}
                    </td>
                    <td className="border-b border-gray-100"></td>
                  </tr>

                  {/* Other custom deductions */}
                  {calculations.calculatedOtherDeductions.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors group">
                      <td className="py-1.5 px-3 border-b border-gray-100">
                        <div className="font-semibold text-gray-950 text-xs">{item.name}</div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {item.type === "PERCENT" ? `${item.value}% deduction` : "Fixed deduction"}
                        </p>
                      </td>
                      <td className="py-1.5 px-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center p-0.5 bg-gray-100 rounded-lg border border-gray-200/80 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.type !== "PERCENT") toggleComponentType(item.id);
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                                item.type === "PERCENT"
                                  ? "bg-white text-gray-950 shadow-2xs"
                                  : "text-gray-500 hover:text-gray-900"
                              }`}
                            >
                              %
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (item.type !== "FIXED") toggleComponentType(item.id);
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                                item.type === "FIXED"
                                  ? "bg-white text-gray-950 shadow-2xs"
                                  : "text-gray-500 hover:text-gray-900"
                              }`}
                            >
                              ₹
                            </button>
                          </div>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.value === 0 ? "" : item.value}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value.replace(/^0+(?=\d)/, "");
                                updateComponentValue(item.id, val === "" ? 0 : Number(val));
                              }}
                              className="w-20 px-2 py-1 text-xs font-semibold text-gray-950 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-950 focus:ring-1 focus:ring-gray-950 font-mono text-right pr-6 shadow-2xs"
                            />
                            <span className="absolute right-2 text-[10px] font-bold text-gray-400 pointer-events-none">
                              {item.type === "PERCENT" ? "%" : "₹"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-gray-950 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                        -{formatINR(item.monthly)}
                      </td>
                      <td className="py-1.5 px-3 text-right font-medium text-gray-600 font-mono whitespace-nowrap text-xs border-b border-gray-100">
                        -{formatINR(item.annual)}
                      </td>
                      <td className="py-1.5 px-2 text-center border-b border-gray-100">
                        <button
                          onClick={() => removeComponent(item.id)}
                          className="text-gray-400 hover:text-gray-950 p-1 rounded-md hover:bg-gray-100 transition-colors opacity-70 group-hover:opacity-100"
                          title="Remove Component"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Total Deductions Row */}
                  <tr className="bg-gray-100/70 border-y border-gray-200 font-bold text-gray-950">
                    <td className="py-1.5 px-3 border-b border-gray-200">
                      <span className="text-[11px] uppercase tracking-wider font-extrabold text-gray-900">
                        Total Deductions
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-xs text-gray-500 font-normal border-b border-gray-200">
                      Subtracted from monthly take-home
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-gray-950 whitespace-nowrap text-xs border-b border-gray-200">
                      -{formatINR(calculations.totalDeductionsMonthly)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-gray-950 whitespace-nowrap text-xs border-b border-gray-200">
                      -{formatINR(calculations.totalDeductionsAnnual)}
                    </td>
                    <td className="border-b border-gray-200"></td>
                  </tr>

                  {/* Final Net In-Hand Summary Row inside table */}
                  <tr className="bg-emerald-50/80 border-t-2 border-emerald-300 font-bold text-gray-950">
                    <td className="py-1.5 px-3 border-b border-emerald-200">
                      <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-950">
                        Net Take-Home (In-Hand)
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-[11px] text-emerald-800 font-normal border-b border-emerald-200">
                      Fixed Gross − Total Deductions
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-extrabold text-emerald-950 whitespace-nowrap text-xs border-b border-emerald-200">
                      {formatINR(calculations.netInHandMonthly)}/mo
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap text-xs border-b border-emerald-200">
                      {formatINR(calculations.netInHandAnnual)}/yr
                    </td>
                    <td className="border-b border-emerald-200"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer (Pinned at bottom, ultra-compact) */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs px-3">
            Cancel
          </Button>

          {/* Compact summary badges in footer */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase font-sans">Net Take-Home:</span>
              <span className="font-extrabold text-emerald-700 text-sm">{formatINR(calculations.netInHandMonthly)}</span>
              <span className="text-[10px] text-gray-400">/mo</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase font-sans">Annual CTC:</span>
              <span className="font-extrabold text-gray-950 text-sm">{formatINR(calculations.totalCtcAnnual)}</span>
              <span className="text-[10px] text-gray-500 font-sans font-semibold">({(calculations.totalCtcAnnual / 100000).toFixed(2)} LPA)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => {
                setMonthlyGross(40000);
                setGrossInputStr("40000");
                setIsPfChecked(true);
                setIsEsiChecked(true);
                setIncludeBonus(false);
                setBonusFrequency("YEARLY");
                setBonusAmount(0);
                setComponents([
                  { id: "basic", name: "Basic", type: "PERCENT", value: 50, category: "EARNING", isDeletable: false },
                  { id: "hra", name: "HRA", type: "PERCENT", value: 30, category: "EARNING", isDeletable: true },
                  { id: "special", name: "Special Allowance", type: "PERCENT", value: 20, category: "EARNING", isDeletable: true },
                  { id: "pf_emp", name: "PF - Employee Contribution", type: "PERCENT", value: 12, category: "EMPLOYEE_DEDUCTION", isDeletable: true },
                  { id: "esi_emp", name: "ESI - Employee Contribution", type: "PERCENT", value: 0.75, category: "EMPLOYEE_DEDUCTION", isDeletable: true },
                  { id: "pt", name: "Profession Tax", type: "FIXED", value: 200, category: "EMPLOYEE_DEDUCTION", isDeletable: true },
                  { id: "tds", name: "TDS / Income Tax (New Regime)", type: "PERCENT", value: 0, category: "EMPLOYEE_DEDUCTION", isDeletable: true },
                ]);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-8 text-xs px-3.5"
              onClick={handleApply}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Apply Offer (₹{(calculations.totalCtcAnnual / 100000).toFixed(2)} LPA)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
