import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, toggleTheme, isDarkMode } = useTheme();
  
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, [activeCategory]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const typeFilter = activeCategory === 'all' ? '' : activeCategory;
      const res = await api.vehicles.list(typeFilter);
      if (res.success) {
        setVehicles(res.vehicles);
        setFilteredVehicles(res.vehicles);
      }
    } catch (err) {
      console.warn("Failed fetching vehicles fleet:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const query = text.toLowerCase();
    const filtered = vehicles.filter(v => 
      v.name.toLowerCase().includes(query) || 
      v.description.toLowerCase().includes(query) ||
      v.fuelType.toLowerCase().includes(query) ||
      v.transmission.toLowerCase().includes(query)
    );
    setFilteredVehicles(filtered);
  };

  const renderVehicleItem = ({ item }) => {
    const isCar = item.type === 'car';
    const seatsText = isCar ? `${item.seatingCapacity} Seater` : 'Solo/Dual';
    
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.isAvailable ? '#10B981' : '#EF4444' }
        ]}>
          <Text style={styles.statusText}>{item.isAvailable ? 'Available' : 'Booked'}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.badgeRow}>
            {(item.badges || []).slice(0, 2).map((badge, idx) => (
              <View key={idx} style={[styles.badgeTag, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.badgeTagText, { color: colors.textMuted }]}>{badge}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.vehicleName, { color: colors.text }]}>{item.name}</Text>
          
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <Ionicons name="cog-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.specText, { color: colors.textMuted }]}>{item.transmission}</Text>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="funnel-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.specText, { color: colors.textMuted }]}>{item.fuelType}</Text>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="people-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.specText, { color: colors.textMuted }]}>{seatsText}</Text>
            </View>
          </View>

          <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
            <View>
              <Text style={styles.priceLabel}>Price / Day</Text>
              <Text style={styles.priceValue}>PKR {item.pricePerDay.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.rentBtn}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item._id })}
            >
              <Text style={styles.rentBtnText}>Rent</Text>
              <Ionicons name="chevron-forward" size={14} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: colors.textMuted }]}>Assalam-o-Alaikum,</Text>
          <Text style={[styles.greetingText, { color: colors.text }]}>{user ? user.name : 'Guest User'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.themeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={toggleTheme}
        >
          <Ionicons name={isDarkMode ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search cars, bikes, transmission..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Categories chips filter */}
      <View style={styles.categoriesContainer}>
        <TouchableOpacity
          style={[styles.categoryChip, activeCategory === 'all' && styles.categoryChipActive, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setActiveCategory('all')}
        >
          <Ionicons name="grid-outline" size={16} color={activeCategory === 'all' ? '#000' : colors.textMuted} />
          <Text style={[styles.categoryChipText, { color: activeCategory === 'all' ? '#000' : colors.textMuted }]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.categoryChip, activeCategory === 'car' && styles.categoryChipActive, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setActiveCategory('car')}
        >
          <Ionicons name="car-outline" size={16} color={activeCategory === 'car' ? '#000' : colors.textMuted} />
          <Text style={[styles.categoryChipText, { color: activeCategory === 'car' ? '#000' : colors.textMuted }]}>Cars</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryChip, activeCategory === 'bike' && styles.categoryChipActive, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setActiveCategory('bike')}
        >
          <Ionicons name="motorcycle-outline" size={16} color={activeCategory === 'bike' ? '#000' : colors.textMuted} />
          <Text style={[styles.categoryChipText, { color: activeCategory === 'bike' ? '#000' : colors.textMuted }]}>Bikes</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          renderItem={renderVehicleItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={48} color={colors.textMuted} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching vehicles found in this category.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 10 : 0
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  welcomeText: {
    fontSize: 13,
    fontWeight: '500'
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800'
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 16
  },
  searchIcon: {
    marginRight: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500'
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 18,
    gap: 6
  },
  categoryChipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B'
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10
  },
  cardImage: {
    width: '100%',
    height: 170,
    resizeMode: 'cover'
  },
  statusBadge: {
    position: absolute = 'absolute',
    top: 16,
    right: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  cardBody: {
    padding: 16
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10
  },
  badgeTag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8
  },
  badgeTagText: {
    fontSize: 10,
    fontWeight: '700'
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10
  },
  specsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  specText: {
    fontSize: 12,
    fontWeight: '600'
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priceLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B'
  },
  rentBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  rentBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center'
  }
});
