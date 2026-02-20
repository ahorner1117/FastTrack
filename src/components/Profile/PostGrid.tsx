import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Grid3x3 } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import type { Post } from '@/src/types';

const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface PostGridProps {
  posts: Post[];
  isDark: boolean;
  onPostPress: (post: Post) => void;
  isLoading?: boolean;
  onEndReached?: () => void;
  ListHeaderComponent?: React.ReactElement | null;
  scrollEnabled?: boolean;
}

export function PostGrid({
  posts,
  isDark,
  onPostPress,
  isLoading = false,
  onEndReached,
  ListHeaderComponent,
  scrollEnabled = true,
}: PostGridProps) {
  const colors = Colors[isDark ? 'dark' : 'light'];
  const cellSize = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => {
      const isLeftColumn = index % NUM_COLUMNS === 0;
      const isRightColumn = index % NUM_COLUMNS === NUM_COLUMNS - 1;

      return (
        <Pressable
          style={[
            styles.gridItem,
            {
              width: cellSize,
              height: cellSize,
              marginLeft: isLeftColumn ? 0 : GRID_GAP,
              marginBottom: GRID_GAP,
            },
          ]}
          onPress={() => onPostPress(item)}
        >
          <Image
            source={{ uri: item.thumbnail_url || item.image_url, cache: 'force-cache' }}
            style={styles.gridImage}
            resizeMode="cover"
          />
        </Pressable>
      );
    },
    [cellSize, onPostPress]
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Grid3x3 color={colors.textSecondary} size={48} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No posts yet
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.accent} />
      </View>
    );
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={NUM_COLUMNS}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={posts.length === 0 && styles.emptyListContent}
      getItemLayout={ListHeaderComponent ? undefined : (_, index) => ({
        length: cellSize + GRID_GAP,
        offset: (cellSize + GRID_GAP) * Math.floor(index / NUM_COLUMNS),
        index,
      })}
      maxToRenderPerBatch={9}
      initialNumToRender={9}
      removeClippedSubviews={true}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  gridItem: {
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
