import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function WalletScreen() {
  const { user, syncProfile } = useAuth();
  const { colors } = useTheme();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedChip, setSelectedChip] = useState(10000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await api.wallet.get();
      if (res.success) {
        setBalance(res.balance);
        setTransactions(res.transactions || []);
      }
    } catch (err) {
      console.warn("Error loading wallet details:", err);
    }
  };

  const selectChip = (amt) => {
    setSelectedChip(amt);
    setCustomAmount('');
  };

  const handleTopUp = async () => {
    let topUpAmount = selectedChip;
    if (customAmount) {
      topUpAmount = parseFloat(customAmount);
    }

    if (!topUpAmount || topUpAmount <= 0) {
      Alert.alert("Error", "Please specify a valid top-up amount");
      return;
    }

    setLoading(true);
    try {
      const res = await api.wallet.topUp(topUpAmount);
      setLoading(false);

      if (res.success) {
        Alert.alert("Top-up Successful", `Credited PKR ${topUpAmount.toLocaleString()} to your digital wallet.`);
        setCustomAmount('');
        setBalance(res.balance);
        setTransactions(res.transactions || []);
        await syncProfile(); // refresh auth balance globally
      } else {
        Alert.alert("Deposit Rejected", res.message || "Failed topping up");
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Wallet deposit service is currently offline");
    }
  };

  const renderTxnItem = ({ item }) => {
    const isCredit = item.type === 'Credit';
    const dateStr = new Date(item.createdAt).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={[styles.txnItem, { borderBottomColor: colors.border }]}>
        <View style={styles.txnLeft}>
          <View style={[
            styles.txnIcon,
            { backgroundColor: isCredit ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }
          ]}>
            <Ionicons
              name={isCredit ? "arrow-down-outline" : "arrow-up-outline"}
              size={16}
              color={isCredit ? "#10B981" : "#EF4444"}
            />
          </View>
          <View>
            <Text style={[styles.txnDesc, { color: colors.text }]}>{item.description}</Text>
            <Text style={[styles.txnDate, { color: colors.textMuted }]}>{dateStr}</Text>
          </View>
        </View>
        <Text style={[
          styles.txnAmt,
          { color: isCredit ? "#10B981" : "#EF4444" }
        ]}>
          {isCredit ? '+' : '-'} PKR {item.amount.toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Digital Wallet</Text>
        <Text style={[styles.headerSub, { color: colors.textMuted }]}>Manage balance and transaction ledgers</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* Visa Credit Card Wrapper */}
        <View style={styles.creditCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>Available Balance</Text>
              <Text style={styles.cardBalance}>PKR {balance.toLocaleString()}</Text>
            </View>
            <View style={styles.cardChip} />
          </View>
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.holderLabel}>Card Holder</Text>
              <Text style={styles.holderName}>{user ? user.name : 'User Session'}</Text>
            </View>
            <Text style={styles.cardLogo}>Ride<Text style={{ color: '#F59E0B' }}>Ease</Text></Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Deposit</Text>
        
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, selectedChip === 5000 && styles.chipActive, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => selectChip(5000)}
          >
            <Text style={[styles.chipText, { color: selectedChip === 5000 ? '#000' : colors.text }]}>+5k</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.chip, selectedChip === 10000 && styles.chipActive, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => selectChip(10000)}
          >
            <Text style={[styles.chipText, { color: selectedChip === 10000 ? '#000' : colors.text }]}>+10k</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, selectedChip === 25000 && styles.chipActive, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => selectChip(25000)}
          >
            <Text style={[styles.chipText, { color: selectedChip === 25000 ? '#000' : colors.text }]}>+25k</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="Or specify custom amount (PKR)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={customAmount}
            onChangeText={(t) => { setCustomAmount(t); setSelectedChip(0); }}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
          disabled={loading}
          onPress={handleTopUp}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Text style={styles.btnText}>Add Balance to Card</Text>
              <Ionicons name="add-circle-outline" size={20} color="#000" />
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 28 }]}>Transactions Ledger</Text>
        
        <FlatList
          data={transactions}
          renderItem={renderTxnItem}
          keyExtractor={item => item._id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyLedger}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>No transactions recorded yet.</Text>
            </View>
          }
        />

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
  creditCard: {
    background: 'linear-gradient(135deg, #0A1628 0%, #1E1B4B 100%)',
    backgroundColor: '#0E1E38', // Fallback color
    borderRadius: 24,
    padding: 24,
    height: 180,
    justifyContent: 'space-between',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardLabel: {
    color: '#94A3B8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  cardBalance: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4
  },
  cardChip: {
    width: 44,
    height: 32,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    opacity: 0.8
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  holderLabel: {
    color: '#94A3B8',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  holderName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2
  },
  cardLogo: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14
  },
  chipRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B'
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700'
  },
  formGroup: {
    marginBottom: 16
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
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
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  btnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  txnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  txnDesc: {
    fontSize: 13,
    fontWeight: '700'
  },
  txnDate: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2
  },
  txnAmt: {
    fontSize: 13,
    fontWeight: '700'
  },
  emptyLedger: {
    alignItems: 'center',
    paddingVertical: 30
  }
});
