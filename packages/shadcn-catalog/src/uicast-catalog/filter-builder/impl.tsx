import { createComponentImplementation } from "@uicast/react";
import { Plus, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useMirror } from "../../lib/use-mirror";
import { type Filter, FilterBuilderDef } from "./def";

type Operator = { value: Filter["operator"]; label: string };

const OPERATORS: Record<string, Operator[]> = {
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

// A dropdown over `options`, each value its own label.
const Choice = ({
  value,
  options,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className: string;
  placeholder?: string;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className={className}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export const FilterBuilderImpl = createComponentImplementation({
  def: FilterBuilderDef,
  render: ({ fields, filters: initialFilters, onApply }, { entry }) => {
    const blankFilter = (field = fields[0]?.name ?? ""): Filter => ({ field, operator: "equals", value: "" });
    // Props re-evaluate with a fresh identity whenever any prop changes, so the mirror resyncs by content.
    const [filters, setFilters] = useMirror(initialFilters ?? [blankFilter()], JSON.stringify(initialFilters));

    const updateFilter = (index: number, key: keyof Filter, value: string) =>
      setFilters(
        filters.map((filter, i) =>
          // A new field voids the operator and value chosen for the old one.
          i !== index ? filter : key === "field" ? blankFilter(value) : { ...filter, [key]: value },
        ),
      );

    return (
      <div className="space-y-3" data-key={entry.key}>
        {filters.map((filter, i) => {
          const field = fields.find((f) => f.name === filter.field);
          const type = field?.type ?? "text";
          return (
            <div key={i} className="flex items-center gap-2">
              <Choice
                value={filter.field}
                options={fields.map((f) => ({ value: f.name, label: f.label }))}
                onChange={(v) => updateFilter(i, "field", v)}
                className="w-38 h-9"
              />
              <Choice
                value={filter.operator}
                options={OPERATORS[type]}
                onChange={(v) => updateFilter(i, "operator", v)}
                className="w-30 h-9"
              />
              {type === "select" && field?.options ? (
                <Choice
                  value={filter.value}
                  options={field.options.map((option) => ({ value: option, label: option }))}
                  onChange={(v) => updateFilter(i, "value", v)}
                  className="flex-1 h-9"
                  placeholder="Select..."
                />
              ) : (
                <Input
                  type={INPUT_TYPES[type]}
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
                onClick={() => setFilters(filters.filter((_, j) => j !== i))}
              >
                <X className="size-4" />
              </Button>
            </div>
          );
        })}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setFilters([...filters, blankFilter()])}>
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
