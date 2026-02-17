import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Search, Users, RefreshCw, Share2 } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { ContactCard } from '@/src/components/Friends';
import {
  getContactsWithPhoneHashes,
  type NormalizedContact,
} from '@/src/services/contactsService';
import { findUsersFromPhoneHashes } from '@/src/services/friendsService';
import { useFriendsStore } from '@/src/stores/friendsStore';
import { useAuthStore } from '@/src/stores/authStore';
import type { Profile } from '@/src/types';

interface MatchedContact {
  profile: Profile;
  contactName: string;
}

export default function AddFriendsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { user } = useAuthStore();
  const { sentRequests, friends, sendRequest, fetchSentRequests } = useFriendsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [matchedContacts, setMatchedContacts] = useState<MatchedContact[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get contacts with phone hashes
      const contacts = await getContactsWithPhoneHashes();
      console.log(`Loaded ${contacts.length} phone numbers from contacts`);

      // Get unique hashes
      const hashToContact = new Map<string, NormalizedContact>();
      contacts.forEach((contact) => {
        if (!hashToContact.has(contact.phoneHash)) {
          hashToContact.set(contact.phoneHash, contact);
        }
      });

      const uniqueHashes = Array.from(hashToContact.keys());
      console.log(`Unique phone hashes: ${uniqueHashes.length}`);

      // Find matching users in Supabase
      const matchedUsers = await findUsersFromPhoneHashes(uniqueHashes);
      console.log(`Matched users in database: ${matchedUsers.length}`, matchedUsers.map(u => u.display_name || u.email));

      // Filter out self and existing friends
      const friendIds = new Set(
        friends.map((f) => (f.user_id === user?.id ? f.friend_id : f.user_id))
      );

      const matched: MatchedContact[] = [];
      matchedUsers.forEach((profile) => {
        if (profile.id === user?.id) return;
        if (friendIds.has(profile.id)) return;

        const contact = hashToContact.get(profile.phone_hash || '');
        if (contact) {
          matched.push({
            profile,
            contactName: contact.name,
          });
        }
      });

      setMatchedContacts(matched);
    } catch (err: any) {
      console.error('Error loading contacts:', JSON.stringify(err, null, 2), err.message, err.code);
      if (err.message === 'Contacts permission not granted') {
        setError('Please grant contacts permission to find friends');
      } else if (err.code === 'PGRST301' || err.message?.includes('JWT')) {
        setError('Please sign in to find friends');
      } else if (err.code?.startsWith('PGRST') || err.message?.includes('supabase')) {
        setError('Unable to connect to server. Please try again.');
      } else {
        setError(err.message || 'Failed to load contacts');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (profile: Profile) => {
    if (loadingIds.has(profile.id)) return;
    setLoadingIds((prev) => new Set(prev).add(profile.id));
    try {
      await sendRequest(profile.id);
      Alert.alert('Success', `Friend request sent to ${profile.display_name || profile.email}!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send friend request');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(profile.id);
        return next;
      });
    }
  };

  const isPending = (profileId: string) => {
    return sentRequests.some((r) => r.friend_id === profileId);
  };

  const renderContact = ({ item }: { item: MatchedContact }) => (
    <ContactCard
      profile={item.profile}
      contactName={item.contactName}
      onAddFriend={() => handleAddFriend(item.profile)}
      isPending={isPending(item.profile.id)}
      isLoading={loadingIds.has(item.profile.id)}
      isDark={isDark}
    />
  );

  const handleInvite = async () => {
    try {
      await Share.share({
        message: "Track your 0-60 and quarter mile times with FastTrack! Download it here: https://apps.apple.com/app/fasttrack",
      });
    } catch (error) {
      // User cancelled or error occurred
    }
  };

  const renderEmptyList = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Search color={colors.textSecondary} size={48} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No contacts found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          None of your contacts are using FastTrack yet. Invite them to join!
        </Text>
        <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
          <Share2 color="#000000" size={20} />
          <Text style={styles.inviteButtonText}>Invite Friends</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Users color={colors.textSecondary} size={48} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadContacts}
        >
          <RefreshCw color={COLORS.accent} size={20} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Scanning contacts...
          </Text>
        </View>
      ) : (
        <FlatList
          data={matchedContacts}
          keyExtractor={(item) => item.profile.id}
          renderItem={renderContact}
          contentContainerStyle={[
            styles.listContent,
            matchedContacts.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyList}
          ListHeaderComponent={
            matchedContacts.length > 0 ? (
              <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                CONTACTS ON FASTTRACK
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    gap: 8,
  },
  retryText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    gap: 10,
  },
  inviteButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
