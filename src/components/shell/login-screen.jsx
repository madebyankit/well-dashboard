'use client';

/**
 * Sign-in screen.
 *
 * Doubles as the RBAC demo entry point: the four seeded accounts are listed
 * with their role, so a reviewer can switch between them in one click and see
 * the navigation, permissions and data scope change.
 */
import { useState } from 'react';
import { Gauge, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { DEMO_PASSWORD, ROLE_DESCRIPTION, ROLE_LABEL } from '@/lib/rbac';

export function LoginScreen() {
  const { login, users } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    const result = login(email, password);
    if (!result.ok) setError(result.error);
    setSubmitting(false);
  }

  /** One-click role switch for reviewers. */
  function signInAs(user) {
    setEmail(user.email);
    setPassword(DEMO_PASSWORD);
    setError('');
    const result = login(user.email, DEMO_PASSWORD);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Credentials form */}
        <Card className="order-2 lg:order-1">
          <CardHeader>
            <div className="mb-1 flex items-center gap-2 text-primary">
              <Gauge className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">Well Production Monitor</span>
            </div>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use a demo account to explore the role-based views.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="ava.admin@enfinite.demo"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={DEMO_PASSWORD}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                />
              </div>

              {error ? (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              ) : null}

              <Button type="submit" className="w-full" disabled={submitting}>Sign in</Button>

              <p className="text-center text-xs text-muted-foreground">
                Every demo account uses the password <code className="rounded bg-muted px-1 py-0.5">{DEMO_PASSWORD}</code>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Role picker */}
        <Card className="order-1 lg:order-2">
          <CardHeader>
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Demo accounts</span>
            </div>
            <CardTitle className="text-base">Pick a role to see RBAC in action</CardTitle>
            <CardDescription>
              Each role sees a different navigation, a different set of controls and — for operators and viewers — only
              the fields they are entitled to.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.filter((u) => u.active).map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => signInAs(user)}
                className="flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-accent"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{user.name}</span>
                  <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{user.email}</span>
                <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTION[user.role]}</span>
                <span className="text-xs text-muted-foreground">
                  Fields: {user.fields.includes('*') ? 'All fields' : user.fields.join(', ')}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
