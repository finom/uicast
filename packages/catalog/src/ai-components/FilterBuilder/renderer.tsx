import { createAIComponentRenderer } from "@ui-fired/react";
import { useState } from "react";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { Input } from "@ui-fired/catalog/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui-fired/catalog/components/ui/select";
import { Plus, X } from "lucide-react";
import { FilterBuilderDef } from "./def";

interface FilterRow {
  field: string;
  operator: string;
  value: string;
}

const operatorsByType: Record<string, { value: string; label: string }[]> = {
  text: [
    { value: "equals", label: "Equals" },
    { value: "contains", label: "Contains" },
    { value: "starts_with", label: "Starts with" },
    { value: "ends_with", label: "Ends with" },
  ],
  number: [
    { value: "equals", label: "=" },
    { value: "gt", label: ">" },
    { value: "gte", label: ">=" },
    { value: "lt", label: "<" },
    { value: "lte", label: "<=" },
  ],
  date: [
    { value: "equals", label: "On" },
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
  ],
  select: [
    { value: "equals", label: "Is" },
    { value: "not_equals", label: "Is not" },
  ],
};

export const FilterBuilderRenderer = createAIComponentRenderer({
  def: FilterBuilderDef,
  renderer: ({
    fields = [],
    filters: initialFilters,
    onApply,
    generatedKey,
  }) => {
    const [filters, setFilters] = useState<FilterRow[]>(
      initialFilters ?? [
        { field: fields[0]?.name ?? "", operator: "equals", value: "" },
      ],
    );

    const addFilter = () => {
      setFilters([
        ...filters,
        { field: fields[0]?.name ?? "", operator: "equals", value: "" },
      ]);
    };

    const removeFilter = (index: number) => {
      setFilters(filters.filter((_, i) => i !== index));
    };

    const updateFilter = (
      index: number,
      key: keyof FilterRow,
      value: string,
    ) => {
      const updated = [...filters];
      updated[index] = { ...updated[index], [key]: value };
      setFilters(updated);
    };

    const getFieldType = (fieldName: string) => {
      return fields.find((f) => f.name === fieldName)?.type ?? "text";
    };

    return (
      <div className="space-y-3" data-key={generatedKey}>
        {filters.map((filter, i) => {
          const fieldType = getFieldType(filter.field);
          const operators = operatorsByType[fieldType] ?? operatorsByType.text;
          const fieldDef = fields.find((f) => f.name === filter.field);

          return (
            <div key={i} className="flex items-center gap-2">
              <Select
                value={filter.field}
                onValueChange={(v) => updateFilter(i, "field", v)}
              >
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filter.operator}
                onValueChange={(v) => updateFilter(i, "operator", v)}
              >
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {fieldType === "select" && fieldDef?.options ? (
                <Select
                  value={filter.value}
                  onValueChange={(v) => updateFilter(i, "value", v)}
                >
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldDef.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={
                    fieldType === "number"
                      ? "number"
                      : fieldType === "date"
                        ? "date"
                        : "text"
                  }
                  value={filter.value}
                  onChange={(e) => updateFilter(i, "value", e.target.value)}
                  placeholder="Value..."
                  className="flex-1 h-9"
                />
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => removeFilter(i)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addFilter}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Filter
          </Button>
          <Button size="sm" onClick={() => onApply?.({ filters })}>
            Apply
          </Button>
        </div>
      </div>
    );
  },
});
