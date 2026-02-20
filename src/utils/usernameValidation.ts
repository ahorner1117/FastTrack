import reservedUsernames from './reservedUsernames.json';

const reservedSet = new Set(reservedUsernames);

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

export function isReservedUsername(username: string): boolean {
  const normalized = username.toLowerCase().trim();

  // Exact match against the full reserved list
  if (reservedSet.has(normalized)) return true;

  // Substring match against the banned words
  for (const word of bannedSubstrings) {
    if (normalized.includes(word)) return true;
  }

  return false;
}
