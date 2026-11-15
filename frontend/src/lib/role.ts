'use client';
import { useState, useEffect, useCallback } from 'react';

export type Role = 'collect' | 'translate' | 'review' | null;

const KEY = 'kingabinti-role';

export function getRole(): Role {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(KEY);
  return v === 'collect' || v === 'translate' || v === 'review' ? v : null;
}

export function useRole() {
  const [role, setRoleState] = useState<Role>(null);
  useEffect(() => {
    setRoleState(getRole());
    const onChange = () => setRoleState(getRole());
    window.addEventListener('kingabinti-role-change', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('kingabinti-role-change', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);
  const setRole = useCallback((r: Role) => {
    try {
      if (r) window.localStorage.setItem(KEY, r);
      else window.localStorage.removeItem(KEY);
    } catch {}
    window.dispatchEvent(new Event('kingabinti-role-change'));
  }, []);
  return { role, setRole };
}
