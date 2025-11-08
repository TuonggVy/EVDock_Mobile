import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile } from '../services/api/authApi';

/**
 * Fetches the authenticated staff profile from the API and exposes
 * the profile data together with loading/error states.
 *
 * @returns {{ profile: Object|null, isLoading: boolean, error: string|null, refresh: () => void }}
 */
const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const userIdRef = useRef(user?.id ?? null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!userIdRef.current) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getProfile(userIdRef.current);
      const profileData = response?.data ?? response ?? null;
      if (isMountedRef.current) {
        setProfile(profileData);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load profile';
      console.error('useUserProfile error:', message);
      if (isMountedRef.current) {
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    profile,
    isLoading,
    error,
    refresh: fetchProfile,
  };
};

export default useUserProfile;


