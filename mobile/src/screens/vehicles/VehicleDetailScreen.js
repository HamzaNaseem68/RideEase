import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function VehicleDetailScreen({ route, navigation }) {
  const { vehicleId } = route.params;
  const { colors } = useTheme();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicleDetails();
  }, [vehicleId]);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    try {
      const res = await api.vehicles.get(vehicleId);
      if (res.success) {
        setVehicle(res.vehicle);
      }
    } catch (err) {
      console.warn("Error fetching vehicle details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Vehicle details could not be found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCar = vehicle.type === 'car';
  const seatsText = isCar ? `${vehicle.seatingCapacity} Seater Space` : 'Solo/Dual Riding';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ride Overview</Text>
        <View style={{ width: 44 }} /> {/* placeholder for alignment */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <Image source={{ uri: vehicle.image }} style={styles.mainImage} />

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            {(vehicle.badges || []).map((badge, idx) => (
              <View key={idx} style={[styles.badgeTag, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.badgeTagText, { color: '#F59E0B' }]}>{badge}</Text>
              </View>
            ))}
            <View style={[styles.badgeTag, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.badgeTagText, { color: colors.textMuted }]}>{vehicle.transmission}</Text>
            </View>
          </View>

          <Text style={[styles.vehicleTitle, { color: colors.text }]}>{vehicle.name}</Text>
          
          <View style={[styles.priceBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Rental Rate</Text>
            <Text style={styles.priceValue}>PKR {vehicle.pricePerDay.toLocaleString()} <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>/ day</Text></Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Specifications</Text>
          
          <View style={styles.specsGrid}>
            <View style={[styles.specBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="car-outline" size={24} color="#F59E0B" />
              <Text style={[styles.specBoxLbl, { color: colors.textMuted }]}>Vehicle Type</Text>
              <Text style={[styles.specBoxVal, { color: colors.text }]}>{vehicle.type === 'car' ? 'Car' : 'Bike'}</Text>
            </View>

            <View style={[styles.specBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="gas-pump-outline" size={24} color="#F59E0B" />
              <Text style={[styles.specBoxLbl, { color: colors.textMuted }]}>Fuel Class</Text>
              <Text style={[styles.specBoxVal, { color: colors.text }]}>{vehicle.fuelType}</Text>
            </View>

            <View style={[styles.specBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="people-outline" size={24} color="#F59E0B" />
              <Text style={[styles.specBoxLbl, { color: colors.textMuted }]}>Capacity</Text>
              <Text style={[styles.specBoxVal, { color: colors.text }]}>{seatsText}</Text>
            </View>

            <View style={[styles.specBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="settings-outline" size={24} color="#F59E0B" />
              <Text style={[styles.specBoxLbl, { color: colors.textMuted }]}>Transmission</Text>
              <Text style={[styles.specBoxVal, { color: colors.text }]}>{vehicle.transmission}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: colors.textMuted }]}>
            {vehicle.description || `${vehicle.name} provides clean performance, extremely comfortable drive experiences, smart safety protocols, and outstanding reliability. Perfect matching pick for standard Pakistani road structures.`}
          </Text>

          <View style={[styles.locationBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={22} color="#F59E0B" />
            <View style={styles.locationDetails}>
              <Text style={[styles.locationLbl, { color: colors.text }]}>Pickup Location Area</Text>
              <Text style={[styles.locationVal, { color: colors.textMuted }]}>{vehicle.location?.address || 'Gulberg III, Lahore, Punjab'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Booking Drawer Action Banner */}
      <View style={[styles.footerBanner, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Base Daily Rate</Text>
          <Text style={styles.footerPrice}>PKR {vehicle.pricePerDay.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, { opacity: vehicle.isAvailable ? 1 : 0.6 }]}
          disabled={!vehicle.isAvailable}
          onPress={() => navigation.navigate('BookingCheckout', { vehicleId: vehicle._id })}
        >
          <Text style={styles.bookBtnText}>{vehicle.isAvailable ? 'Book This Ride' : 'Already Booked'}</Text>
          <Ionicons name="calendar" size={16} color="#000" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20
  },
  backBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12
  },
  backBtnText: {
    color: '#000',
    fontWeight: '700'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  scrollContainer: {
    paddingBottom: 100
  },
  mainImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover'
  },
  content: {
    padding: 20
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  badgeTag: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12
  },
  badgeTagText: {
    fontSize: 11,
    fontWeight: '700'
  },
  vehicleTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16
  },
  priceBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 24
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24
  },
  specBox: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center'
  },
  specBoxLbl: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2
  },
  specBoxVal: {
    fontSize: 13,
    fontWeight: '800'
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: '500',
    marginBottom: 24
  },
  locationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 18,
    gap: 12
  },
  locationDetails: {
    flex: 1
  },
  locationLbl: {
    fontSize: 13,
    fontWeight: '700'
  },
  locationVal: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2
  },
  footerBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    padding: 20,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B'
  },
  bookBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  bookBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});
