'use client';

/**
 * Application chrome: sidebar navigation, top bar and the authentication gate.
 *
 * Responsive behaviour (the brief asks for phone -> control room):
 *   < md   sidebar collapses into a slide-over drawer, content is single column
 *   md-lg  persistent icon+label rail
 *   xl+    wider rail with the signed-in user's context
 *   3xl+   content max-width relaxes so wall displays are filled, not letterboxed
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Droplets, Gauge, Menu, Settings, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/rbac';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/tasks-context';
import { LoginScreen } from './login-screen';
import { UserMenu } from './user-menu';

const ICONS = { gauge: Gauge, droplets: Droplets, users: Users, settings: Settings };

export function AppShell({ children }) {
  const { ready, user, hasPermission } = useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Nothing renders until the session has been read from storage, otherwise
  // the login screen flashes for a signed-in user on every refresh.
  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          Loading workspace…
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const navItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  return (
    <div className="flex min-h-svh bg-muted/30">
      {/* Backdrop for the mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setDrawerOpen(false)} aria-hidden />
      ) : null}

      <Sidebar navItems={navItems} pathname={pathname} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setDrawerOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 3xl:max-w-[2200px]">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ navItems, pathname, open, onClose }) {
  const { user } = useAuth();
  const { myTasks } = useTasks();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-200 md:sticky md:top-0 md:h-svh md:w-16 md:translate-x-0 xl:w-60',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4 md:justify-center xl:justify-start">
        <Gauge className="h-5 w-5 shrink-0 text-primary" />
        <span className="truncate text-sm font-semibold md:hidden xl:inline">Production Monitor</span>
        <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={onClose} aria-label="Close menu">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon] ?? Gauge;
          // `/wells/NR-001` should keep the Wells entry highlighted.
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = item.href === '/users' && myTasks.length > 0 ? myTasks.length : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors md:justify-center xl:justify-start',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
              title={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="md:hidden xl:inline">{item.label}</span>
              {badge ? (
                <Badge variant="default" className="ml-auto md:hidden xl:inline-flex">{badge}</Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Data-entitlement reminder for scoped roles. */}
      {user && !user.fields.includes('*') ? (
        <div className="m-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground md:hidden xl:block">
          <p className="mb-1 font-medium text-foreground">Scoped access</p>
          <p>You can see {user.fields.length} of the available fields.</p>
        </div>
      ) : null}
    </aside>
  );
}

function TopBar({ onMenu }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <BreadcrumbTitle />
      <div className="ml-auto flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  );
}

/** Derives a readable page title from the route, so no page has to pass one. */
function BreadcrumbTitle() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const title = segments.length === 0
    ? 'Dashboard'
    : segments[segments.length - 1].replace(/%20/g, ' ');

  const prettify = (value) => value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

  return (
    <div className="min-w-0">
      <h1 className="truncate text-sm font-semibold sm:text-base">
        {segments.length > 1 ? decodeURIComponent(title) : prettify(title)}
      </h1>
    </div>
  );
}
