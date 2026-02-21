import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Image,
  FlatList,
  StyleSheet,
  ViewToken,
} from 'react-native';
import type { PostImage } from '@/src/types';

interface ImageCarouselProps {
  images: PostImage[];
  width: number;
  height: number;
}

function ImageCarouselComponent({ images, width, height }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = useCallback(
    ({ item }: { item: PostImage }) => (
      <Image
        source={{ uri: item.image_url, cache: 'force-cache' }}
        style={{ width, height, backgroundColor: '#1a1a1a' }}
        resizeMode="cover"
      />
    ),
    [width, height]
  );

  if (images.length === 1) {
    return (
      <Image
        source={{ uri: images[0].image_url, cache: 'force-cache' }}
        style={{ width, height, backgroundColor: '#1a1a1a' }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        removeClippedSubviews
      />
      <View style={styles.dotContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export const ImageCarousel = React.memo(ImageCarouselComponent);
