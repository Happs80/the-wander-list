import { useState, useEffect } from "react";
import { Sun, CloudSun, CloudFog, CloudRain, Snowflake, CloudLightning, Cloud } from "lucide-react";
import { usePreferences } from "@/hooks/use-preferences";
import type { ItineraryDay, ItineraryStage, Group } from "@shared/schema";

interface WeatherBadgeProps {
  day: ItineraryDay;
  trip: Group;
  stages?: ItineraryStage[];
}

const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};

async function tryGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return { lat: data.results[0].latitude, lng: data.results[0].longitude };
    }
    return null;
  } catch {
    return null;
  }
}

async function geocodeLocationName(name: string): Promise<{ lat: number; lng: number } | null> {
  const key = name.trim().toLowerCase();
  if (key in geocodeCache) {
    return geocodeCache[key];
  }

  const fullName = name.trim();
  let result = await tryGeocode(fullName);

  if (!result) {
    const parts = fullName.split(/[,\-]+/).map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      result = await tryGeocode(part);
      if (result) break;
    }
  }

  if (!result) {
    const words = fullName.replace(/[,\-]+/g, ' ').split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      result = await tryGeocode(words[words.length - 1]);
    }
  }

  geocodeCache[key] = result;
  return result;
}

async function getWeatherCoordinates(
  day: ItineraryDay,
  trip: Group,
  stages?: ItineraryStage[]
): Promise<{ lat: number; lng: number; name: string } | null> {
  const dayStages = stages
    ?.filter(s => s.dayId === day.id)
    .sort((a, b) => b.stageNumber - a.stageNumber);

  const lastStage = dayStages?.[0];

  if (lastStage?.endLatitude && lastStage?.endLongitude) {
    return {
      lat: lastStage.endLatitude,
      lng: lastStage.endLongitude,
      name: lastStage.endPoint || day.location || "Stage endpoint",
    };
  }

  if (lastStage?.endPoint) {
    const coords = await geocodeLocationName(lastStage.endPoint);
    if (coords) {
      return { ...coords, name: lastStage.endPoint };
    }
  }

  if (trip.latitude && trip.longitude) {
    return {
      lat: trip.latitude,
      lng: trip.longitude,
      name: trip.location || trip.name,
    };
  }

  if (trip.location) {
    const coords = await geocodeLocationName(trip.location);
    if (coords) {
      return { ...coords, name: trip.location };
    }
  }

  if (day.location) {
    const coords = await geocodeLocationName(day.location);
    if (coords) {
      return { ...coords, name: day.location };
    }
  }

  return new Promise((resolve) => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Current location" }),
        () => resolve({ lat: -37.81, lng: 144.96, name: "Melbourne" }),
        { timeout: 5000 }
      );
    } else {
      resolve({ lat: -37.81, lng: 144.96, name: "Melbourne" });
    }
  });
}

function getWeatherIconAndColor(code: number): { icon: typeof Sun; colorClass: string } {
  if (code === 0 || code === 1) {
    return { icon: Sun, colorClass: "text-amber-500" };
  }
  if (code === 2 || code === 3) {
    return { icon: CloudSun, colorClass: "text-sky-500" };
  }
  if (code === 45 || code === 48) {
    return { icon: CloudFog, colorClass: "text-slate-400" };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { icon: CloudRain, colorClass: "text-blue-500" };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return { icon: Snowflake, colorClass: "text-cyan-400" };
  }
  if (code >= 95 && code <= 99) {
    return { icon: CloudLightning, colorClass: "text-purple-500" };
  }
  return { icon: Cloud, colorClass: "text-gray-400" };
}

interface WeatherData {
  weatherCode: number;
  maxTemp: number;
}

export function WeatherBadge({ day, trip, stages }: WeatherBadgeProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { formatTemperature } = usePreferences();

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        setLoading(true);
        setError(false);

        if (!day.date) {
          setError(true);
          setLoading(false);
          return;
        }

        const tripDate = new Date(day.date);
        if (isNaN(tripDate.getTime())) {
          setError(true);
          setLoading(false);
          return;
        }

        const coords = await getWeatherCoordinates(day, trip, stages);
        if (!coords || cancelled) {
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tripDate.setHours(0, 0, 0, 0);

        const daysUntilTrip = Math.ceil((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const formatDateStr = (d: Date) => d.toISOString().split("T")[0];

        let url: string;
        let fetchDate: string;

        if (daysUntilTrip <= 10 && daysUntilTrip >= 0) {
          fetchDate = formatDateStr(tripDate);
          url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=weathercode,temperature_2m_max&timezone=auto&start_date=${fetchDate}&end_date=${fetchDate}`;
        } else {
          const previousYearDate = new Date(tripDate);
          previousYearDate.setFullYear(previousYearDate.getFullYear() - 1);
          fetchDate = formatDateStr(previousYearDate);
          url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lng}&daily=weathercode,temperature_2m_max&timezone=auto&start_date=${fetchDate}&end_date=${fetchDate}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather fetch failed");

        const data = await response.json();

        if (!cancelled) {
          if (data.daily && data.daily.weathercode && data.daily.temperature_2m_max) {
            setWeather({
              weatherCode: data.daily.weathercode[0],
              maxTemp: Math.round(data.daily.temperature_2m_max[0]),
            });
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchWeather();

    return () => { cancelled = true; };
  }, [day.id, day.date, day.location, trip.latitude, trip.longitude, trip.location, stages]);

  if (loading) {
    return (
      <span className="text-xs text-muted-foreground animate-pulse" data-testid="weather-loading">
        ...
      </span>
    );
  }

  if (error || !weather) {
    return null;
  }

  const { icon: Icon, colorClass } = getWeatherIconAndColor(weather.weatherCode);

  return (
    <span 
      className="inline-flex items-center gap-1 text-xs"
      data-testid="weather-badge"
    >
      <Icon className={`w-4 h-4 ${colorClass}`} />
      <span className="text-foreground font-medium">{formatTemperature(weather.maxTemp)}</span>
    </span>
  );
}
