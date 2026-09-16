'use client';

/**
 * Task assignment.
 *
 * Tasks tie the analytics to the people: an analyst spots an under-performing
 * well on the dashboard and assigns follow-up to the operator who covers that
 * field. Creation is gated on ASSIGN_TASKS; completion on COMPLETE_TASKS, and
 * an operator may only close tasks assigned to them.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PERMISSIONS, SEED_TASKS } from '@/lib/rbac';
import { STORAGE_KEYS, loadJson, saveJson } from '@/lib/storage';
import { useAuth } from './auth-context';

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const { user, hasPermission } = useAuth();
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTasks(loadJson(STORAGE_KEYS.TASKS, SEED_TASKS));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveJson(STORAGE_KEYS.TASKS, tasks);
  }, [tasks, ready]);

  const createTask = useCallback(
    (draft) => {
      if (!hasPermission(PERMISSIONS.ASSIGN_TASKS)) return { ok: false, error: 'You do not have permission to assign tasks.' };
      if (!draft.title?.trim()) return { ok: false, error: 'Give the task a title.' };
      if (!draft.assigneeId) return { ok: false, error: 'Choose someone to assign the task to.' };

      const task = {
        id: `t-${Date.now().toString(36)}`,
        title: draft.title.trim(),
        well: draft.well || '',
        assigneeId: draft.assigneeId,
        createdById: user.id,
        priority: draft.priority ?? 'medium',
        status: 'open',
        dueDate: draft.dueDate ?? '',
        createdAt: new Date().toISOString().slice(0, 10),
        notes: draft.notes?.trim() ?? '',
      };
      setTasks((current) => [task, ...current]);
      return { ok: true, task };
    },
    [hasPermission, user],
  );

  const updateTask = useCallback(
    (id, patch) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return { ok: false, error: 'Task not found.' };

      // Reassigning or re-scoping a task needs ASSIGN_TASKS; an assignee may
      // only move their own task along the status track.
      const isStatusOnly = Object.keys(patch).every((key) => key === 'status');
      const mayAssign = hasPermission(PERMISSIONS.ASSIGN_TASKS);
      const mayComplete = hasPermission(PERMISSIONS.COMPLETE_TASKS) && task.assigneeId === user?.id;

      if (!mayAssign && !(isStatusOnly && mayComplete)) {
        return { ok: false, error: 'You do not have permission to change this task.' };
      }

      setTasks((current) => current.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      return { ok: true };
    },
    [tasks, hasPermission, user],
  );

  const deleteTask = useCallback(
    (id) => {
      if (!hasPermission(PERMISSIONS.ASSIGN_TASKS)) return { ok: false, error: 'You do not have permission to delete tasks.' };
      setTasks((current) => current.filter((t) => t.id !== id));
      return { ok: true };
    },
    [hasPermission],
  );

  /** Tasks the signed-in user is responsible for — shown in the top bar. */
  const myTasks = useMemo(
    () => tasks.filter((t) => t.assigneeId === user?.id && t.status !== 'done'),
    [tasks, user],
  );

  const tasksForWell = useCallback((wellName) => tasks.filter((t) => t.well === wellName), [tasks]);

  const value = useMemo(
    () => ({ tasks, myTasks, createTask, updateTask, deleteTask, tasksForWell }),
    [tasks, myTasks, createTask, updateTask, deleteTask, tasksForWell],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) throw new Error('useTasks must be used inside <TasksProvider>');
  return context;
}
