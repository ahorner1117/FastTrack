import type { UnitSystem } from '../types';

// Speed conversions (internal storage is m/s)
export const MS_TO_MPH = 2.23694;
export const MS_TO_KPH = 3.6;
export const MPH_TO_MS = 0.44704;
export const KPH_TO_MS = 0.277778;

// Distance conversions (internal storage is meters)
export const METERS_TO_MILES = 0.000621371;
export const METERS_TO_KM = 0.001;
export const MILES_TO_METERS = 1609.34;
export const KM_TO_METERS = 1000;

// Feet conversions
export const METERS_TO_FEET = 3.28084;
export const FEET_TO_METERS = 0.3048;

export function metersPerSecondToDisplay(
  speedMs: number,
  unitSystem: UnitSystem
): number {
  return unitSystem === 'imperial' ? speedMs * MS_TO_MPH : speedMs * MS_TO_KPH;
}

export function displaySpeedToMetersPerSecond(
  speed: number,
  unitSystem: UnitSystem
): number {
  return unitSystem === 'imperial' ? speed * MPH_TO_MS : speed * KPH_TO_MS;
}

export function metersToDisplay(
  meters: number,
  unitSystem: UnitSystem
): number {
  return unitSystem === 'imperial'
    ? meters * METERS_TO_MILES
    : meters * METERS_TO_KM;
}

export function displayDistanceToMeters(
  distance: number,
  unitSystem: UnitSystem
): number {
  return unitSystem === 'imperial'
    ? distance * MILES_TO_METERS
    : distance * KM_TO_METERS;
}

export function getSpeedUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'mph' : 'km/h';
}

export function getDistanceUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'mi' : 'km';
}

export function getShortDistanceUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'ft' : 'm';
}
