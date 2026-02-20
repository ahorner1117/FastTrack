import reservedUsernames from './reservedUsernames.json';
import reservedVehicleMakes from './reservedVehicleMakes.json';

const reservedSet = new Set(reservedUsernames);
const vehicleMakeSet = new Set(reservedVehicleMakes);

// Subset of words that should be blocked even as substrings within a username
const bannedSubstrings = [
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'twat', 'dick', 'cock',
  'pussy', 'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore',
  'pedo', 'pedophile', 'rape', 'rapist', 'molest', 'nazi', 'hitler',
  'kkk', 'genocide', 'terrorist', 'childporn', 'child_porn', 'kiddie',
  'cocksucker', 'motherfucker', 'spic', 'chink', 'gook', 'kike',
  'wetback', 'beaner', 'raghead', 'towelhead', 'sandnigger', 'tranny',
  'porn', 'pornhub', 'onlyfans',
];

export type UsernameValidationResult =
  | { allowed: true }
  | { allowed: false; reason: 'reserved' | 'vehicle_make'; message: string };

export function validateUsername(username: string): UsernameValidationResult {
  const normalized = username.toLowerCase().trim();

  // Check vehicle makes first (custom message)
  if (vehicleMakeSet.has(normalized)) {
    return {
      allowed: false,
      reason: 'vehicle_make',
      message: 'This username is taken, inquire about obtaining this username',
    };
  }

  // Exact match against the reserved list
  if (reservedSet.has(normalized)) {
    return {
      allowed: false,
      reason: 'reserved',
      message: 'This username is not available',
    };
  }

  // Substring match against banned words
  for (const word of bannedSubstrings) {
    if (normalized.includes(word)) {
      return {
        allowed: false,
        reason: 'reserved',
        message: 'This username is not available',
      };
    }
  }

  return { allowed: true };
}

/** Simple boolean check for backwards compatibility */
export function isReservedUsername(username: string): boolean {
  return !validateUsername(username).allowed;
}
