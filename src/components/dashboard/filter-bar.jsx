'use client';

/**
 * The dashboard filter bar.
 *
 * Holds no state of its own — it reads from and writes to the URL through
 * useFilters(), which is what makes the whole view shareable. Layout collapses
 * to a stacked column on phones and spreads across one row from `lg` up.
 */
import { RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from './multi-select';
import { ShareButton } from './share-button';
import { useFilters } from '@/hooks/use-filters';
import { RANGE_PRESETS, describeFilters, hasActiveFilters, presetToRange } from '@/lib/filters';
import { STATUS, STATUS_LABEL } from '@/lib/metrics';

export function FilterBar({ fields, wells, dateRange }) {
  const { filters, setFilters, resetFilters, toggleInList } = useFilters();

  // Only offer wells that belong to the fields currently selected, so the two
  // filters cannot contradict each other.
  const wellOptions = wells
    .filter((w) => filters.fields.length === 0 || filters.fields.includes(w.field))
    .map((w) => ({ value: w.well, label: w.well, group: w.field }));

  const chips = describeFilters(filters);
  const active = hasActiveFilters(filters);

  /** Which preset (if any) the current from/to matches — used to show it selected. */
  const activePreset = RANGE_PRESETS.find((preset) => {
    const range = presetToRange(preset, dateRange.to);
    if (!preset.days) return !filters.from && !filters.to;
    return range.from === filters.from && range.to === filters.to;
  });

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <MultiSelect
          label="Fields"
          className="w-full lg:w-56"
          options={fields.map((field) => ({ value: field, label: field }))}
          selected={filters.fields}
          onToggle={(value) => {
            // Dropping a field must also drop any of its wells from the well
            // filter, or the dashboard would silently show nothing.
            const nextFields = filters.fields.includes(value)
              ? filters.fields.filter((f) => f !== value)
              : [...filters.fields, value];
            const allowedWells = nextFields.length === 0
              ? filters.wells
              : filters.wells.filter((wellName) => {
                  const well = wells.find((w) => w.well === wellName);
                  return well && nextFields.includes(well.field);
                });
            setFilters({ fields: nextFields, wells: allowedWells });
          }}
          onClear={() => setFilters({ fields: [], wells: [] })}
        />

        <MultiSelect
          label="Wells"
          className="w-full lg:w-56"
          options={wellOptions}
          selected={filters.wells}
          onToggle={(value) => toggleInList('wells', value)}
          onClear={() => setFilters({ wells: [] })}
        />

        {/* Date range: quick presets, with exact dates available below. */}
        <Select
          value={activePreset?.id ?? 'custom'}
          onValueChange={(id) => {
            const preset = RANGE_PRESETS.find((p) => p.id === id);
            setFilters(presetToRange(preset, dateRange.to));
          }}
        >
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {RANGE_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>{preset.label}</SelectItem>
            ))}
            {!activePreset ? <SelectItem value="custom">Custom range</SelectItem> : null}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(status) => setFilters({ status })}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Performance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All performance</SelectItem>
            <SelectItem value={STATUS.OVER}>{STATUS_LABEL[STATUS.OVER]}</SelectItem>
            <SelectItem value={STATUS.ON}>{STATUS_LABEL[STATUS.ON]}</SelectItem>
            <SelectItem value={STATUS.UNDER}>{STATUS_LABEL[STATUS.UNDER]}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 lg:ml-auto">
          {active ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          ) : null}
          <ShareButton size="sm" />
        </div>
      </div>

      {/* Exact dates — always visible so a shared link's range is legible. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="from" className="text-xs text-muted-foreground">From</label>
          <Input
            id="from"
            type="date"
            className="h-8 w-[10.5rem] text-xs"
            min={dateRange.from}
            max={filters.to || dateRange.to}
            value={filters.from}
            onChange={(event) => setFilters({ from: event.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="to" className="text-xs text-muted-foreground">To</label>
          <Input
            id="to"
            type="date"
            className="h-8 w-[10.5rem] text-xs"
            min={filters.from || dateRange.from}
            max={dateRange.to}
            value={filters.to}
            onChange={(event) => setFilters({ to: event.target.value })}
          />
        </div>
        <p className="text-xs text-muted-foreground sm:ml-2">
          Data available {dateRange.from} → {dateRange.to}
        </p>
      </div>

      {/* Removable chips summarising what is currently applied. */}
      {chips.length ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
              {chip.label}
              <button
                type="button"
                aria-label={`Remove ${chip.label}`}
                className="rounded-full p-0.5 hover:bg-background"
                onClick={() => {
                  if (chip.group === 'fields') toggleInList('fields', chip.value);
                  else if (chip.group === 'wells') toggleInList('wells', chip.value);
                  else if (chip.group === 'range') setFilters({ from: '', to: '' });
                  else if (chip.group === 'status') setFilters({ status: 'all' });
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
