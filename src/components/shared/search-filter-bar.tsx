import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: Array<{
    label: string;
    value: string;
    options: Array<{ label: string; value: string }>;
    onChange: (value: string | null) => void;
  }>;
}

export function SearchFilterBar({ searchValue, onSearchChange, filters = [] }: SearchFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_12px_36px_rgba(15,18,25,0.05)] backdrop-blur-[16px] md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search..." className="h-10 rounded-xl border-[rgba(20,22,26,0.10)] bg-white/80 pl-9" />
      </div>
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <Select key={filter.label} onValueChange={filter.onChange} defaultValue={filter.value}>
            <SelectTrigger className="h-10 w-[180px] rounded-xl border-[rgba(20,22,26,0.10)] bg-white/80">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  );
}
