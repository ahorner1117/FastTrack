import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { COLORS } from '../../utils/constants';
import type { GPSPoint } from '../../types';

interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  isTracking: boolean;
  gpsPoints?: GPSPoint[];
  showRoute?: boolean;
  showStartMarker?: boolean;
  showEndMarker?: boolean;
  fitToRoute?: boolean;
  height?: number;
}

export function LocationMap({
  latitude,
  longitude,
  isTracking,
  gpsPoints = [],
  showRoute = false,
  showStartMarker = false,
  showEndMarker = false,
  fitToRoute = false,
  height = 150,
}: LocationMapProps) {
  const mapRef = useRef<MapView>(null);

  // Fit to route when requested and we have points
  useEffect(() => {
    if (fitToRoute && gpsPoints.length > 1 && mapRef.current) {
      const coordinates = gpsPoints.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
      }));
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [fitToRoute, gpsPoints]);

  // Get route coordinates for polyline
  const routeCoordinates = gpsPoints.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  const startPoint = gpsPoints.length > 0 ? gpsPoints[0] : null;
  const endPoint = gpsPoints.length > 1 ? gpsPoints[gpsPoints.length - 1] : null;

  // Don't render map if we don't have coordinates and not showing a route
  if (
    (latitude === null || longitude === null) &&
    !fitToRoute &&
    !isTracking
  ) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  // For fitToRoute mode, calculate initial region from points
  let region: Region | undefined;
  if (!fitToRoute && latitude !== null && longitude !== null) {
    region = {
      latitude,
      longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
  } else if (gpsPoints.length > 0) {
    // Calculate center of route for initial region
    const lats = gpsPoints.map((p) => p.latitude);
    const lons = gpsPoints.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max(0.005, (maxLat - minLat) * 1.5),
      longitudeDelta: Math.max(0.005, (maxLon - minLon) * 1.5),
    };
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        region={!fitToRoute ? region : undefined}
        showsUserLocation={isTracking && !fitToRoute}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        userInterfaceStyle="dark"
        mapType="standard"
      >
        {/* Route polyline */}
        {showRoute && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={COLORS.accent}
            strokeWidth={4}
          />
        )}

        {/* Start marker (green) */}
        {showStartMarker && startPoint && (
          <Marker
            coordinate={{
              latitude: startPoint.latitude,
              longitude: startPoint.longitude,
            }}
            pinColor="#00CC66"
            title="Start"
          />
        )}

        {/* End marker (red) */}
        {showEndMarker && endPoint && (
          <Marker
            coordinate={{
              latitude: endPoint.latitude,
              longitude: endPoint.longitude,
            }}
            pinColor="#FF4444"
            title="Finish"
          />
        )}

        {/* Current position marker when tracking and not showing route */}
        {!showRoute &&
          latitude !== null &&
          longitude !== null &&
          !fitToRoute && (
            <Marker
              coordinate={{ latitude, longitude }}
              pinColor={COLORS.accent}
            />
          )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
