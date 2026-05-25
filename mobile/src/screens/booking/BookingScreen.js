import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function BookingScreen({ route, navigation }) {
  const { vehicleId } = route.params;
  const { user, syncProfile } = useAuth();
  const { colors } = useTheme();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [pickupLocation, setPickupLocation] = useState('Gulberg III, Lahore');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [insurance, setInsurance] = useState(false);
  const [delivery, setDelivery] = useState(false);

  // Price calculations
  const [totalDays, setTotalDays] = useState(2);
  const [invoice, setInvoice] = useState({ base: 0, insurance: 0, delivery: 0, total: 0 });

  useEffect(() => {
    // Identity verification gate check
    if (!user || !user.cnicUploaded || !user.licenseUploaded) {
      Alert.alert(
        "Verification Required",
        "Security policy: You must verify your CNIC and Driving License credentials before booking any vehicle.",
        [
          { text: "Verify Now", onPress: () => navigation.replace('VerifyIdentity', { vehicleId }) },
          { text: "Go Back", onPress: () => navigation.goBack(), style: "cancel" }
        ]
      );
    }
    
    fetchVehicle();
    setupDates();
  }, [vehicleId, user]);

  const fetchVehicle = async () => {
    try {
      const res = await api.vehicles.get(vehicleId);
      if (res.success) {
        setVehicle(res.vehicle);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const setupDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 2);
    
    setPickupDate(today.toISOString().split('T')[0]);
    setReturnDate(tomorrow.toISOString().split('T')[0]);
  };

  useEffect(() => {
    if (!vehicle) return;
    
    // Parse dates and calculate days difference
    const pDate = new Date(pickupDate);
    const rDate = new Date(returnDate);
    const timeDiff = rDate.getTime() - pDate.getTime();
    
    let days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (days <= 0 || isNaN(days)) days = 1;
    
    setTotalDays(days);

    // Cost calculations
    const base = vehicle.pricePerDay * days;
    const ins = insurance ? 1500 * days : 0;
    const del = delivery ? 2000 : 0;
    const grand = base + ins + del;

    setInvoice({
      base,
      insurance: ins,
      delivery: del,
      total: grand
    });
  }, [pickupDate, returnDate, insurance, delivery, vehicle]);

  const confirmBooking = async () => {
    if (!pickupLocation || !pickupDate || !returnDate) {
      Alert.alert("Error", "Please fill in all booking fields");
      return;
    }

    if (user.walletBalance < invoice.total) {
      Alert.alert(
        "Insufficient Balance",
        `Booking costs PKR ${invoice.total.toLocaleString()} but your wallet has PKR ${user.walletBalance.toLocaleString()}.\n\nWould you like to top up your wallet?`,
        [
          { text: "Top Up Now", onPress: () => navigation.navigate('Wallet') },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.bookings.create({
        vehicleId,
        pickupDate,
        returnDate,
        pickupLocation,
        insuranceSelected: insurance,
        deliverySelected: delivery
      });

      if (res.success) {
        await syncProfile(); // refresh balance
        Alert.alert(
          "Booking Confirmed!",
          `Rented ${vehicle.name} for ${totalDays} days successfully. Total charged: PKR ${invoice.total.toLocaleString()}`,
          [{ text: "View Rentals", onPress: () => navigation.replace('History') }]
        );
      } else {
        Alert.alert("Booking Rejected", res.message || "Failed booking vehicle");
      }
    } catch (err) {
      Alert.alert("System Error", "Failed to contact checkout service");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 44 }} /> {/* placeholder */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {vehicle ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Rental Request</Text>
            <Text style={[styles.vehicleTitle, { color: '#F59E0B' }]}>{vehicle.name}</Text>
            <Text style={[styles.vehicleMeta, { color: colors.textMuted }]}>{vehicle.transmission} • {vehicle.fuelType} • PKR {vehicle.pricePerDay.toLocaleString()}/day</Text>
          </View>
        ) : null}

        {/* Checkout Inputs Form */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Booking Calendar Details</Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Pickup & Return Location</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              value={pickupLocation}
              onChangeText={setPickupLocation}
              placeholder="e.g. Gulberg III, Lahore"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Pickup Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              value={pickupDate}
              onChangeText={setPickupDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Return Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              value={returnDate}
              onChangeText={setReturnDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Add-ons Checklist */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Optional Add-ons</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchDetails}>
              <Text style={[styles.switchTitle, { color: colors.text }]}><Ionicons name="shield-checkmark" size={16} color="#10B981" /> Full Damage Insurance</Text>
              <Text style={[styles.switchSub, { color: colors.textMuted }]}>PKR 1,500 / day</Text>
            </View>
            <Switch
              value={insurance}
              onValueChange={setInsurance}
              thumbColor={insurance ? '#F59E0B' : '#64748B'}
              trackColor={{ false: colors.card, true: 'rgba(245,158,11,0.2)' }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchDetails}>
              <Text style={[styles.switchTitle, { color: colors.text }]}><Ionicons name="home" size={16} color="#F59E0B" /> Home Doorstep Delivery</Text>
              <Text style={[styles.switchSub, { color: colors.textMuted }]}>PKR 2,000 flat charge</Text>
            </View>
            <Switch
              value={delivery}
              onValueChange={setDelivery}
              thumbColor={delivery ? '#F59E0B' : '#64748B'}
              trackColor={{ false: colors.card, true: 'rgba(245,158,11,0.2)' }}
            />
          </View>
        </View>

        {/* dynamic bill Invoice breakdown */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Bill Invoice Summary</Text>
          
          <View style={styles.invoiceRow}>
            <Text style={{ color: colors.textMuted }}>Duration</Text>
            <Text style={[styles.invoiceVal, { color: colors.text }]}>{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</Text>
          </View>

          <View style={styles.invoiceRow}>
            <Text style={{ color: colors.textMuted }}>Base Charge</Text>
            <Text style={[styles.invoiceVal, { color: colors.text }]}>PKR {invoice.base.toLocaleString()}</Text>
          </View>

          {insurance ? (
            <View style={styles.invoiceRow}>
              <Text style={{ color: colors.textMuted }}>Damage Insurance</Text>
              <Text style={[styles.invoiceVal, { color: colors.text }]}>PKR {invoice.insurance.toLocaleString()}</Text>
            </View>
          ) : null}

          {delivery ? (
            <View style={styles.invoiceRow}>
              <Text style={{ color: colors.textMuted }}>Home Delivery</Text>
              <Text style={[styles.invoiceVal, { color: colors.text }]}>PKR {invoice.delivery.toLocaleString()}</Text>
            </View>
          ) : null}

          <View style={[styles.invoiceRow, styles.invoiceTotalRow, { borderTopColor: colors.border }]}>
            <Text style={{ fontWeight: '800', color: '#F59E0B' }}>Total Invoice</Text>
            <Text style={[styles.invoiceVal, { fontWeight: '800', color: '#F59E0B', fontSize: 18 }]}>PKR {invoice.total.toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, { opacity: submitting ? 0.7 : 1 }]}
          disabled={submitting}
          onPress={confirmBooking}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Text style={styles.btnText}>Pay & Confirm Rent</Text>
              <Ionicons name="card-outline" size={20} color="#000" />
            </>
          )}
        </TouchableOpacity>

      </ScrollView>

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
    padding: 20,
    paddingBottom: 60
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    elevation: 2
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
    color: '#F59E0B'
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4
  },
  vehicleMeta: {
    fontSize: 12,
    fontWeight: '500'
  },
  formGroup: {
    marginBottom: 14
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  switchDetails: {
    flex: 1,
    marginRight: 10
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    flexDirection: 'row',
    alignItems: 'center'
  },
  switchSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  invoiceVal: {
    fontSize: 13,
    fontWeight: '700'
  },
  invoiceTotalRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
    marginBottom: 0
  },
  btn: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  btnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});
