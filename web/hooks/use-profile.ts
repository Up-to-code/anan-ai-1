"use client";

/**
 * useProfile Hook
 * Manages profile state and API calls with caching
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { CACHE } from "@/lib/config";
import { createLogger } from "@/lib/logger";

const log = createLogger("useProfile");

// ============================================
// Types
// ============================================

export interface ProfileData {
  id: string;
  email: string;
  name: string;
  plan: "free" | "paid";
  phone: string;
  location: string;
  avatar: string;
  lastLoginAt: string | null;
  loginHistory: Array<{
    timestamp: string;
    ip: string;
    userAgent: string;
    device: string;
  }>;
  tokensUsed?: number;
  tokensLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  timestamp: string;
  ip: string;
  userAgent: string;
  device: string;
}

export interface UseProfileReturn {
  profile: ProfileData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  updateProfile: (data: {
    name?: string;
    phone?: string;
    location?: string;
  }) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;
  removeAvatar: () => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  refresh: (force?: boolean) => Promise<void>;
  getActivity: (force?: boolean) => Promise<ActivityEntry[]>;
}

// ============================================
// Cache
// ============================================

const profileCache = new Map<
  string,
  { data: ProfileData; timestamp: number }
>();
const activityCache = new Map<
  string,
  { data: ActivityEntry[]; timestamp: number }
>();

// Function to invalidate profile cache (useful when tokens are updated)
export function invalidateProfileCache(userId?: string) {
  if (userId) {
    profileCache.delete(userId);
  } else {
    profileCache.clear();
  }
}

// ============================================
// API Functions
// ============================================

async function fetchProfile(): Promise<ProfileData> {
  const response = await fetch("/api/profile", {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to fetch profile");
  }

  return response.json();
}

async function updateProfileAPI(data: {
  name?: string;
  phone?: string;
  location?: string;
}): Promise<ProfileData> {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to update profile");
  }

  return response.json();
}

async function uploadAvatarAPI(file: File): Promise<{ avatar: string }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch("/api/profile/avatar", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to upload avatar");
  }

  return response.json();
}

async function removeAvatarAPI(): Promise<{ avatar: string }> {
  const response = await fetch("/api/profile/avatar", {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to remove avatar");
  }

  return response.json();
}

async function changePasswordAPI(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const response = await fetch("/api/profile/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to change password");
  }
}

async function fetchActivity(
  userId: string,
  force = false,
): Promise<ActivityEntry[]> {
  // Check cache first
  const cached = activityCache.get(userId);
  const now = Date.now();

  if (!force && cached && now - cached.timestamp < CACHE.DEFAULT_DURATION_MS) {
    return cached.data;
  }

  const response = await fetch("/api/profile/activity", {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to fetch activity");
  }

  const data = await response.json();
  const history = data.history || [];

  // Update cache
  activityCache.set(userId, {
    data: history,
    timestamp: now,
  });

  return history;
}

// ============================================
// Hook
// ============================================

export function useProfile(): UseProfileReturn {
  const { user, isAuthenticated } = useAuth();
  const cacheKey = user?.id || "default";

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  // Fetch profile with caching
  const refresh = useCallback(
    async (force = false) => {
      if (!isAuthenticated || !user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      // Check cache first (shorter duration for token updates)
      const cached = profileCache.get(cacheKey);
      const now = Date.now();

      // Use shorter cache duration if checking for token updates
      const cacheDuration = force ? 0 : CACHE.DEFAULT_DURATION_MS;

      if (!force && cached && now - cached.timestamp < cacheDuration) {
        setProfile(cached.data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchProfile();

        // Update cache
        profileCache.set(cacheKey, {
          data,
          timestamp: now,
        });

        setProfile(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load profile";
        setError(message);
        log.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [user, isAuthenticated, cacheKey],
  );

  // Update profile
  const updateProfile = useCallback(
    async (data: {
      name?: string;
      phone?: string;
      location?: string;
    }): Promise<boolean> => {
      if (!isAuthenticated || !user) return false;

      try {
        const updated = await updateProfileAPI(data);

        // Update cache
        profileCache.set(cacheKey, {
          data: updated,
          timestamp: Date.now(),
        });

        setProfile(updated);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update profile";
        setError(message);
        log.error("Error updating profile:", err);
        return false;
      }
    },
    [user, isAuthenticated, cacheKey],
  );

  // Upload avatar
  const uploadAvatar = useCallback(
    async (file: File): Promise<boolean> => {
      if (!isAuthenticated || !user) return false;

      try {
        const result = await uploadAvatarAPI(file);

        // Invalidate cache
        profileCache.delete(cacheKey);

        // Refresh profile
        await refresh(true);

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload avatar";
        setError(message);
        log.error("Error uploading avatar:", err);
        return false;
      }
    },
    [user, isAuthenticated, cacheKey, refresh],
  );

  // Remove avatar
  const removeAvatar = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      await removeAvatarAPI();

      // Invalidate cache
      profileCache.delete(cacheKey);

      // Refresh profile
      await refresh(true);

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove avatar";
      setError(message);
      log.error("Error removing avatar:", err);
      return false;
    }
  }, [user, isAuthenticated, cacheKey, refresh]);

  // Change password
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      if (!isAuthenticated || !user) return false;

      try {
        await changePasswordAPI(currentPassword, newPassword);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to change password";
        setError(message);
        log.error("Error changing password:", err);
        return false;
      }
    },
    [user, isAuthenticated],
  );

  // Get activity
  const getActivity = useCallback(
    async (force = false): Promise<ActivityEntry[]> => {
      if (!isAuthenticated || !user) return [];

      try {
        return await fetchActivity(cacheKey, force);
      } catch (err) {
        log.error("Error fetching activity:", err);
        return [];
      }
    },
    [user, isAuthenticated, cacheKey],
  );

  // Load profile on mount (no auto-refresh)
  useEffect(() => {
    if (isAuthenticated && user) {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        const cached = profileCache.get(cacheKey);
        if (cached) {
          setProfile(cached.data);
          setIsLoading(false);
          // No background refresh - use cached data
        } else {
          refresh(false);
        }
      }
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, cacheKey, refresh]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    changePassword,
    refresh,
    getActivity,
  };
}

export default useProfile;
