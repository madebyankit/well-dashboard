'use client';

/**
 * Appearance settings.
 *
 * Theme, font family and font size, applied live across the whole dashboard —
 * including the charts and the grid, because all three read the same design
 * tokens through useChartTheme(). Preferences persist per browser.
 *
 * The "Projector" text scale exists for the control-room requirement: it lifts
 * the root font size, and since every dimension in the app is rem-based, the
 * entire interface — grid rows, chart labels, KPI figures — scales with it.
 */
import { Check, Monitor, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ForbiddenState } from '@/components/dashboard/states';
import { AttainmentGauge } from '@/components/charts/attainment-gauge';
import { FONTS, SCALES, THEMES, useAppearance } from '@/context/appearance-context';
import { useAuth } from '@/context/auth-context';
import { PERMISSIONS, ROLE_LABEL } from '@/lib/rbac';
import { cn } from '@/lib/utils';

export function SettingsView() {
  const { theme, font, scale, resolvedTheme, update, reset } = useAppearance();
  const { user, hasPermission } = useAuth();

  if (!hasPermission(PERMISSIONS.MANAGE_APPEARANCE)) return <ForbiddenState />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Appearance preferences are stored in this browser and apply to every page.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Reset to defaults
        </Button>
      </div>

      {/* min-w-0: grid items default to `min-width: auto`, which lets a wide
          child size the whole column and overflow the viewport on a phone. */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="min-w-0 space-y-4 xl:col-span-2">
          {/* Theme */}
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                High contrast is intended for projectors and control-room walls where ambient light washes out
                the standard palette.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {THEMES.map((option) => (
                <OptionTile
                  key={option.id}
                  selected={theme === option.id}
                  onClick={() => update({ theme: option.id })}
                  title={option.label}
                  description={option.description}
                  badge={option.id === 'system' ? `currently ${resolvedTheme}` : null}
                  swatch={<ThemeSwatch themeId={option.id} />}
                />
              ))}
            </CardContent>
          </Card>

          {/* Font family */}
          <Card>
            <CardHeader>
              <CardTitle>Font family</CardTitle>
              <CardDescription>Applied to the interface, the charts and the data grid alike.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {FONTS.map((option) => (
                <OptionTile
                  key={option.id}
                  selected={font === option.id}
                  onClick={() => update({ font: option.id })}
                  title={option.label}
                  description={option.sample}
                  // Preview the face in the tile itself.
                  style={{ fontFamily: FONT_PREVIEW[option.id] }}
                />
              ))}
            </CardContent>
          </Card>

          {/* Text size */}
          <Card>
            <CardHeader>
              <CardTitle>Text size</CardTitle>
              <CardDescription>
                Sets the root font size. Everything is measured in rem, so the whole interface scales together.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {SCALES.map((option) => (
                <OptionTile
                  key={option.id}
                  selected={scale === option.id}
                  onClick={() => update({ scale: option.id })}
                  title={option.label}
                  description={option.hint}
                  badge={option.id === 'xl' ? 'control room' : null}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Live preview + account summary */}
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>Every choice applies immediately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AttainmentGauge value={104.6} label="sample gauge" height={170} />
              <Separator />
              <div className="space-y-2">
                <p className="text-2xl font-semibold tabular-nums">2,819.6 <span className="text-xs font-normal text-muted-foreground">m³/d</span></p>
                <p className="text-sm">Production is tracking above the analyst target.</p>
                <p className="text-xs text-muted-foreground">Secondary text, as used for captions and axis labels.</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="success">Outperforming</Badge>
                  <Badge variant="warning">Anomaly</Badge>
                  <Badge variant="destructive">Underperforming</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Role and data entitlement are set by an administrator.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Role" value={ROLE_LABEL[user.role]} />
              <Row label="Fields" value={user.fields.includes('*') ? 'All fields' : user.fields.join(', ')} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const FONT_PREVIEW = {
  sans: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, serif',
  mono: 'ui-monospace, Menlo, monospace',
  rounded: '"SF Pro Rounded", "Nunito", ui-rounded, system-ui, sans-serif',
};

function OptionTile({ selected, onClick, title, description, badge, swatch, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      aria-pressed={selected}
      className={cn(
        // min-w-0 so the tile can shrink inside its grid track on a phone.
        'flex min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent',
        selected && 'border-primary bg-primary/5',
      )}
    >
      {swatch}
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{title}</span>
          {badge ? <Badge variant="secondary" className="shrink-0 text-[10px]">{badge}</Badge> : null}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
    </button>
  );
}

/** Miniature palette chip so each theme is recognisable before it is applied. */
function ThemeSwatch({ themeId }) {
  if (themeId === 'system') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border">
        <Monitor className="h-4 w-4 text-muted-foreground" />
      </span>
    );
  }

  const palettes = {
    light: ['#ffffff', '#0369a1', '#e2e8f0'],
    dark: ['#141a23', '#38bdf8', '#2b3648'],
    contrast: ['#0a0a0a', '#00d5ff', '#4a4a4a'],
  };
  const [bg, accent, border] = palettes[themeId] ?? palettes.light;

  return (
    <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-md border" style={{ background: bg, borderColor: border }}>
      <span className="m-auto block h-3.5 w-3.5 rounded-full" style={{ background: accent }} />
    </span>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
