import { createComponentImplementation } from "@uicast/react";
import { useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Plus, X } from "lucide-react";
import { type Filter, FilterBuilderDef } from "./def";

const operatorsByType: Record<string, { value: Filter["operator"]; label: string }[]> = {
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

const INPUT_TYPES = { text: "text", number: "number", date: "date", select: "text" } as const;

export const FilterBuilderImpl = createComponentImplementation({
  def: FilterBuilderDef,
  render: ({
    fields,
    filters: initialFilters,
    onApply,
  }, { entry }) => {
    const blankFilter = (field = fields[0]?.name ?? ""): Filter => ({ field, operator: "equals", value: "" });
    const seedFilters = (): Filter[] => initialFilters ?? [blankFilter()];
    // Props re-evaluate with a fresh identity every render, so the mirror resyncs by content; local edits win in between.
    const propsKey = JSON.stringify(initialFilters);
    const [filters, setFilters] = useState<Filter[]>(seedFilters);
    const lastPropsKey = useRef(propsKey);
    if (lastPropsKey.current !== propsKey) {
      lastPropsKey.current = propsKey;
      setFilters(seedFilters());
    }

    const addFilter = () => {
      setFilters([...filters, blankFilter()]);
    };

    const removeFilter = (index: number) => {
      setFilters(filters.filter((_, i) => i !== index));
    };

    const updateFilter = (
      index: number,
      key: keyof Filter,
      value: string,
    ) => {
      const updated = [...filters];
      // A new field voids the operator and value chosen for the old one.
      updated[index] = key === "field" ? blankFilter(value) : { ...updated[index], [key]: value };
      setFilters(updated);
    };

    return (
      <div className="space-y-3" data-key={entry.key}>
        {filters.map((filter, i) => {
          const fieldDef = fields.find((f) => f.name === filter.field);
          const fieldType = fieldDef?.type ?? "text";
          const operators = operatorsByType[fieldType];

          return (
            <div key={i} className="flex items-center gap-2">
              <Select
                value={filter.field}
                onValueChange={(v) => updateFilter(i, "field", v)}
              >
                <SelectTrigger className="w-38 h-9">
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
                <SelectTrigger className="w-30 h-9">
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
                  type={INPUT_TYPES[fieldType]}
                  value={filter.value}
                  onChange={(e) => updateFilter(i, "value", e.target.value)}
                  placeholder="Value..."
                  className="flex-1 h-9"
                />
              )}

              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                onClick={() => removeFilter(i)}
              >
                <X className="size-4" />
              </Button>
            </div>
          );
        })}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addFilter}>
            <Plus className="mr-1 size-3.5" />
            Add Filter
          </Button>
          <Button size="sm" onClick={() => onApply({ filters })}>
            Apply
          </Button>
        </div>
      </div>
    );
  },
});
