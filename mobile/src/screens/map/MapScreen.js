import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

// Only load MapView on native platforms, mock on web to prevent crashes
let MapView, Marker, Callout;
if (Platform.OS !== 'web') {
  try {
    const MapModule = require('react-native-maps');
    MapView = MapModule.default;
    Marker = MapModule.Marker;
    Callout = MapModule.Callout;
  } catch (err) {
    console.warn("react-native-maps is not available in this environment.");
  }
}

export default function MapScreen({ navigation }) {
  const { colors } = useTheme();

  const [userLocation, setUserLocation] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchGPSData();
  }, []);

  const fetchGPSData = async () => {
    setLoading(true);
    try {
      // 1. Request GPS permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('GPS location permissions denied. Showing standard map.');
      } else {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        });
      }

      // 2. Fetch fleet coordinates from DB
      const res = await api.vehicles.list();
      if (res.success) {
        setVehicles(res.vehicles);
      }
    } catch (err) {
      console.warn("Failed fetching GPS location or vehicles data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mock Map View for Web fallback or missing module
  const renderMockMap = () => {
    return (
      <View style={[styles.mockMap, { backgroundColor: '#0E1726' }]}>
        <View style={styles.gridOverlay} />
        
        {/* User simulated GPS Dot */}
        <View style={[styles.mockGpsDot, { top: '50%', left: '50%' }]} />
        
        {/* Vehicles Pin placements */}
        {vehicles.map((v, index) => {
          const latDelta = v.location.latitude - 31.5204;
          const lngDelta = v.location.longitude - 74.3587;
          
          const top = 50 - (latDelta * 400);
          const left = 50 + (lngDelta * 400);
          
          return (
            <TouchableOpacity
              key={v._id}
              style={[styles.mockPin, { top: `${top}%`, left: `${left}%` }]}
              onPress={() => navigation.navigate('Rent', {
                screen: 'VehicleDetail',
                params: { vehicleId: v._id }
              })}
            >
              <Ionicons
                name={v.type === 'car' ? "car" : "bicycle"}
                size={12}
                color="#000"
              />
            </TouchableOpacity>
          );
        })}

        <View style={styles.mockOverlayTip}>
          <Ionicons name="information-circle-outline" size={16} color="#FFF" />
          <Text style={styles.mockOverlayText}>
            Map view is simulated for Web testing. Tap pins to book vehicles directly.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Nearby Vehicles</Text>
        <Text style={[styles.headerSub, { color: colors.textMuted }]}>
          {errorMsg || 'Showing available cars and bikes near you'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <View style={styles.mapWrapper}>
          
          {Platform.OS === 'web' || !MapView ? (
            renderMockMap()
          ) : (
            <MapView
              style={styles.map}
              initialRegion={userLocation || {
                latitude: 31.5204, // Default Lahore center
                longitude: 74.3587,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08
              }}
              showsUserLocation={true}
            >
              {vehicles.map((v) => (
                <Marker
                  key={v._id}
                  coordinate={{
                    latitude: v.location.latitude,
                    longitude: v.location.longitude
                  }}
                  pinColor="#F59E0B"
                  title={v.name}
                  description={`PKR ${v.pricePerDay.toLocaleString()}/day`}
                >
                  <Callout
                    onPress={() => navigation.navigate('Rent', {
                      screen: 'VehicleDetail',
                      params: { vehicleId: v._id }
                    })}
                  >
                    <View style={styles.callout}>
                      <Text style={styles.calloutTitle}>{v.name}</Text>
                      <Text style={styles.calloutSub}>PKR {v.pricePerDay.toLocaleString()}/day • Tap to Rent</Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          )}

        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800'
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  mapWrapper: {
    flex: 1,
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  map: {
    width: '100%',
    height: '100%'
  },
  callout: {
    width: 150,
    padding: 6
  },
  calloutTitle: {
    fontWeight: '700',
    fontSize: 13
  },
  calloutSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  
  // Simulated Map styling
  mockMap: {
    flex: 1,
    position: 'relative'
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.1,
    borderWidth: 1,
    borderColor: '#FFF',
    borderStyle: 'dashed'
  },
  mockGpsDot: {
    width: 14,
    height: 14,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 7,
    position: 'absolute',
    transform: [{ translateX: -7 }, { translateY: -7 }]
  },
  mockPin: {
    width: 24,
    height: 24,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    transform: [{ translateX: -12 }, { translateY: -12 }]
  },
  mockOverlayTip: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  mockOverlayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    flex: 1
  }
});
