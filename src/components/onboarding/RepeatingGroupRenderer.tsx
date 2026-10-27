import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { OnboardingSectionConfig } from "../../types/hrms";
import { DynamicFieldRenderer } from "./DynamicFieldRenderer";

interface RepeatingGroupRendererProps {
  section: OnboardingSectionConfig;
  items: Record<string, any>[];
  onChange: (items: Record<string, any>[]) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function RepeatingGroupRenderer({
  section,
  items,
  onChange,
  errors = {},
  disabled = false,
}: RepeatingGroupRendererProps) {
  const repeatingConfig = section.repeatingConfig || {};
  const minItems = repeatingConfig.minItems ?? 0;
  const maxItems = repeatingConfig.maxItems ?? 10;
  const itemLabel = repeatingConfig.itemLabel || "Entry";

  // Ensure minimum items
  const currentItems = Array.isArray(items) && items.length > 0 ? items : [{}];

  const handleAddItem = () => {
    if (currentItems.length >= maxItems || disabled) return;
    onChange([...currentItems, {}]);
  };

  const handleRemoveItem = (index: number) => {
    if (currentItems.length <= minItems || disabled) return;
    const updated = currentItems.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFieldChange = (index: number, fieldName: string, value: any) => {
    const updated = currentItems.map((item, i) => {
      if (i === index) {
        return { ...item, [fieldName]: value };
      }
      return item;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {currentItems.map((item, index) => (
        <div
          key={index}
          className="p-4 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              {itemLabel} #{index + 1}
            </h4>
            {currentItems.length > minItems && !disabled && (
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((field) => {
                const errorKey = `${section.id}.${index}.${field.name}`;
                return (
                  <div
                    key={field.id}
                    className={field.type === "TEXTAREA" ? "md:col-span-2" : ""}
                  >
                    <DynamicFieldRenderer
                      field={field}
                      value={item[field.name]}
                      onChange={(val) => handleFieldChange(index, field.name, val)}
                      error={errors[errorKey]}
                      disabled={disabled}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {currentItems.length < maxItems && !disabled && (
        <button
          type="button"
          onClick={handleAddItem}
          className="w-full py-2.5 px-4 border border-dashed border-gray-300 hover:border-gray-900 rounded-xl text-xs font-medium text-gray-700 hover:text-gray-950 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another {itemLabel}</span>
        </button>
      )}
    </div>
  );
}
