import type { UnitSystem } from '../types';
import { metersPerSecondToDisplay, metersToDisplay } from './conversions';

export function formatTime(milliseconds: number): string {
  if (milliseconds < 0) return '0.000';

  const totalSeconds = milliseconds / 1000;

  if (totalSeconds < 60) {
    return totalSeconds.toFixed(3);
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
}

export function formatTimeShort(milliseconds: number): string {
  if (milliseconds < 0) return '0.00';

  const totalSeconds = milliseconds / 1000;

  if (totalSeconds < 60) {
    return totalSeconds.toFixed(2);
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
}

export function formatSpeed(
  speedMs: number,
  unitSystem: UnitSystem,
  decimals: number = 1
): string {
  const displaySpeed = metersPerSecondToDisplay(speedMs, unitSystem);
  return displaySpeed.toFixed(decimals);
}

export function formatSpeedWithUnit(
  speedMs: number,
  unitSystem: UnitSystem,
  decimals: number = 1
): string {
  const unit = unitSystem === 'imperial' ? 'mph' : 'km/h';
  return `${formatSpeed(speedMs, unitSystem, decimals)} ${unit}`;
}

export function formatDistance(
  meters: number,
  unitSystem: UnitSystem,
  decimals: number = 2
): string {
  const displayDistance = metersToDisplay(meters, unitSystem);
  return displayDistance.toFixed(decimals);
}

export function formatDistanceWithUnit(
  meters: number,
  unitSystem: UnitSystem,
  decimals: number = 2
): string {
  const unit = unitSystem === 'imperial' ? 'mi' : 'km';
  return `${formatDistance(meters, unitSystem, decimals)} ${unit}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
