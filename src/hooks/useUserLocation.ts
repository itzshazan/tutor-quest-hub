import { useState, useEffect, useCallback } from "react";

export interface UserCoords {
  lat: number;
  lng: number;
}

interface UseUserLocationReturn {
  coords: UserCoords | null;
  loading: boolean;
  error: string | null;
  detect: () => void;
  clear: () => void;
}

const CACHE_KEY = "tq_location_permission";

export function useUserLocation(): UseUserLocationReturn {
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setError(null);
    setLoading(false);
    localStorage.setItem(CACHE_KEY, "granted");
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      localStorage.removeItem(CACHE_KEY);
      setError("Location access denied. Enable it in browser settings.");
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      setError("Location unavailable. Try again.");
    } else {
      setError("Location request timed out.");
    }
    setLoading(false);
  }, []);

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  }, [handleSuccess, handleError]);

  const clear = useCallback(() => {
    setCoords(null);
    setError(null);
    localStorage.removeItem(CACHE_KEY);
  }, []);

  // Auto-detect on mount if previously granted
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached === "granted" && navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 120000,
      });
    }
  }, [handleSuccess, handleError]);

  return { coords, loading, error, detect, clear };
}
