import React from "react";
import { OnboardingFieldConfig } from "../../types/hrms";

interface DynamicFieldRendererProps {
  field: OnboardingFieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: DynamicFieldRendererProps) {
  const isReadOnly = field.readOnly || disabled;
  const fieldValue = value !== undefined && value !== null ? value : field.defaultValue ?? "";

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.helpText && (
          <span className="text-[11px] text-gray-400">{field.helpText}</span>
        )}
      </div>

      {/* Field Renderers by Type */}
      {field.type === "READONLY" ? (
        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 select-all">
          {fieldValue || "—"}
        </div>
      ) : field.type === "TEXTAREA" ? (
        <textarea
          value={fieldValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={isReadOnly}
          rows={3}
          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-gray-950 disabled:bg-gray-50 disabled:text-gray-500 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
      ) : field.type === "SELECT" ? (
        <select
          value={fieldValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={isReadOnly}
          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-gray-950 disabled:bg-gray-50 disabled:text-gray-500 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">{field.placeholder || "Select option..."}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === "MULTISELECT" ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {field.options?.map((opt) => {
            const selectedList: string[] = Array.isArray(fieldValue) ? fieldValue : [];
            const isChecked = selectedList.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isReadOnly}
                onClick={() => {
                  if (isChecked) {
                    onChange(selectedList.filter((v) => v !== opt.value));
                  } else {
                    onChange([...selectedList, opt.value]);
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-xs border font-medium transition-colors ${
                  isChecked
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : field.type === "RADIO" ? (
        <div className="flex flex-wrap gap-4 pt-1">
          {field.options?.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="radio"
                name={field.name}
                value={opt.value}
                checked={fieldValue === opt.value}
                onChange={() => onChange(opt.value)}
                disabled={isReadOnly}
                className="text-gray-950 focus:ring-gray-950"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      ) : field.type === "CHECKBOX" ? (
        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={Boolean(fieldValue)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={isReadOnly}
            className="w-4 h-4 rounded text-gray-950 focus:ring-gray-950 mt-0.5"
          />
          <span className="text-xs text-gray-700 leading-snug">
            {field.placeholder || field.label}
          </span>
        </label>
      ) : field.type === "DATE" ? (
        <input
          type="date"
          value={fieldValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={isReadOnly}
          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-gray-950 disabled:bg-gray-50 disabled:text-gray-500 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
      ) : field.type === "NUMBER" ? (
        <input
          type="number"
          value={fieldValue}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={field.placeholder}
          disabled={isReadOnly}
          min={field.validation?.min}
          max={field.validation?.max}
          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-gray-950 disabled:bg-gray-50 disabled:text-gray-500 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
      ) : (
        /* Default: TEXT, EMAIL, PHONE */
        <input
          type={field.type === "EMAIL" ? "email" : field.type === "PHONE" ? "tel" : "text"}
          value={fieldValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={isReadOnly}
          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-gray-950 disabled:bg-gray-50 disabled:text-gray-500 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
      )}

      {/* Validation Error */}
      {error && (
        <p className="text-[11px] text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
