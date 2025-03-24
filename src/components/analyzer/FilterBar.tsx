
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface FilterBarProps {
  years: string[];
  subjects: string[];
  filters: {
    year: string;
    subject: string;
    keyword: string;
  };
  onFilterChange: (name: string, value: string) => void;
}

const FilterBar = ({ 
  years,
  subjects,
  filters,
  onFilterChange 
}: FilterBarProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <label htmlFor="year-filter" className="text-sm font-medium">
          Filter by Year
        </label>
        <Select
          value={filters.year}
          onValueChange={(value) => onFilterChange("year", value)}
        >
          <SelectTrigger id="year-filter">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_years">All Years</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="subject-filter" className="text-sm font-medium">
          Filter by Subject
        </label>
        <Select
          value={filters.subject}
          onValueChange={(value) => onFilterChange("subject", value)}
        >
          <SelectTrigger id="subject-filter">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_subjects">All Subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="keyword-filter" className="text-sm font-medium">
          Search by Keyword
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="keyword-filter"
            placeholder="Search questions..."
            className="pl-10"
            value={filters.keyword}
            onChange={(e) => onFilterChange("keyword", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
