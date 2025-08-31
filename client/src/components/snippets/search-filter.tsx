import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Filter, X, Calendar, Tag } from "lucide-react";

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  availableTags: string[];
  onClear: () => void;
}

interface FilterOptions {
  tags: string[];
  favorites: boolean | null; // null = all, true = favorites only, false = non-favorites only
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
}

export function SearchFilter({ onSearch, onFilterChange, availableTags, onClear }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    tags: [],
    favorites: null,
    dateRange: 'all',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // Update filters when they change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleFavoritesToggle = (value: boolean | null) => {
    setFilters(prev => ({
      ...prev,
      favorites: value
    }));
  };

  const handleDateRangeChange = (range: FilterOptions['dateRange']) => {
    setFilters(prev => ({
      ...prev,
      dateRange: range
    }));
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setFilters({
      tags: [],
      favorites: null,
      dateRange: 'all',
    });
    onClear();
  };

  const hasActiveFilters = filters.tags.length > 0 || filters.favorites !== null || filters.dateRange !== 'all';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search snippets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {filters.tags.length + (filters.favorites !== null ? 1 : 0) + (filters.dateRange !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Options</h4>
              
              {/* Tags Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Favorites Filter */}
              <div className="space-y-2">
                <Label>Favorites</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="favorites-all"
                      checked={filters.favorites === null}
                      onCheckedChange={() => handleFavoritesToggle(null)}
                    />
                    <Label htmlFor="favorites-all">All snippets</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="favorites-only"
                      checked={filters.favorites === true}
                      onCheckedChange={() => handleFavoritesToggle(true)}
                    />
                    <Label htmlFor="favorites-only">Favorites only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="favorites-none"
                      checked={filters.favorites === false}
                      onCheckedChange={() => handleFavoritesToggle(false)}
                    />
                    <Label htmlFor="favorites-none">Non-favorites only</Label>
                  </div>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </Label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'This week' },
                    { value: 'month', label: 'This month' },
                    { value: 'year', label: 'This year' },
                  ].map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`date-${value}`}
                        checked={filters.dateRange === value}
                        onCheckedChange={() => handleDateRangeChange(value)}
                      />
                      <Label htmlFor={`date-${value}`}>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            {filters.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleTagToggle(tag)}
                />
              </Badge>
            ))}
            {filters.favorites !== null && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1"
              >
                {filters.favorites ? 'Favorites' : 'Non-favorites'}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFavoritesToggle(null)}
                />
              </Badge>
            )}
            {filters.dateRange !== 'all' && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1"
              >
                {filters.dateRange}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleDateRangeChange('all')}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
