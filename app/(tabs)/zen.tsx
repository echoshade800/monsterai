import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { 
  ArrowRight, 
  Check, 
  ClipboardList, 
  Clock, 
  Target
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { 
  Image,
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../src/services/api-clients/client';
import { getHeadersWithPassId } from '../../src/services/api/api';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BANNER_HEIGHT = SCREEN_HEIGHT * 0.3;

// Mock data structures
interface ProfileData {
  stressLevel: string | null;
  overwhelmMoments: string | null;
  relaxationPreference: string | null;
  mentalFatigue: string | null;
  unusedField: string | null;
}

interface ReminderData {
  id: string;
  label: string;
  value: string;
}

export default function ZenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Initial states set to empty/null as requested
  const [goal, setGoal] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    stressLevel: null,
    overwhelmMoments: null,
    relaxationPreference: null,
    mentalFatigue: null,
    unusedField: null,
  });
  const [reminders, setReminders] = useState<ReminderData[]>([]);

  // Fetch goal_title from API
  const fetchGoalTitle = useCallback(async () => {
    try {
      const baseHeaders = await getHeadersWithPassId();
      const passIdValue = (baseHeaders as any).passId || (baseHeaders as any).passid;
      
      // 使用放空相关的 category
      const category = 'mind_rest';
      const url = `/goal-data/category/newest?category=${category}`;
      
      const response = await api.get(url, {
        headers: {
          'accept': 'application/json',
          'passid': passIdValue,
        },
      });

      if (response.isSuccess() && response.data && response.data.goal_title) {
        setGoal(response.data.goal_title);
      }
    } catch (error) {
      console.error('Failed to fetch goal title:', error);
      // 如果获取失败，保持 goal 为 null，显示占位符
    }
  }, []);

  // Fetch goal title on component mount
  useEffect(() => {
    fetchGoalTitle();
  }, [fetchGoalTitle]);

  // 每次切换到 Zen tab 时重新获取目标信息
  useFocusEffect(
    useCallback(() => {
      fetchGoalTitle();
    }, [fetchGoalTitle])
  );

  // Function to render the value or placeholder
  const renderValue = (value: any, placeholder: string = '—') => {
    if (value === null || value === undefined || value === '') {
      return <Text style={styles.placeholderText}>{placeholder}</Text>;
    }
    return <Text style={styles.valueText}>{value}</Text>;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Banner Background */}
        <View style={styles.heroBannerContainer}>
          <Image 
            source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/livingroom.jpeg' }} 
            style={styles.bannerImage} resizeMode="cover"
            
          />
          <Image 
            source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/Zen.png' }} 
            style={[StyleSheet.absoluteFill, { top: 24, bottom: -104 }]}
            resizeMode="cover"
          />
        </View>

        {/* Character Info Card */}
        <View style={styles.characterCardContainer}>
          <View style={styles.cardShadowOuter}>
            <View style={styles.cardShadowInner}>
              <View style={styles.heroInfoCard}>
                <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.innerShadowHighlight} />
                <View style={styles.cardContentInner}>
                  <View style={styles.heroHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.monsterName}>Zen</Text>
                      <Text style={styles.tagline}>Helps you know when to pause and let your mind rest.</Text>
                    </View>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.sectionHeading}>What I do for you</Text>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: '#F38319' }]}>Input <Text style={styles.infoSubLabel}>--</Text> <Text style={styles.infoSubLabel}>What I look at</Text></Text>
                      <Text style={styles.infoDesc}>stress, overwhelm, mental fatigue, what relaxes</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: '#F38319' }]}>Output <Text style={styles.infoSubLabel}>--</Text> <Text style={styles.infoSubLabel}>What I suggest</Text></Text>
                      <Text style={styles.infoDesc}>take a break, reset type, breathe / rest / play, slow nudges</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: '#F38319' }]}>Memory <Text style={styles.infoSubLabel}>--</Text> <Text style={styles.infoSubLabel}>What I remember</Text></Text>
                      <Text style={styles.infoDesc}>best breaks, fast calmers, stress–fatigue links, ignored signals</Text>
                    </View>
                  </View>

                  <View style={styles.getSection}>
                    <Text style={styles.sectionHeading}>What you'll get if you hire me</Text>
                    <View style={styles.checkRow}>
                      <View style={styles.checkIcon}><Check size={12} color="#FFF" strokeWidth={3} /></View>
                      <Text style={styles.checkText}>Less mental overload</Text>
                    </View>
                    <View style={styles.checkRow}>
                      <View style={styles.checkIcon}><Check size={12} color="#FFF" strokeWidth={3} /></View>
                      <Text style={styles.checkText}>Fewer burnout cycles</Text>
                    </View>
                    <View style={styles.checkRow}>
                      <View style={styles.checkIcon}><Check size={12} color="#FFF" strokeWidth={3} /></View>
                      <Text style={styles.checkText}>Better emotional balance</Text>
                    </View>
                    <View style={styles.checkRow}>
                      <View style={styles.checkIcon}><Check size={12} color="#FFF" strokeWidth={3} /></View>
                      <Text style={styles.checkText}>More room to think clearly</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Current Goal Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Target size={20} color="#000" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Current Goal</Text>
          </View>
          
          <View style={styles.goalCardShadowOuter}>
            <View style={styles.goalCardShadowInner}>
              <LinearGradient
                colors={['#EFE7DB', '#FFE0D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.goalCard}
              >
                <View style={styles.cardInnerGlow} />
                <View style={styles.goalContentWrapper}>
                  <View style={styles.goalInnerContainer}>
                    <View style={styles.innerContainerInset} />
                    <Text style={[styles.goalText, !goal && styles.placeholderGoalText]}>
                      {goal || "Tell me what you want to feel less of, or more of."}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)/home')}>
                    <Text style={styles.ctaButtonText}>
                      {goal ? "Chat to edit" : "Set a mental goal"}
                    </Text>
                    <ArrowRight size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Activity Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ClipboardList size={20} color="#000" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Your mental reset profile</Text>
          </View>
          
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Stress level</Text>
              {renderValue(profile.stressLevel)}
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Overwhelm moments</Text>
              {renderValue(profile.overwhelmMoments)}
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Relaxation preference</Text>
              {renderValue(profile.relaxationPreference)}
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Mental fatigue</Text>
              {renderValue(profile.mentalFatigue)}
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Unused</Text>
              {renderValue(profile.unusedField)}
            </View>

            {Object.values(profile).some(v => v === null) && (
              <TouchableOpacity 
                style={[styles.ctaButton, { marginTop: 16 }]} 
                onPress={() => router.push('/(tabs)/home')}
              >
                <Text style={styles.ctaButtonText}>Add your mental info</Text>
                <ArrowRight size={18} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Reminders Section */}
        <View style={[styles.section, { marginBottom: 120 }]}>
          <View style={styles.sectionHeaderRow}>
            <Clock size={20} color="#000" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Reminders</Text>
          </View>
          
          {reminders.length > 0 ? (
            <View style={styles.remindersCard}>
              {reminders.map((reminder) => (
                <View key={reminder.id} style={styles.reminderRow}>
                  <Text style={styles.reminderLabel}>{reminder.label}</Text>
                  <Text style={styles.reminderValue}>{reminder.value}</Text>
                </View>
              ))}
              
              <TouchableOpacity style={[styles.ctaButton, { marginTop: 16 }]} onPress={() => {}}>
                <Text style={styles.ctaButtonText}>Modify in the calendar</Text>
                <ArrowRight size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyHintText}>No reminders set yet.</Text>
              <TouchableOpacity 
                style={[styles.ctaButton, { marginTop: 8 }]} 
                onPress={() => router.push('/(tabs)/daily-brief')}
              >
                <Text style={styles.ctaButtonText}>Go to Daily Brief</Text>
                <ArrowRight size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Spacer for bottom tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F1EF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroBannerContainer: {
    width: '100%',
    height: BANNER_HEIGHT,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  characterCardContainer: {
    alignItems: 'center',
    marginTop: -32, // Overlap the banner
    marginBottom: 16, // Reduced space between card and next section
    zIndex: 10,
  },
  heroInfoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 249, 246, 0.45)', // Increased opacity
    borderRadius: 32,
    overflow: 'hidden',
  },
  cardShadowOuter: {
    width: width - 24,
    borderRadius: 32,
    backgroundColor: 'transparent',
    shadowColor: '#4A3728', // Warm brown-ish diffused shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  cardShadowInner: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: 'transparent',
    shadowColor: '#2D1E14', // Closer, slightly stronger warm shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  innerShadowHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    pointerEvents: 'none',
  },
  cardContentInner: {
    padding: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    position: 'relative',
  },
  monsterName: {
    fontSize: 32,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#E67E22',
    lineHeight: 38, paddingRight: 64, // Space for absolute badge
    
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#8E8E93',
    marginTop: 4,
    
  },
  activeBadge: {
    backgroundColor: '#F38319',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    position: 'absolute',
    top: 4,
    right: 0,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
  },
  infoSection: {
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    marginBottom: 8,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
  },
  infoSubLabel: {
    fontFamily: 'Nunito_500Medium',
    color: '#666',
  },
  infoDesc: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#333',
    marginTop: 0,
  },
  getSection: {
    marginTop: 0,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F38319',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#333',
  },
  section: {
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
  },
  goalCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  goalCardShadowOuter: {
    borderRadius: 24,
    backgroundColor: 'transparent',
    shadowColor: '#4A3728', // Warm brown-ish diffused shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  goalCardShadowInner: {
    borderRadius: 24,
    backgroundColor: 'transparent',
    shadowColor: '#2D1E14', // Closer, slightly stronger warm shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    pointerEvents: 'none',
  },
  goalContentWrapper: {
    padding: 16,
    alignItems: 'center',
  },
  goalInnerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  innerContainerInset: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    pointerEvents: 'none',
  },
  goalText: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: '#333',
    lineHeight: 22,
  },
  placeholderGoalText: {
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyHintText: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: '#8E8E93',
    marginBottom: 8,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  profileLabel: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: '#8E8E93',
  },
  valueText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: '#000',
  },
  placeholderText: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: '#C7C7CC',
  },
  remindersCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  reminderLabel: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: '#8E8E93',
  },
  reminderValue: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
  },
  ctaButton: {
    backgroundColor: '#4A3728',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    width: '100%',
    gap: 8,
  },
  ctaButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
});
