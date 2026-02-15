import { useState, useCallback } from "react";

interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useGeolocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback((): Promise<GeolocationResult> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = "Geolocation is not supported by this browser";
        setError(err);
        reject(new Error(err));
        return;
      }
      setIsLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoading(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (err) => {
          setIsLoading(false);
          const msg =
            err.code === 1
              ? "Location permission denied. Please enable location access."
              : err.code === 2
                ? "Location unavailable. Please try again."
                : "Location request timed out. Please try again.";
          setError(msg);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { getLocation, isLoading, error };
}
