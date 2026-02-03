import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';

export interface NormalizedContact {
  name: string;
  phoneHash: string;
  originalPhone: string;
}

function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters and normalize
  return phone.replace(/\D/g, '').slice(-10);
}

export async function hashPhoneNumber(phone: string): Promise<string> {
  const normalized = normalizePhoneNumber(phone);
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalized
  );
  return hash;
}

export async function requestContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}

export async function getContactsPermissionStatus(): Promise<boolean> {
  const { status } = await Contacts.getPermissionsAsync();
  return status === 'granted';
}

export async function getContactsWithPhoneHashes(): Promise<NormalizedContact[]> {
  const hasPermission = await requestContactsPermission();

  if (!hasPermission) {
    throw new Error('Contacts permission not granted');
  }

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
  });

  // Collect all phone entries first
  const phoneEntries: { name: string; phone: string }[] = [];
  for (const contact of data) {
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      for (const phone of contact.phoneNumbers) {
        if (phone.number) {
          phoneEntries.push({
            name: contact.name || 'Unknown',
            phone: phone.number,
          });
        }
      }
    }
  }

  // Hash all phone numbers in parallel
  const contacts = await Promise.all(
    phoneEntries.map(async (entry) => ({
      name: entry.name,
      phoneHash: await hashPhoneNumber(entry.phone),
      originalPhone: entry.phone,
    }))
  );

  return contacts;
}
