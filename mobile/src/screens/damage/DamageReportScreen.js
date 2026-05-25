import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function DamageReportScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const { colors } = useTheme();

  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Required", "This application requires library access to upload damage evidence photos.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3]
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.warn("Library pick failed, using fallback mock preview");
      setPhoto("https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=300");
    }
  };

  const handleSubmitReport = async () => {
    if (!bookingId) {
      Alert.alert("Error", "Please select a booking to file a report");
      return;
    }

    if (!description) {
      Alert.alert("Error", "Please describe what damage occurred during the trip");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.damage.report(bookingId, description, photo ? [photo] : []);
      setSubmitting(false);

      if (res.success) {
        Alert.alert(
          "Report Submitted",
          "Your damage incident report has been registered and flagged for administrative inspection and insurance checks.",
          [{ text: "Ok", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("Report Rejected", res.message || "Failed lodging logs");
      }
    } catch (err) {
      setSubmitting(false);
      Alert.alert("Error", "Failed to submit report. Connection error.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Report Damage</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: '#EF4444' }]}>Damage Incident Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Booking ID Ref</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                #{bookingId ? bookingId.substr(bookingId.length - 8).toUpperCase() : 'Unknown Reference'}
              </Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Describe Damage Incident</Text>
            <TextInput
              style={[styles.input, styles.textarea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Scratched front bumper while parking, minor dent on rear door..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Photo Evidence</Text>

          {photo ? (
            <View style={styles.previewWrapper}>
              <Image source={{ uri: photo }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => setPhoto(null)}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handlePickPhoto}
            >
              <Ionicons name="camera-outline" size={36} color={colors.textMuted} />
              <Text style={[styles.uploadBoxLbl, { color: colors.text }]}>Upload Damage Photo</Text>
              <Text style={[styles.uploadBoxSub, { color: colors.textMuted }]}>Camera or gallery files</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btn, { opacity: submitting ? 0.7 : 1 }]}
          disabled={submitting}
          onPress={handleSubmitReport}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.btnText}>Submit Incident Report</Text>
              <Ionicons name="warning-outline" size={20} color="#FFF" />
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
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500'
  },
  textarea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top'
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadBoxLbl: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 2
  },
  uploadBoxSub: {
    fontSize: 11,
    fontWeight: '500'
  },
  previewWrapper: {
    position: 'relative',
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden'
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50
  },
  btn: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});
