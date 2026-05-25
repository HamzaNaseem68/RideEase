import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function BookingHistoryScreen({ navigation }) {
  const { syncProfile } = useAuth();
  const { colors } = useTheme();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    
    // Auto sync on focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBookings();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.bookings.history();
      if (res.success) {
        // Sort by date descending
        const sorted = (res.bookings || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBookings(sorted);
      }
    } catch (err) {
      console.warn("Error fetching booking records:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    Alert.alert(
      "Cancel Rental?",
      "Are you sure you want to cancel this rental booking? Your wallet balance will be instantly refunded in full.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await api.bookings.cancel(bookingId);
              if (res.success) {
                Alert.alert("Rental Cancelled", "Your booking has been cancelled and full payment has been refunded to your wallet balance.");
                await syncProfile(); // update local context balance
                fetchBookings(); // refresh history
              } else {
                Alert.alert("Cancellation Failed", res.message || "Failed cancelling trip");
              }
            } catch (err) {
              Alert.alert("System Error", "Failed to communicate with cancellation API");
            }
          }
        }
      ]
    );
  };

  const handleComplete = async (bookingId) => {
    try {
      const res = await api.bookings.complete(bookingId);
      if (res.success) {
        Alert.alert("Trip Completed!", "We hope you enjoyed your ride. You can now submit a damage report if needed.");
        fetchBookings();
      }
    } catch (err) {
      Alert.alert("Error", "Failed completing trip record");
    }
  };

  const renderBookingItem = ({ item }) => {
    const pDate = new Date(item.pickupDate).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
    const rDate = new Date(item.returnDate).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
    
    let statusColor = '#F59E0B'; // Active
    if (item.status === 'Completed') statusColor = '#10B981';
    if (item.status === 'Cancelled') statusColor = '#EF4444';

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        
        <View style={styles.cardHeader}>
          <Text style={[styles.vehicleTitle, { color: colors.text }]}>{item.vehicle ? item.vehicle.name : 'Unknown Ride'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLbl, { color: colors.textMuted }]}>Duration:</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{item.totalDays} Days</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLbl, { color: colors.textMuted }]}>Schedule Dates:</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{pDate} - {rDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLbl, { color: colors.textMuted }]}>Pickup Area:</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{item.pickupLocation}</Text>
          </View>

          <View style={[styles.invoiceRow, { borderTopColor: colors.border }]}>
            <Text style={{ fontWeight: '700', color: colors.textMuted }}>Total Charged:</Text>
            <Text style={{ fontWeight: '800', color: '#F59E0B', fontSize: 15 }}>PKR {item.totalCost.toLocaleString()}</Text>
          </View>
        </View>

        {item.status === 'Active' ? (
          <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.1)' }]}
              onPress={() => handleComplete(item._id)}
            >
              <Ionicons name="flag-outline" size={16} color="#10B981" />
              <Text style={[styles.actionBtnTxt, { color: '#10B981' }]}>Complete Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
              onPress={() => handleCancel(item._id)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={[styles.actionBtnTxt, { color: '#EF4444' }]}>Cancel Rent</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {item.status === 'Completed' ? (
          <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.card, width: '100%', justifyContent: 'center' }]}
              onPress={() => navigation.navigate('DamageLog', { bookingId: item._id })}
            >
              <Ionicons name="warning-outline" size={16} color="#F59E0B" />
              <Text style={[styles.actionBtnTxt, { color: '#F59E0B' }]}>Submit Damage Report</Text>
            </TouchableOpacity>
          </View>
        ) : null}

      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Booking History</Text>
        <Text style={[styles.headerSub, { color: colors.textMuted }]}>Manage past and active rentals</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color={colors.textMuted} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No rental bookings found in your history.</Text>
            </View>
          }
        />
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
  listContainer: {
    padding: 20,
    paddingBottom: 40
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  detailLbl: {
    fontSize: 12,
    fontWeight: '500'
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700'
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    paddingTop: 10,
    marginTop: 10
  },
  cardActions: {
    borderTopWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  actionBtnTxt: {
    fontSize: 12,
    fontWeight: '700'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center'
  }
});
