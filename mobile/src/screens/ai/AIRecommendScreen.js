import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  FlatList,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

export default function AIRecommendScreen({ navigation }) {
  const { colors } = useTheme();

  // AI chat states
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Salam! I am your RideEase AI Advisor. How can I help you today? You can ask me in English, Urdu, or Roman Urdu (e.g., "Mujhe family trip ke liye cheap car chahiye").'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [thinking, setThinking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // AI config states
  const [aiEngine, setAiEngine] = useState('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Load keys on mount
  useEffect(() => {
    const loadSavedKeys = async () => {
      try {
        const savedEngine = await SecureStore.getItemAsync('rideease_ai_engine');
        if (savedEngine) setAiEngine(savedEngine);

        const savedGemini = await SecureStore.getItemAsync('rideease_gemini_key');
        if (savedGemini) setGeminiKey(savedGemini);

        const savedOpenai = await SecureStore.getItemAsync('rideease_openai_key');
        if (savedOpenai) setOpenaiKey(savedOpenai);
      } catch (err) {
        console.warn("Failed loading cached secure keys:", err);
      }
    };
    loadSavedKeys();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userText
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setThinking(true);

    try {
      // Save key changes to SecureStore
      await SecureStore.setItemAsync('rideease_ai_engine', aiEngine);
      await SecureStore.setItemAsync('rideease_gemini_key', geminiKey);
      await SecureStore.setItemAsync('rideease_openai_key', openaiKey);
      
      const customApiKey = aiEngine === 'gemini' ? geminiKey : (aiEngine === 'openai' ? openaiKey : '');

      const payload = {
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        aiEngine,
        customApiKey: customApiKey.trim()
      };

      const res = await api.ai.chat(payload);
      setThinking(false);

      if (res.success) {
        const copilotMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.reply,
          matchedVehicleId: res.matchedVehicleId
        };
        setMessages(prev => [...prev, copilotMsg]);
      } else {
        const errorMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Error: ${res.message || 'Failed connecting to AI advisor'}`
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      setThinking(false);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Connection lost. Please ensure the backend server is active.'
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const cleanMarkdown = (text) => {
    if (!text) return '';
    return text.replace(/\*\*/g, '').replace(/\*/g, '');
  };

  const renderMessageItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.userRow : styles.aiRow]}>
        <View style={[
          styles.msgBubble,
          isUser 
            ? { backgroundColor: '#F59E0B', borderBottomRightRadius: 4 } 
            : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }
        ]}>
          <Text style={[styles.msgText, { color: isUser ? '#000' : colors.text }]}>
            {cleanMarkdown(item.content)}
          </Text>
        </View>
        {item.matchedVehicleId && (
          <InlineVehicleCard 
            vehicleId={item.matchedVehicleId} 
            navigation={navigation} 
            colors={colors} 
          />
        )}
      </View>
    );
  };

  const getEngineBadge = () => {
    if (aiEngine === 'gemini') return 'Gemini (Active)';
    if (aiEngine === 'openai') return 'OpenAI GPT (Active)';
    return 'Offline Matcher';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Dynamic Chat Header */}
      <View style={[styles.header, styles.chatHeader, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>AI Copilot</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.indicatorDot, { backgroundColor: aiEngine === 'local' ? '#64748B' : '#10B981' }]} />
            <Text style={[styles.headerSub, { color: colors.textMuted, marginTop: 0 }]}>{getEngineBadge()}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.settingsToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Ionicons name="settings-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Collapsible Key Config panel */}
      {showSettings && (
        <View style={[styles.settingsPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>Advisor System Config</Text>
          
          <View style={styles.engineToggleRow}>
            <TouchableOpacity
              style={[styles.engineBtn, aiEngine === 'gemini' && styles.engineBtnActive, { borderColor: colors.border }]}
              onPress={() => setAiEngine('gemini')}
            >
              <Text style={[styles.engineBtnText, { color: aiEngine === 'gemini' ? '#000' : colors.text }]}>Gemini</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.engineBtn, aiEngine === 'openai' && styles.engineBtnActive, { borderColor: colors.border }]}
              onPress={() => setAiEngine('openai')}
            >
              <Text style={[styles.engineBtnText, { color: aiEngine === 'openai' ? '#000' : colors.text }]}>OpenAI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.engineBtn, aiEngine === 'local' && styles.engineBtnActive, { borderColor: colors.border }]}
              onPress={() => setAiEngine('local')}
            >
              <Text style={[styles.engineBtnText, { color: aiEngine === 'local' ? '#000' : colors.text }]}>Offline</Text>
            </TouchableOpacity>
          </View>

          {aiEngine !== 'local' && (
            <View style={styles.keyInputWrapper}>
              <Text style={[styles.label, { color: colors.textMuted, fontSize: 8 }]}>
                {aiEngine === 'gemini' ? 'Google Gemini API Key' : 'OpenAI API Key'}
              </Text>
              <View style={styles.keyInputContainer}>
                <TextInput
                  style={[styles.keyInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                  placeholder={aiEngine === 'gemini' ? "Reads from .env if empty" : "sk-..."}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showKey}
                  value={aiEngine === 'gemini' ? geminiKey : openaiKey}
                  onChangeText={aiEngine === 'gemini' ? setGeminiKey : setOpenaiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey(!showKey)}>
                  <Ionicons name={showKey ? "eye-off-outline" : "eye-outline"} size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Messages Feed timeline */}
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatListContainer}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          thinking ? (
            <View style={styles.thinkingRow}>
              <View style={[styles.msgBubble, styles.thinkingBubble, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <ActivityIndicator size="small" color="#F59E0B" />
              </View>
            </View>
          ) : null
        }
      />

      {/* Input Message Bottom bar */}
      <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.chatInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          placeholder="Describe your trip details..."
          placeholderTextColor={colors.textMuted}
          value={inputMessage}
          onChangeText={setInputMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
          <Ionicons name="paper-plane" size={18} color="#000" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// Inline dynamic matched vehicle card component
function InlineVehicleCard({ vehicleId, navigation, colors }) {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await api.vehicles.get(vehicleId);
        if (res.success) {
          setVehicle(res.vehicle);
        }
      } catch (err) {
        console.warn("Failed fetching inline matched vehicle details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [vehicleId]);

  if (loading) {
    return (
      <View style={styles.inlineCardLoading}>
        <ActivityIndicator size="small" color="#F59E0B" />
      </View>
    );
  }
  
  if (!vehicle) return null;

  return (
    <View style={[styles.inlineCard, { backgroundColor: colors.surface, borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
      <Image source={{ uri: vehicle.image }} style={styles.inlineImage} />
      <View style={styles.inlineMeta}>
        <Text style={[styles.inlineName, { color: colors.text }]}>{vehicle.name}</Text>
        <Text style={styles.inlinePrice}>PKR {vehicle.pricePerDay.toLocaleString()} / day</Text>
        <TouchableOpacity
          style={styles.inlineRentBtn}
          onPress={() => navigation.navigate('Rent', {
            screen: 'VehicleDetail',
            params: { vehicleId: vehicle._id }
          })}
        >
          <Text style={styles.inlineRentText}>Rent Now</Text>
          <Ionicons name="chevron-forward" size={11} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
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
  },
  aiConfigBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderStyle: 'dashed'
  },
  aiConfigTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  engineToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  engineBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  engineBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B'
  },
  engineBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  keyInputWrapper: {
    marginTop: 4
  },
  keyInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center'
  },
  keyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '500',
    paddingRight: 40
  },
  eyeBtn: {
    position: 'absolute',
    right: 0,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  // Dynamic Chat Styles
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  settingsToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  settingsPanel: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 12
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8
  },
  chatListContainer: {
    paddingVertical: 12
  },
  msgRow: {
    marginVertical: 6,
    width: '100%',
    flexDirection: 'column',
    paddingHorizontal: 16
  },
  userRow: {
    alignItems: 'flex-end'
  },
  aiRow: {
    alignItems: 'flex-start'
  },
  msgBubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500'
  },
  thinkingRow: {
    marginVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'flex-start'
  },
  thinkingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8
  },
  chatInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inlineCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
    width: '85%',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  inlineImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#334155'
  },
  inlineMeta: {
    flex: 1,
    justifyContent: 'center'
  },
  inlineName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2
  },
  inlinePrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 8
  },
  inlineRentBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 4
  },
  inlineRentText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  inlineCardLoading: {
    marginTop: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%'
  }
});

