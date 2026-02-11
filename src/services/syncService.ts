import { supabase } from '../lib/supabase';
import { useHistoryStore, type StoredRun } from '../stores/historyStore';
import { useDriveHistoryStore, type StoredDrive } from '../stores/driveHistoryStore';
import { useVehicleStore } from '../stores/vehicleStore';
import type { Run, Drive, CloudRun, CloudDrive, CloudVehicle, Vehicle, VehicleType, VehicleUpgrade } from '../types';
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

  // Map speedMilestones to cloud format (string keys)
  let speedMilestonesCloud: Record<string, { speed: number; time: number; distance: number }> | null = null;
  if (run.milestones.speedMilestones) {
    speedMilestonesCloud = {};
    for (const [mph, ms] of Object.entries(run.milestones.speedMilestones)) {
      speedMilestonesCloud[mph] = { speed: ms.speed, time: ms.time, distance: ms.distance };
    }
  }

  // Build full milestone data object (preserves speed + distance, not just time)
  const milestonesData: Record<string, { speed: number; time: number; distance: number }> = {};
  if (run.milestones.zeroToSixty) {
    milestonesData.zeroToSixty = run.milestones.zeroToSixty;
  }
  if (run.milestones.zeroToHundred) {
    milestonesData.zeroToHundred = run.milestones.zeroToHundred;
  }
  if (run.milestones.quarterMile) {
    milestonesData.quarterMile = run.milestones.quarterMile;
  }
  if (run.milestones.halfMile) {
    milestonesData.halfMile = run.milestones.halfMile;
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
    speed_milestones: speedMilestonesCloud,
    start_time: run.startTime,
    end_time: run.endTime,
    gps_points: run.gpsPoints,
    launch_threshold_g: run.launchDetectionConfig?.thresholdG ?? null,
    launch_sample_count: run.launchDetectionConfig?.sampleCount ?? null,
    milestones_data: Object.keys(milestonesData).length > 0 ? milestonesData : null,
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

    // Map cloud speed_milestones back to local format (number keys)
    let speedMilestones: Record<number, { speed: number; time: number; distance: number }> | undefined;
    if (cr.speed_milestones) {
      speedMilestones = {};
      for (const [key, val] of Object.entries(cr.speed_milestones)) {
        speedMilestones[Number(key)] = val;
      }
    }

    // Restore full milestone data from milestones_data JSONB if available,
    // otherwise fall back to individual time columns (backwards compat)
    const md = cr.milestones_data;

    return {
      id: cr.local_id,
      vehicleId,
      startTime: cr.start_time ?? new Date(cr.created_at).getTime(),
      endTime: cr.end_time ?? new Date(cr.created_at).getTime(),
      milestones: {
        zeroToSixty: md?.zeroToSixty
          ?? (cr.zero_to_sixty_time != null
            ? { speed: SPEED_THRESHOLDS.SIXTY_MPH, time: cr.zero_to_sixty_time, distance: 0 }
            : undefined),
        zeroToHundred: md?.zeroToHundred
          ?? (cr.zero_to_hundred_time != null
            ? { speed: SPEED_THRESHOLDS.HUNDRED_MPH, time: cr.zero_to_hundred_time, distance: 0 }
            : undefined),
        quarterMile: md?.quarterMile
          ?? (cr.quarter_mile_time != null
            ? { speed: 0, time: cr.quarter_mile_time, distance: DISTANCE_THRESHOLDS.QUARTER_MILE }
            : undefined),
        halfMile: md?.halfMile
          ?? (cr.half_mile_time != null
            ? { speed: 0, time: cr.half_mile_time, distance: DISTANCE_THRESHOLDS.HALF_MILE }
            : undefined),
        speedMilestones,
      },
      maxSpeed: cr.max_speed,
      gpsPoints: cr.gps_points ?? [],
      createdAt: new Date(cr.created_at).getTime(),
      launchDetectionConfig: cr.launch_threshold_g != null && cr.launch_sample_count != null
        ? { thresholdG: cr.launch_threshold_g, sampleCount: cr.launch_sample_count }
        : undefined,
      syncedAt: Date.now(), // Already synced since it came from cloud
    };
  });
}

export async function deleteRunsFromCloud(runLocalIds: string[]): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log('Cannot delete runs: user not authenticated');
    return;
  }

  const { error } = await supabase
    .from('runs')
    .delete()
    .eq('user_id', user.id)
    .in('local_id', runLocalIds);

  if (error) {
    console.error('Error deleting runs from cloud:', error);
    throw error;
  }
}

// ─── Drive Sync ─────────────────────────────────────────────────────

export async function syncDriveToCloud(drive: Drive): Promise<CloudDrive | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log('Cannot sync drive: user not authenticated');
    return null;
  }

  // Get vehicle name if available
  let vehicleName: string | null = null;
  if (drive.vehicleId) {
    const vehicle = useVehicleStore.getState().getVehicleById(drive.vehicleId);
    if (vehicle) {
      vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    }
  }

  const cloudDrive = {
    user_id: user.id,
    local_id: drive.id,
    vehicle_name: vehicleName,
    start_time: drive.startTime,
    end_time: drive.endTime,
    distance: drive.distance,
    max_speed: drive.maxSpeed,
    avg_speed: drive.avgSpeed,
    gps_points: drive.gpsPoints,
  };

  const { data, error } = await supabase
    .from('drives')
    .upsert(cloudDrive, { onConflict: 'local_id' })
    .select()
    .single();

  if (error) {
    console.error('Error syncing drive:', error);
    throw error;
  }

  return data;
}

export async function syncAllUnsyncedDrives(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { drives, markDriveSynced } = useDriveHistoryStore.getState();
  const unsyncedDrives = drives.filter((drive) => !drive.syncedAt);

  let syncedCount = 0;

  for (const drive of unsyncedDrives) {
    try {
      const cloudDrive = await syncDriveToCloud(drive);
      if (cloudDrive) {
        markDriveSynced(drive.id);
        syncedCount++;
      }
    } catch (error) {
      console.error(`Failed to sync drive ${drive.id}:`, error);
    }
  }

  return syncedCount;
}

export async function fetchDrivesFromCloud(): Promise<StoredDrive[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('drives')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching drives from cloud:', error);
    return [];
  }

  return (data || []).map((cd: CloudDrive) => ({
    id: cd.local_id,
    vehicleId: null,
    startTime: cd.start_time,
    endTime: cd.end_time,
    distance: cd.distance,
    maxSpeed: cd.max_speed,
    avgSpeed: cd.avg_speed,
    gpsPoints: cd.gps_points ?? [],
    createdAt: new Date(cd.created_at).getTime(),
    syncedAt: Date.now(),
  }));
}

export async function deleteDrivesFromCloud(driveLocalIds: string[]): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log('Cannot delete drives: user not authenticated');
    return;
  }

  const { error } = await supabase
    .from('drives')
    .delete()
    .eq('user_id', user.id)
    .in('local_id', driveLocalIds);

  if (error) {
    console.error('Error deleting drives from cloud:', error);
    throw error;
  }
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
    trim: vehicle.trim ?? null,
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
    trim: cv.trim ?? undefined,
    photoUri: cv.photo_uri ?? undefined,
    upgrades: (cv.upgrades || []) as VehicleUpgrade[],
    notes: cv.notes ?? undefined,
    createdAt: new Date(cv.created_at).getTime(),
    updatedAt: new Date(cv.updated_at).getTime(),
  }));
}
