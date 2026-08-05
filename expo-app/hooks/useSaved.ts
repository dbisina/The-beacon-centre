import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/services/auth';
import { ContentType, createSave, deleteSave, fetchSaves } from '@/services/userData';

/**
 * Save/unsave toggle for a single piece of content, backed by
 * services/userData.ts (POST/DELETE /api/users/me/saves). Members only - the
 * backend 401s guests, and auth is descoped for now (see services/auth.tsx),
 * so tapping while a guest surfaces an explanatory alert instead of silently
 * failing.
 */
export function useSaved(contentType: ContentType, contentId: number | null) {
  const { isMember } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isMember || contentId == null) {
      setSaved(false);
      return;
    }
    let alive = true;
    fetchSaves(contentType)
      .then((saves) => {
        if (alive) setSaved(saves.some((s) => s.contentId === contentId));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isMember, contentType, contentId]);

  async function toggle() {
    if (!isMember) {
      Alert.alert('Sign-in coming soon', 'Saving will need an account.');
      return;
    }
    if (contentId == null || busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next); // optimistic
    try {
      if (next) await createSave(contentType, contentId);
      else await deleteSave(contentType, contentId);
    } catch {
      setSaved(!next); // revert on failure
    } finally {
      setBusy(false);
    }
  }

  return { saved, toggle, busy };
}
