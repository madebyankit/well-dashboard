'use client';

/**
 * Authentication + the user directory.
 *
 * Both live here because user management and "who am I" share the same list.
 * There is no backend, so the directory is seeded from SEED_USERS and persisted
 * to localStorage; signing in is a password comparison against DEMO_PASSWORD.
 *
 * The important part for the brief is what comes *out* of this provider:
 *   - `user`          the signed-in account, carrying role + entitled fields
 *   - `hasPermission` the RBAC gate every page and control asks before rendering
 *   - user CRUD, itself gated on the MANAGE_USERS permission
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEMO_PASSWORD, PERMISSIONS, ROLES, SEED_USERS, can, canSeeField } from '@/lib/rbac';
import { STORAGE_KEYS, loadJson, removeKey, saveJson } from '@/lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(SEED_USERS);
  const [userId, setUserId] = useState(null);
  // `ready` prevents a flash of the login screen while localStorage is read.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUsers(loadJson(STORAGE_KEYS.USERS, SEED_USERS));
    setUserId(loadJson(STORAGE_KEYS.SESSION, null));
    setReady(true);
  }, []);

  // Persist the directory whenever it changes (but not on the first render,
  // which would write the seed list before hydration has finished).
  useEffect(() => {
    if (ready) saveJson(STORAGE_KEYS.USERS, users);
  }, [users, ready]);

  const user = useMemo(() => users.find((u) => u.id === userId) ?? null, [users, userId]);

  /** Sign in. Returns { ok } or { ok: false, error } for the login form. */
  const login = useCallback(
    (email, password) => {
      const match = users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
      if (!match) return { ok: false, error: 'No account found with that email address.' };
      if (!match.active) return { ok: false, error: 'This account has been deactivated.' };
      if (password !== DEMO_PASSWORD) return { ok: false, error: 'Incorrect password.' };
      setUserId(match.id);
      saveJson(STORAGE_KEYS.SESSION, match.id);
      return { ok: true };
    },
    [users],
  );

  const logout = useCallback(() => {
    setUserId(null);
    removeKey(STORAGE_KEYS.SESSION);
  }, []);

  const hasPermission = useCallback((permission) => can(user, permission), [user]);
  const canViewField = useCallback((field) => canSeeField(user, field), [user]);

  /* ---- user management (admin only) ---- */

  const createUser = useCallback(
    (draft) => {
      if (!can(user, PERMISSIONS.MANAGE_USERS)) return { ok: false, error: 'You do not have permission to add users.' };
      const email = String(draft.email).trim().toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: 'That email address is already in the directory.' };
      }
      const newUser = {
        id: `u-${Date.now().toString(36)}`,
        name: draft.name.trim(),
        email,
        role: draft.role ?? ROLES.VIEWER,
        fields: draft.fields?.length ? draft.fields : ['*'],
        title: draft.title?.trim() || '',
        active: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setUsers((current) => [...current, newUser]);
      return { ok: true, user: newUser };
    },
    [user, users],
  );

  const updateUser = useCallback(
    (id, patch) => {
      if (!can(user, PERMISSIONS.MANAGE_USERS)) return { ok: false, error: 'You do not have permission to edit users.' };
      // Guard rail: never let the last active administrator lock everyone out.
      const target = users.find((u) => u.id === id);
      const losingAdmin = target?.role === ROLES.ADMIN && (patch.role !== undefined ? patch.role !== ROLES.ADMIN : patch.active === false);
      if (losingAdmin && users.filter((u) => u.role === ROLES.ADMIN && u.active).length <= 1) {
        return { ok: false, error: 'At least one active administrator must remain.' };
      }
      setUsers((current) => current.map((u) => (u.id === id ? { ...u, ...patch } : u)));
      return { ok: true };
    },
    [user, users],
  );

  const deleteUser = useCallback(
    (id) => {
      if (!can(user, PERMISSIONS.MANAGE_USERS)) return { ok: false, error: 'You do not have permission to remove users.' };
      if (id === user?.id) return { ok: false, error: 'You cannot remove your own account.' };
      const target = users.find((u) => u.id === id);
      if (target?.role === ROLES.ADMIN && users.filter((u) => u.role === ROLES.ADMIN && u.active).length <= 1) {
        return { ok: false, error: 'At least one active administrator must remain.' };
      }
      setUsers((current) => current.filter((u) => u.id !== id));
      return { ok: true };
    },
    [user, users],
  );

  /** Restore the seed directory — handy when demoing. */
  const resetDirectory = useCallback(() => setUsers(SEED_USERS), []);

  const value = useMemo(
    () => ({ ready, user, users, login, logout, hasPermission, canViewField, createUser, updateUser, deleteUser, resetDirectory }),
    [ready, user, users, login, logout, hasPermission, canViewField, createUser, updateUser, deleteUser, resetDirectory],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
