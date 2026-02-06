import { supabase } from '../lib/supabase';
import { useHistoryStore, type StoredRun } from '../stores/historyStore';
import { useVehicleStore } from '../stores/vehicleStore';
import type { Run, CloudRun, CloudVehicle, Vehicle, VehicleType, VehicleUpgrade } from '../types';
import { SPEED_THRESHOLDS, DISTANCE_THRESHOLDS } from '../utils/constants';

// ─── Run Sync (existing) ────────────────────────────────────────────

export async function syncRunToCloud(run: Run): Promise<CloudRun | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log('Cannot sync run: user not authenticated');
    return null;
  }

  // Get vehicle name if available
  let vehicleName: string | null = null;
  if (run.vehicleId) {
    const vehicle = useVehicleStore.getState().getVehicleById(run.vehicleId);
    if (vehicle) {
      vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    }
  }

  const cloudRun = {
    user_id: user.id,
    local_id: run.id,
    vehicle_name: vehicleName,
    zero_to_sixty_time: run.milestones.zeroToSixty?.time ?? null,
    zero_to_hundred_time: run.milestones.zeroToHundred?.time ?? null,
    quarter_mile_time: run.milestones.quarterMile?.time ?? null,
    half_mile_time: run.milestones.halfMile?.time ?? null,
    max_speed: run.maxSpeed,
  };

  const { data, error } = await supabase
    .from('runs')
    .upsert(cloudRun, { onConflict: 'local_id' })
    .select()
    .single();

  if (error) {
    console.error('Error syncing run:', error);
    throw error;
  }

  return data;
}

export async function syncAllUnsyncedRuns(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { runs, markRunSynced } = useHistoryStore.getState();
  const unsyncedRuns = runs.filter((run) => !run.syncedAt);

  let syncedCount = 0;

  for (const run of unsyncedRuns) {
    try {
      const cloudRun = await syncRunToCloud(run);
      if (cloudRun) {
        markRunSynced(run.id);
        syncedCount++;
      }
    } catch (error) {
      console.error(`Failed to sync run ${run.id}:`, error);
    }
  }

  return syncedCount;
}

export async function getUserCloudRuns(): Promise<CloudRun[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// ─── Run Download (NEW) ─────────────────────────────────────────────

export async function fetchRunsFromCloud(): Promise<StoredRun[]> {
  const cloudRuns = await getUserCloudRuns();
  const vehicles = useVehicleStore.getState().vehicles;

  return cloudRuns.map((cr) => {
    // Try to match vehicle by name
    let vehicleId: string | null = null;
    if (cr.vehicle_name) {
      const matched = vehicles.find(
        (v) => `${v.year} ${v.make} ${v.model}` === cr.vehicle_name
      );
      if (matched) {
        vehicleId = matched.id;
      }
    }

    return {
      id: cr.local_id,
      vehicleId,
      startTime: new Date(cr.created_at).getTime(),
      endTime: new Date(cr.created_at).getTime(),
      milestones: {
        zeroToSixty: cr.zero_to_sixty_time != null
          ? { speed: SPEED_THRESHOLDS.SIXTY_MPH, time: cr.zero_to_sixty_time, distance: 0 }
          : undefined,
        zeroToHundred: cr.zero_to_hundred_time != null
          ? { speed: SPEED_THRESHOLDS.HUNDRED_MPH, time: cr.zero_to_hundred_time, distance: 0 }
          : undefined,
        quarterMile: cr.quarter_mile_time != null
          ? { speed: 0, time: cr.quarter_mile_time, distance: DISTANCE_THRESHOLDS.QUARTER_MILE }
          : undefined,
        halfMile: cr.half_mile_time != null
          ? { speed: 0, time: cr.half_mile_time, distance: DISTANCE_THRESHOLDS.HALF_MILE }
          : undefined,
      },
      maxSpeed: cr.max_speed,
      gpsPoints: [],
      createdAt: new Date(cr.created_at).getTime(),
      syncedAt: Date.now(), // Already synced since it came from cloud
    };
  });
}

// ─── Vehicle Sync (NEW) ─────────────────────────────────────────────

export async function syncVehicleToCloud(vehicle: Vehicle): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log('Cannot sync vehicle: user not authenticated');
    return;
  }

  const cloudVehicle = {
    user_id: user.id,
    local_id: vehicle.id,
    name: vehicle.name,
    type: vehicle.type,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    photo_uri: vehicle.photoUri ?? null,
    upgrades: vehicle.upgrades,
    notes: vehicle.notes ?? null,
    updated_at: new Date(vehicle.updatedAt).toISOString(),
  };

  const { error } = await supabase
    .from('vehicles')
    .upsert(cloudVehicle, { onConflict: 'user_id,local_id' });

  if (error) {
    console.error('Error syncing vehicle:', error);
    throw error;
  }
}

export async function syncAllVehicles(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { vehicles } = useVehicleStore.getState();
  let syncedCount = 0;

  for (const vehicle of vehicles) {
    try {
      await syncVehicleToCloud(vehicle);
      syncedCount++;
    } catch (error) {
      console.error(`Failed to sync vehicle ${vehicle.id}:`, error);
    }
  }

  return syncedCount;
}

export async function deleteVehicleFromCloud(vehicleLocalId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('user_id', user.id)
    .eq('local_id', vehicleLocalId);

  if (error) {
    console.error('Error deleting vehicle from cloud:', error);
  }
}

export async function fetchVehiclesFromCloud(): Promise<Vehicle[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vehicles from cloud:', error);
    return [];
  }

  return (data || []).map((cv: CloudVehicle) => ({
    id: cv.local_id,
    name: cv.name,
    type: cv.type as VehicleType,
    year: cv.year,
    make: cv.make,
    model: cv.model,
    photoUri: cv.photo_uri ?? undefined,
    upgrades: (cv.upgrades || []) as VehicleUpgrade[],
    notes: cv.notes ?? undefined,
    createdAt: new Date(cv.created_at).getTime(),
    updatedAt: new Date(cv.updated_at).getTime(),
  }));
}
