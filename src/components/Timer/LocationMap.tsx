import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { COLORS } from '../../utils/constants';

interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  isTracking: boolean;
}

export function LocationMap({ latitude, longitude, isTracking }: LocationMapProps) {
  // Don't render map if we don't have coordinates
  if (latitude === null || longitude === null || !isTracking) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        userInterfaceStyle="dark"
        mapType="standard"
      >
        <Marker
          coordinate={{ latitude, longitude }}
          pinColor={COLORS.accent}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 150,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.dark.surface,
  },
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: COLORS.dark.surface,
  },
});
