import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Label } from './ui/label';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
}

export interface SearchFilters {
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search mail..."
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className={hasActiveFilters ? 'text-indigo-600' : ''} aria-label="Toggle advanced filters">
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h3 className="text-sm">Advanced Search</h3>
            
            <div>
              <Label htmlFor="filter-from">From</Label>
              <Input
                id="filter-from"
                value={filters.from || ''}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                placeholder="sender@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="filter-to">To</Label>
              <Input
                id="filter-to"
                value={filters.to || ''}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                placeholder="recipient@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="filter-subject">Subject</Label>
              <Input
                id="filter-subject"
                value={filters.subject || ''}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                placeholder="Email subject"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has-attachment"
                checked={filters.hasAttachment || false}
                onChange={(e) =>
                  setFilters({ ...filters, hasAttachment: e.target.checked })
                }
                  className="w-4 h-4"
                  aria-label="Has attachments"
              />
              <Label htmlFor="has-attachment" className="cursor-pointer">
                Has attachments
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setFilters({})}
                className="flex-1"
              >
                Clear
              </Button>
              <Button onClick={handleSearch} className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button onClick={handleSearch}>Search</Button>
    </div>
  );
}
