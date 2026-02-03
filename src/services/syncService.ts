import { supabase } from '../lib/supabase';
import { useHistoryStore, type StoredRun } from '../stores/historyStore';
import { useVehicleStore } from '../stores/vehicleStore';
import type { Run, CloudRun } from '../types';

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
