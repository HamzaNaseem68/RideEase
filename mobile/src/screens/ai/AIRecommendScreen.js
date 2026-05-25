import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function AIRecommendScreen({ navigation }) {
  const { colors } = useTheme();

  // State parameters
  const [budget, setBudget] = useState('20000');
  const [passengers, setPassengers] = useState('2');
  const [tripType, setTripType] = useState('City travel');
  const [duration, setDuration] = useState('3');
  const [fuelPreference, setFuelPreference] = useState('No preference');
  const [dailyDistance, setDailyDistance] = useState('120');

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const handleRecommend = async () => {
    if (!budget || !duration || !dailyDistance) {
      Alert.alert("Error", "Please fill in all details to analyze");
      return;
    }

    setLoading(true);
    setRecommendation(null);

    try {
      const res = await api.ai.recommend({
        budget: parseFloat(budget),
        passengers: parseInt(passengers, 10),
        tripType,
        duration: parseInt(duration, 10),
        fuelPreference,
        dailyDistance: parseFloat(dailyDistance)
      });

      if (res.success) {
        setRecommendation(res);
      } else {
        Alert.alert("Consulting Error", res.message || "Failed parsing advice");
      }
    } catch (err) {
      Alert.alert("Connection Failure", "Could not reach the AI consultant");
    } finally {
      setLoading(false);
    }
  };

  const cleanMarkdown = (text) => {
    if (!text) return '';
    // Strip simple bold markdown signs for cleaner rendering on simple text layouts
    return text.replace(/\*\*/g, '').replace(/\*/g, '');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI Advisor</Text>
        <Text style={[styles.headerSub, { color: colors.textMuted }]}>Find the perfect vehicle based on your trip details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {!loading && !recommendation ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: '#F59E0B' }]}>Trip Profiler</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Trip Budget (PKR)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Passengers</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                keyboardType="numeric"
                value={passengers}
                onChangeText={setPassengers}
                placeholder="Number of riders"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Trip Duration (Days)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Daily Estimated Distance (KM)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                keyboardType="numeric"
                value={dailyDistance}
                onChangeText={setDailyDistance}
              />
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleRecommend}>
              <Text style={styles.btnText}>Consult AI Advisor</Text>
              <Ionicons name="sparkles" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={[styles.loadingText, { color: colors.text }]}>RideEase AI is consulting...</Text>
            <Text style={[styles.loadingSub, { color: colors.textMuted }]}>Calculating specs, seating sizes, and daily fuel constraints...</Text>
          </View>
        ) : null}

        {recommendation ? (
          <View>
            <View style={[styles.card, styles.aiCard, { backgroundColor: colors.surface, borderColor: '#F59E0B' }]}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={12} color="#000" />
                <Text style={styles.aiBadgeText}>AI Recommendation</Text>
              </View>
              
              <Text style={[styles.recText, { color: colors.text }]}>
                {cleanMarkdown(recommendation.recommendation)}
              </Text>
            </View>

            {recommendation.vehicleId ? (
              <TouchableOpacity
                style={styles.btn}
                onPress={() => navigation.navigate('Rent', {
                  screen: 'VehicleDetail',
                  params: { vehicleId: recommendation.vehicleId }
                })}
              >
                <Text style={styles.btnText}>Book Recommended Match</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.btn, styles.btnOutline, { borderColor: colors.border }]}
              onPress={() => setRecommendation(null)}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>New Consultation</Text>
            </TouchableOpacity>
          </View>
        ) : null}

      </ScrollView>

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
  scrollContainer: {
    padding: 20,
    paddingBottom: 40
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16
  },
  formGroup: {
    marginBottom: 16
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
  btn: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    height: 52,
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
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0
  },
  btnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16
  },
  loadingSub: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30
  },
  aiCard: {
    borderWidth: 1.5
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 14
  },
  aiBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  recText: {
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: '600'
  }
});
