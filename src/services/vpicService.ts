import { CAR_VEHICLE_MAKES } from '../utils/constants';

export interface VehicleMake {
  MakeId: number;
  MakeName: string;
}

export interface VehicleModel {
  Model_ID: number;
  Model_Name: string;
}

const motorcycleMakesCache: { data: VehicleMake[] | null } = { data: null };
const modelsCache = new Map<number, VehicleModel[]>();

export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/(\s+|-)/g)
    .map((part) =>
      /^[\s-]$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function getMakesForType(type: 'car' | 'motorcycle'): Promise<VehicleMake[]> {
  if (type === 'car') {
    return CAR_VEHICLE_MAKES.map((m) => ({
      MakeId: m.MakeId,
      MakeName: m.MakeName,
    })).sort((a, b) => titleCase(a.MakeName).localeCompare(titleCase(b.MakeName)));
  }

  if (motorcycleMakesCache.data) {
    return motorcycleMakesCache.data;
  }

  try {
    const response = await fetchWithTimeout(
      'https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/motorcycle?format=json'
    );
    const json = await response.json();
    const makes: VehicleMake[] = (json.Results || [])
      .filter((r: any) => r.MakeId != null && r.MakeName)
      .map((r: any) => ({ MakeId: r.MakeId, MakeName: r.MakeName }))
      .sort((a: VehicleMake, b: VehicleMake) =>
        titleCase(a.MakeName).localeCompare(titleCase(b.MakeName))
      );
    motorcycleMakesCache.data = makes;
    return makes;
  } catch {
    return [];
  }
}

export async function getModelsForMakeId(makeId: number): Promise<VehicleModel[]> {
  const cached = modelsCache.get(makeId);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeId/${makeId}?format=json`
    );
    const json = await response.json();
    const models: VehicleModel[] = (json.Results || [])
      .filter((r: any) => r.Model_ID != null && r.Model_Name)
      .map((r: any) => ({ Model_ID: r.Model_ID, Model_Name: r.Model_Name }))
      .sort((a: VehicleModel, b: VehicleModel) =>
        titleCase(a.Model_Name).localeCompare(titleCase(b.Model_Name))
      );
    modelsCache.set(makeId, models);
    return models;
  } catch {
    return [];
  }
}

export function findMakeByName(
  makes: VehicleMake[],
  name: string
): VehicleMake | undefined {
  const lower = name.toLowerCase();
  return makes.find((m) => m.MakeName.toLowerCase() === lower);
}
