import { useAuth } from "./use-auth";

type UnitSystem = "metric" | "imperial";
type DateFormatType = "DD-MM-YYYY" | "MM-DD-YYYY";

export function usePreferences() {
  const { user } = useAuth();

  const unitSystem: UnitSystem = (user?.unitSystem as UnitSystem) || "metric";
  const dateFormat: DateFormatType = (user?.dateFormat as DateFormatType) || "DD-MM-YYYY";

  const formatWeight = (grams: number): string => {
    if (unitSystem === "imperial") {
      const oz = grams / 28.3495;
      if (oz >= 16) {
        const lbs = oz / 16;
        return `${lbs.toFixed(1)} lb`;
      }
      return `${oz.toFixed(1)} oz`;
    }
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(1)} kg`;
    }
    return `${grams} g`;
  };

  const formatWeightTotal = (grams: number): string => {
    if (unitSystem === "imperial") {
      const lbs = grams / 453.592;
      return `${lbs.toFixed(2)} lb`;
    }
    return `${(grams / 1000).toFixed(2)} kg`;
  };

  const formatWeightUnit = (grams: number): { value: string; unit: string } => {
    if (unitSystem === "imperial") {
      const oz = grams / 28.3495;
      if (oz >= 16) {
        const lbs = oz / 16;
        return { value: lbs.toFixed(1), unit: "lb" };
      }
      return { value: oz.toFixed(1), unit: "oz" };
    }
    return { value: String(grams), unit: "g" };
  };

  const formatDistance = (km: number | string): string => {
    const kmNum = typeof km === "string" ? parseFloat(km) : km;
    if (isNaN(kmNum)) return String(km);
    if (unitSystem === "imperial") {
      const miles = kmNum * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${kmNum} km`;
  };

  const formatElevation = (meters: number): string => {
    if (unitSystem === "imperial") {
      const feet = meters * 3.28084;
      return `+${Math.round(feet)} ft`;
    }
    return `+${meters}m`;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    if (dateFormat === "MM-DD-YYYY") {
      return `${month}-${day}-${year}`;
    }
    return `${day}-${month}-${year}`;
  };

  const formatDateLong = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr + "T00:00:00");
      if (isNaN(date.getTime())) return dateStr;
      const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      if (dateFormat === "MM-DD-YYYY") {
        return `${month} ${day}, ${year}`;
      }
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatTemperature = (celsius: number): string => {
    if (unitSystem === "imperial") {
      const fahrenheit = (celsius * 9) / 5 + 32;
      return `${Math.round(fahrenheit)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  return {
    unitSystem,
    dateFormat,
    formatWeight,
    formatWeightTotal,
    formatWeightUnit,
    formatDistance,
    formatElevation,
    formatDate,
    formatDateLong,
    formatTemperature,
  };
}
