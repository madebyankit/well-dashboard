'use client';

/**
 * Searchable multi-select used by the Field and Well filters.
 *
 * Each option is a plain <button> whose tick is a <span>, not a Radix Checkbox.
 * A Radix Checkbox renders its own <button>, and a button inside a button is
 * invalid HTML that React reports as a hydration error — the row already
 * handles the click, so the tick only needs to *look* like a checkbox.
 *
 * "No selection" means "all", so there is no select-all control: clearing the
 * filter is the same thing.
 */
import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function MultiSelect({ label, options, selected = [], onToggle, onClear, className }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(needle) || option.group?.toLowerCase().includes(needle),
    );
  }, [options, query]);

  const summary =
    selected.length === 0 ? `All ${label.toLowerCase()}`
      : selected.length === 1 ? selected[0]
        : `${selected.length} ${label.toLowerCase()}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('h-9 justify-between gap-2 font-normal', className)}>
          <span className="truncate">
            <span className="text-muted-foreground">{label}: </span>
            {summary}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0">
        <div className="relative border-b p-2">
          <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${label.toLowerCase()}…`}
            className="h-8 pl-7 text-xs"
          />
        </div>

        <div className="max-h-64 overflow-y-auto p-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">No matches</p>
          ) : (
            filtered.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => onToggle(option.value)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                      checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                    )}
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.group ? <span className="shrink-0 text-[11px] text-muted-foreground">{option.group}</span> : null}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t p-1.5">
          <Button variant="ghost" size="sm" className="h-7 w-full text-xs" onClick={onClear} disabled={selected.length === 0}>
            Clear selection
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
