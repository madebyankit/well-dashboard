'use client';

/**
 * Client provider stack, mounted once in the root layout.
 *
 * Order matters:
 *   Appearance -> theme tokens must be on <html> before anything paints
 *   Auth       -> establishes the signed-in user and their entitlements
 *   Data       -> needs the user, because readings are scoped to their fields
 *   Tasks      -> needs the user for permission checks on assignment
 */
import { AppearanceProvider } from '@/context/appearance-context';
import { AuthProvider } from '@/context/auth-context';
import { DataProvider } from '@/context/data-context';
import { TasksProvider } from '@/context/tasks-context';

export function Providers({ children }) {
  return (
    <AppearanceProvider>
      <AuthProvider>
        <DataProvider>
          <TasksProvider>{children}</TasksProvider>
        </DataProvider>
      </AuthProvider>
    </AppearanceProvider>
  );
}
