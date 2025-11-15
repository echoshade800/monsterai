import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, StatusBar, Switch, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Target, TrendingUp, Camera, Heart, Activity } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';

interface AgentData {
  name: string;
  goal: string;
  mission: string;
  tasks: string[];
  whatIDo: {
    dailyCheckIn: string;
    instantInsight: string;
    microChallenges: string;
  };
  insideMind: string[];
  permissions: string[];
  outcomes: {
    metric1: { label: string; value: string };
    metric2: { label: string; value: string };
    metric3: { label: string; value: string };
    metric4?: { label: string; value: string };
  };
  motivation: string;
  imageUrl: string;
  backgroundColor: string;
}

const AGENTS_DATA: Record<string, AgentData> = {
  energy: {
    name: 'Energy',
    goal: 'I optimize your energy flow, so you can stay vibrant all day long. I help balance your body\'s energy, ensuring peak performance.',
    mission: 'My mission is to ensure your energy stays steady, giving you power to tackle the day.',
    tasks: [
      'Optimize your energy cycles to prevent midday fatigue',
      'Align your body\'s rhythm with natural peaks and troughs',
      'Keep your energy steady.',
      'Help you avoid crashes.',
      'Balance your body and brain.',
    ],
    whatIDo: {
      dailyCheckIn: 'I\'ll check in each morning to gauge your mood and energy.',
      instantInsight: 'I catch low energy and guide your recovery.',
      microChallenges: 'Mini missions to help you adjust your energy rhythms or take breaks.',
    },
    insideMind: [
      '[11:42am] Your energy dropped 10% since morning.',
      '[11:45am] Suggest: Take a 5-min break and stretch to recover your energy levels.',
      '[12:30pm] Energy stabilized after snack break. Your energy will peak again after 2 hours.',
    ],
    permissions: [
      'Camera Access — Facial Expression & Skin Data',
      'Health API — Sleep & Heart Rate Monitoring',
      'Posture Sensor — Track Motion and Activity',
    ],
    outcomes: {
      metric1: { label: 'better energy rhythm', value: '+15%' },
      metric2: { label: 'daily stress fluctuation', value: '-25%' },
      metric3: { label: 'micro-actions per day', value: '5 personalized' },
    },
    motivation: 'Stronger rhythm, better you.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/energy.png',
    backgroundColor: '#F5E6D3',
  },
  face: {
    name: 'Face Agent',
    goal: 'My goal is to improve your facial expression and mood tracking, ensuring your emotional well-being is balanced throughout the day.',
    mission: 'I monitor your facial expressions and alert you when emotional shifts happen, helping you stay calm and focused.',
    tasks: [
      'Track your facial energy and mood shifts.',
      'Suggest calming actions when stress or negative emotions arise.',
      'Help you keep a positive outlook throughout the day.',
    ],
    whatIDo: {
      dailyCheckIn: 'I message you each morning to track your mood and facial expressions.',
      instantInsight: 'I notify you when I detect a negative shift in your expressions or energy.',
      microChallenges: 'I suggest small tasks to help you shift your mood and expressions.',
    },
    insideMind: [
      '[9:02am] User\'s smile intensity dropped by 8% compared to baseline.',
      '[9:04am] Suggest: Take a quick break to improve mood and posture.',
    ],
    permissions: [
      'Camera Access — Facial Expression & Skin Data',
      'Health API — Sleep & Heart Rate Monitoring',
      'Posture Sensor — Body Motion Data',
    ],
    outcomes: {
      metric1: { label: 'better mood rhythm', value: '+10%' },
      metric2: { label: 'emotional stability', value: '-20%' },
      metric3: { label: 'micro actions', value: '4 per day' },
    },
    motivation: 'A happy face leads to a happy day!',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/face.png',
    backgroundColor: '#E8F5E9',
  },
  posture: {
    name: 'Posture Agent',
    goal: 'My goal is to help you maintain proper posture, so you can feel strong and comfortable throughout the day.',
    mission: 'I monitor your posture and provide gentle reminders, keeping you aligned and at your best.',
    tasks: [
      'Track your posture throughout the day.',
      'Send reminders when you\'re slouching.',
      'Help you improve with easy exercises.',
    ],
    whatIDo: {
      dailyCheckIn: 'I check your posture and remind you if adjustments are needed.',
      instantInsight: 'I notify you when your posture drops below optimal.',
      microChallenges: 'Small tasks to improve your posture throughout the day.',
    },
    insideMind: [
      '[9:02am] User\'s posture dropped by 10% since morning.',
      '[9:04am] Suggest: Adjust your chair and straighten your back.',
    ],
    permissions: [
      'Posture Sensor — Body Motion Data',
      'Camera Access — Face + Body Tracking (optional)',
    ],
    outcomes: {
      metric1: { label: 'better posture', value: '+10%' },
      metric2: { label: 'back pain reduction', value: '-20%' },
      metric3: { label: 'micro actions', value: '5 exercises per day' },
    },
    motivation: 'Straighten up, power on.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/posture.png',
    backgroundColor: '#FFE4E1',
  },
  sleep: {
    name: 'Sleep',
    goal: 'My goal is to keep your daily stress below 35%, so your sleep improves naturally.',
    mission: 'I help you balance work and rest so you can wake up refreshed and energized.',
    tasks: [
      'Restore balance between work and rest',
      'Help you start days with energy, not fatigue',
    ],
    whatIDo: {
      dailyCheckIn: 'I message you each morning with your mood trend.',
      instantInsight: 'When your posture drops, I notify you.',
      microChallenges: 'Join mini missions to optimize your rest cycles.',
    },
    insideMind: [
      '[11:42am] User\'s facial energy dropped 12% compared to baseline.',
      '[11:44am] Suggest: Stretch & breathe.',
    ],
    permissions: [
      'Camera Access — Facial Expression & Skin Data',
      'Health API — Sleep & Heart Rate',
      'Posture Sensor — Phone Motion Data',
    ],
    outcomes: {
      metric1: { label: 'better sleep rhythm', value: '+15%' },
      metric2: { label: 'daily stress fluctuation', value: '-25%' },
      metric3: { label: 'micro-actions per day', value: '5 personalized' },
    },
    motivation: 'Rest easy, rise energized.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/sleep.png',
    backgroundColor: '#E3F2FD',
  },
  stress: {
    name: 'Stress',
    goal: 'I help you stay calm, balanced, and emotionally steady.',
    mission: 'I help you notice emotional tension early and guide you to relax.',
    tasks: [
      'Track mood & micro-expressions',
      'Detect rising tension',
      'Give quick calming suggestions',
    ],
    whatIDo: {
      dailyCheckIn: 'I check your emotional baseline each morning.',
      instantInsight: 'I notify you when your stress starts rising.',
      microChallenges: 'Small mood-reset tasks to help you stay grounded.',
    },
    insideMind: [
      '[9:12am] Tension +8% from baseline.',
      '[10:04am] Your smile activity dropped noticeably.',
      '[11:18am] Eye fatigue increased — may signal rising stress.',
      '[1:52pm] Heart rate slightly elevated above your usual.',
      '[2:30pm] Facial stress markers increased by 12%.',
      '[3:05pm] Detected jaw-clenching pattern.',
      '[4:10pm] Mood stability dipped compared to morning.',
      '[5:22pm] Suggest: 1-minute breathing reset.',
    ],
    permissions: [
      'Camera Access — Facial expression signals',
      'Health API Access — Stress & heart-rate data',
      'Motion / Posture Sensor — Body tension patterns',
    ],
    outcomes: {
      metric1: { label: 'Calmer Mood', value: '' },
      metric2: { label: 'Lower Stress Peaks', value: '' },
      metric3: { label: 'More Stability', value: '' },
      metric4: { label: 'Better Daily Rhythm', value: '' },
    },
    motivation: 'Stay calm, stay grounded.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/stress.png',
    backgroundColor: '#FFE0B2',
  },
  feces: {
    name: 'Feces',
    goal: 'My goal is to keep your gut rhythm steady, so your digestion stays smooth and predictable.',
    mission: 'Support a consistent bowel rhythm. Help you stay light, regular, and comfortable every day.',
    tasks: [],
    whatIDo: {
      dailyCheckIn: 'I message you each morning to check your gut status.',
      instantInsight: 'When irregularity shows up, I suggest what helps.',
      microChallenges: 'Mini missions to improve digestion gently.',
    },
    insideMind: [
      '[7:18am] No bowel activity detected for 2 days.',
      '[7:20am] Suggest: Warm lemon water + fiber snack.',
    ],
    permissions: [
      'Digestive Log — Stool timing & regularity',
      'Health API — Sleep, hydration, heart rate',
      'Nutrition Agent — Fiber + meal rhythm',
    ],
    outcomes: {
      metric1: { label: 'digestion smoothness', value: 'improved' },
      metric2: { label: 'regularity', value: 'consistent' },
      metric3: { label: 'comfort level', value: 'high' },
    },
    motivation: 'My digestion feels smoother in just a few days!',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/feces.png',
    backgroundColor: '#F5E6D3',
  },
};

const ScrollingMindBanner = ({ logs }: { logs: string[] }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentHeight > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scrollY, {
            toValue: -contentHeight / 2,
            duration: logs.length * 3000,
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [contentHeight]);

  return (
    <View style={styles.mindBannerCard}>
      <Text style={styles.mindBannerTitle}>Inside My Mind</Text>
      <View style={styles.mindBannerContent}>
        <Animated.View
          style={[
            styles.mindBannerScrollContainer,
            { transform: [{ translateY: scrollY }] },
          ]}
          onLayout={(e) => {
            const height = e.nativeEvent.layout.height;
            if (contentHeight === 0) {
              setContentHeight(height);
            }
          }}
        >
          {[...logs, ...logs].map((log, index) => {
            const timeMatch = log.match(/\[(.*?)\]/);
            const time = timeMatch ? timeMatch[1] : '';
            const content = log.replace(/\[(.*?)\]\s*/, '');

            return (
              <View key={index} style={styles.mindBannerLogRow}>
                {time && <Text style={styles.mindBannerTime}>[{time}]</Text>}
                <Text style={styles.mindBannerLogText}>{content}</Text>
              </View>
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
};

const PermissionToggle = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => {
  const [isEnabled, setIsEnabled] = useState(true);

  return (
    <View style={styles.permissionRow}>
      <View style={styles.permissionIcon}>{icon}</View>
      <View style={styles.permissionInfo}>
        <Text style={styles.permissionTitle}>{title}</Text>
        <Text style={styles.permissionSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        trackColor={{ false: '#D1D1D6', true: '#34C759' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D1D1D6"
        onValueChange={setIsEnabled}
        value={isEnabled}
      />
    </View>
  );
};

export default function AgentDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const agentId = params.id as string;
  const [isHired, setIsHired] = useState(true);

  const agent = AGENTS_DATA[agentId];

  if (!agent) {
    return (
      <View style={styles.container}>
        <Text>Agent not found</Text>
      </View>
    );
  }

  const handleHire = () => {
    setIsHired(true);
  };

  const isStressAgent = agentId === 'stress';

  return (
    <View style={[styles.container, { backgroundColor: agent.backgroundColor }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <ArrowLeft size={24} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: agent.imageUrl }}
            style={styles.agentImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.agentName}>{agent.name}</Text>

          <Text style={styles.goalText}>{agent.goal}</Text>

          <TouchableOpacity
            style={[styles.hireButton, isHired && styles.hiredButton]}
            onPress={handleHire}
            disabled={isHired}
            activeOpacity={0.8}
          >
            <Text style={styles.hireButtonText}>
              {isHired ? '✓ Hired' : 'Hire me'}
            </Text>
            {!isHired && <Text style={styles.freeTrialText}>Free Trial</Text>}
          </TouchableOpacity>

          {agent.tasks.length > 0 && (
            <View style={styles.missionCard}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
              {agent.tasks.map((task, index) => (
                <View key={index} style={styles.taskRow}>
                  <Target size={20} color="#000000" strokeWidth={2} />
                  <Text style={styles.taskText}>{task}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.sectionCard}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.sectionTitle}>Here's what I do — automatically.</Text>

            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>Daily Check-in</Text>
              <Text style={styles.featureDescription}>{agent.whatIDo.dailyCheckIn}</Text>
            </View>

            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>Instant Insight</Text>
              <Text style={styles.featureDescription}>{agent.whatIDo.instantInsight}</Text>
            </View>

            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>Micro Challenges</Text>
              <Text style={styles.featureDescription}>{agent.whatIDo.microChallenges}</Text>
            </View>
          </View>

          {isStressAgent ? (
            <ScrollingMindBanner logs={agent.insideMind} />
          ) : (
            <View style={styles.mindCard}>
              <Text style={styles.mindTitle}>Inside My Mind</Text>
              {agent.insideMind.map((log, index) => (
                <Text key={index} style={styles.mindLog}>{log}</Text>
              ))}
            </View>
          )}

          {isStressAgent ? (
            <View style={styles.sectionCard}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
              <Text style={styles.sectionTitle}>What I need to connect with you</Text>
              <PermissionToggle
                icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                title="Camera Access"
                subtitle="Facial expression signals"
              />
              <PermissionToggle
                icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                title="Health API Access"
                subtitle="Stress & heart-rate data"
              />
              <PermissionToggle
                icon={<Activity size={24} color="#000000" strokeWidth={2} />}
                title="Motion / Posture Sensor"
                subtitle="Body tension patterns"
              />
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
              <Text style={styles.sectionTitle}>What I need to connect with you</Text>
              {agent.permissions.map((permission, index) => (
                <Text key={index} style={styles.permissionText}>{permission}</Text>
              ))}
            </View>
          )}

          {isStressAgent ? (
            <View style={styles.sectionCard}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.outcomesHeader}>
                <TrendingUp size={24} color="#000000" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Outcomes You Get</Text>
              </View>
              <View style={styles.outcomeKeywordsGrid}>
                <View style={styles.outcomeKeywordCard}>
                  <Text style={styles.outcomeKeyword}>{agent.outcomes.metric1.label}</Text>
                </View>
                <View style={styles.outcomeKeywordCard}>
                  <Text style={styles.outcomeKeyword}>{agent.outcomes.metric2.label}</Text>
                </View>
                <View style={styles.outcomeKeywordCard}>
                  <Text style={styles.outcomeKeyword}>{agent.outcomes.metric3.label}</Text>
                </View>
                {agent.outcomes.metric4 && (
                  <View style={styles.outcomeKeywordCard}>
                    <Text style={styles.outcomeKeyword}>{agent.outcomes.metric4.label}</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.outcomesHeader}>
                <TrendingUp size={24} color="#000000" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Outcomes You Get</Text>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{agent.outcomes.metric1.label}</Text>
                  <View style={styles.metricGraphPlaceholder} />
                  <Text style={styles.metricValue}>{agent.outcomes.metric1.value}</Text>
                </View>

                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{agent.outcomes.metric2.label}</Text>
                  <View style={styles.metricGraphPlaceholder} />
                  <Text style={styles.metricValue}>{agent.outcomes.metric2.value}</Text>
                </View>

                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{agent.outcomes.metric3.label}</Text>
                  <View style={styles.metricGraphPlaceholder} />
                  <Text style={styles.metricValue}>{agent.outcomes.metric3.value}</Text>
                </View>
              </View>
            </View>
          )}

          <Text style={styles.motivationText}>{agent.motivation}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 10,
    left: 20,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : (StatusBar.currentHeight || 0) + 50,
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -20,
  },
  agentImage: {
    width: 280,
    height: 280,
  },
  mainContent: {
    paddingHorizontal: 20,
  },
  agentName: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  hireButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  hiredButton: {
    backgroundColor: '#4CAF50',
  },
  hireButtonText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#FFFFFF',
  },
  freeTrialText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SF Compact Rounded',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  missionCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  taskText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    flex: 1,
    lineHeight: 22,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    marginBottom: 16,
  },
  featureBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'SF Compact Rounded',
    color: '#333333',
    lineHeight: 20,
  },
  mindCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  mindTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  mindLog: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'Menlo',
    color: '#00FF00',
    lineHeight: 20,
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    lineHeight: 22,
    marginBottom: 8,
  },
  outcomesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'SF Compact Rounded',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  metricGraphPlaceholder: {
    width: '100%',
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
  },
  motivationText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  mindBannerCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    height: 200,
    overflow: 'hidden',
  },
  mindBannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 24,
  },
  mindBannerContent: {
    height: 140,
    overflow: 'hidden',
  },
  mindBannerScrollContainer: {
    paddingBottom: 140,
  },
  mindBannerLogRow: {
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mindBannerTime: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Menlo',
    color: '#FF6B9D',
    marginRight: 6,
    lineHeight: 22,
  },
  mindBannerLogText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Menlo',
    color: '#E8E8E8',
    flex: 1,
    lineHeight: 22,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    marginBottom: 2,
  },
  permissionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'SF Compact Rounded',
    color: '#666666',
  },
  outcomeKeywordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  outcomeKeywordCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minWidth: '45%',
    alignItems: 'center',
  },
  outcomeKeyword: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    textAlign: 'center',
  },
});
