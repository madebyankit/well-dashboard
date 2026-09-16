'use client';

/**
 * Signed-in user chip in the top bar: shows who you are, the role you hold and
 * how many open tasks are assigned to you, with a quick theme toggle and sign
 * out.
 */
import Link from 'next/link';
import { LogOut, Moon, Settings, Sun, ClipboardList } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/tasks-context';
import { useAppearance } from '@/context/appearance-context';
import { ROLE_LABEL } from '@/lib/rbac';

/** "Ava Whitfield" -> "AW" */
function initials(name) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const { myTasks } = useTasks();
  const { resolvedTheme, update } = useAppearance();

  if (!user) return null;

  return (
    <>
      {/* Quick light/dark toggle — the full controls live on the Settings page. */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        onClick={() => update({ theme: resolvedTheme === 'light' ? 'dark' : 'light' })}
      >
        {resolvedTheme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex items-center gap-2 rounded-full pl-1 pr-2 transition-colors hover:bg-accent">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium leading-tight">{user.name}</span>
              <span className="block text-[11px] leading-tight text-muted-foreground">{ROLE_LABEL[user.role]}</span>
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="space-y-0.5">
            <p className="text-sm">{user.name}</p>
            <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
            <p className="text-xs font-normal text-muted-foreground">
              {user.fields.includes('*') ? 'All fields' : user.fields.join(', ')}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/users">
              <ClipboardList className="h-4 w-4" />
              My tasks
              {myTasks.length ? <Badge className="ml-auto">{myTasks.length}</Badge> : null}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
