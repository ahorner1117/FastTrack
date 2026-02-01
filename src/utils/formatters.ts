import type { UnitSystem } from '../types';

// Speed conversion constants
const MS_TO_MPH = 2.23694;
const MS_TO_KPH = 3.6;

// Distance conversion constants
const METERS_TO_MILES = 0.000621371;
const METERS_TO_KM = 0.001;

export function formatSpeed(speedMs: number, unitSystem: UnitSystem): string {
  const speed =
    unitSystem === 'imperial' ? speedMs * MS_TO_MPH : speedMs * MS_TO_KPH;
  return `${Math.round(speed)} ${unitSystem === 'imperial' ? 'mph' : 'km/h'}`;
}

export function formatSpeedValue(
  speedMs: number,
  unitSystem: UnitSystem
): number {
  const speed =
    unitSystem === 'imperial' ? speedMs * MS_TO_MPH : speedMs * MS_TO_KPH;
  return Math.round(speed);
}

export function formatDistance(
  distanceMeters: number,
  unitSystem: UnitSystem
): string {
  if (unitSystem === 'imperial') {
    const miles = distanceMeters * METERS_TO_MILES;
    if (miles < 0.1) {
      const feet = distanceMeters * 3.28084;
      return `${Math.round(feet)} ft`;
    }
    return `${miles.toFixed(2)} mi`;
  } else {
    const km = distanceMeters * METERS_TO_KM;
    if (km < 0.1) {
      return `${Math.round(distanceMeters)} m`;
    }
    return `${km.toFixed(2)} km`;
  }
}

export function formatTime(timeMs: number): string {
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((timeMs % 1000) / 10);

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
  return `${seconds}.${ms.toString().padStart(2, '0')}s`;
}

export function formatTimeShort(timeMs: number): string {
  const totalSeconds = timeMs / 1000;
  return `${totalSeconds.toFixed(2)}s`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(timestamp);
  } else if (days > 1) {
    return `${days} days ago`;
  } else if (days === 1) {
    return 'Yesterday';
  } else if (hours > 1) {
    return `${hours} hours ago`;
  } else if (hours === 1) {
    return '1 hour ago';
  } else if (minutes > 1) {
    return `${minutes} minutes ago`;
  } else if (minutes === 1) {
    return '1 minute ago';
  } else {
    return 'Just now';
  }
}
