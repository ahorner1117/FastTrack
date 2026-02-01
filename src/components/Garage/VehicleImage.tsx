import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Car } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';

interface VehicleImageProps {
  photoUri?: string;
  size?: number;
  isDark?: boolean;
}

export function VehicleImage({ photoUri, size = 64, isDark = true }: VehicleImageProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 4,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: colors.surfaceElevated,
        },
      ]}
    >
      <Car color={colors.textTertiary} size={size * 0.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
