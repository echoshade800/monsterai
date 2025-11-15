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
    name: 'Food Agent',
    goal: 'I help you eat better, stay balanced, and maintain a healthy weight.',
    mission: 'I am your personal food analyst and nutrition coach.',
    tasks: [
      'Analyze calories, protein, fat, sugar from your food photos',
      'Tell you if you should eat / skip / reduce a portion',
      'Build daily meal rhythm for stable energy',
      'Alert you when food is too oily / salty / sugary',
      'Predict your weight trend for the next 7 days',
    ],
    whatIDo: {
      dailyCheckIn: 'Analyze calories, protein, fat, sugar from your food photos',
      instantInsight: 'Tell you if you should eat / skip / reduce a portion',
      microChallenges: 'Build daily meal rhythm for stable energy',
    },
    insideMind: [
      '[9:14am] Breakfast protein low. Add milk.',
      '[12:20pm] Lunch carb load high. Afternoon crash likely.',
      '[18:05pm] Daily calories near limit.',
      '[20:14pm] Sugar intake 23% above normal.',
      '[21:40pm] Weight may rise 0.3kg tomorrow.',
      '[22:10pm] High snack risk detected.',
    ],
    permissions: [
      'Camera — for food recognition',
      'Photos — to log meals',
      'Health API — weight & activity data',
    ],
    outcomes: {
      metric1: { label: 'Healthier eating', value: '' },
      metric2: { label: 'Steady weight', value: '' },
      metric3: { label: 'Better nutrition', value: '' },
    },
    motivation: 'Eat smarter with me - I will balance your meals effortlessly.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/energy.png',
    backgroundColor: '#F5E6D3',
  },
  face: {
    name: 'Face Agent',
    goal: 'I help you improve your skin tone, glow, and facial vitality.',
    mission: 'I track your face and help you understand what affects your glow.',
    tasks: [
      'Detect dullness, redness, uneven tone',
      'Score your daily "glow level"',
      'Suggest skincare steps and lifestyle improvements',
      'Connect sleep, stress, and diet to skin changes',
      'Alert you on fatigue signs',
    ],
    whatIDo: {
      dailyCheckIn: 'Detect dullness, redness, uneven tone',
      instantInsight: 'Score your daily "glow level"',
      microChallenges: 'Suggest skincare steps and lifestyle improvements',
    },
    insideMind: [
      '[8:44am] Skin brightness down 5%.',
      '[11:10am] Eye fatigue rising.',
      '[14:05pm] Tone uneven compared to baseline.',
      '[16:50pm] Hydration improved after drinking water.',
      '[18:22pm] Redness linked to stress.',
      '[21:02pm] Skin dryness increasing.',
    ],
    permissions: [
      'Camera — for skin tracking',
      'Health API — sleep & stress correlation',
    ],
    outcomes: {
      metric1: { label: 'Brighter skin', value: '' },
      metric2: { label: 'More even tone', value: '' },
      metric3: { label: 'Better daily glow', value: '' },
    },
    motivation: 'Glow better every day - your face deserves me.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/face.png',
    backgroundColor: '#E8F5E9',
  },
  posture: {
    name: 'Posture Agent',
    goal: 'I help you stand taller, look better, and move with confidence.',
    mission: 'I detect posture problems you can't see and correct them.',
    tasks: [
      'Detect forward head, hunching, pelvic tilt',
      'Alert you when you sit too long',
      'Propose small daily exercises',
      'Suggest outfits that fit your body shape',
      'Track long-term posture trend',
    ],
    whatIDo: {
      dailyCheckIn: 'Detect forward head, hunching, pelvic tilt',
      instantInsight: 'Alert you when you sit too long',
      microChallenges: 'Propose small daily exercises',
    },
    insideMind: [
      '[9:05am] Morning alignment stable.',
      '[11:22am] Head tilt increased 3°.',
      '[13:40pm] Shoulder tension rising.',
      '[15:05pm] Spine curvature up.',
      '[17:18pm] Sitting too long detected.',
      '[19:40pm] Posture improved after break.',
    ],
    permissions: [
      'Camera — posture scan',
      'Motion — sitting & movement detection',
    ],
    outcomes: {
      metric1: { label: 'Better posture', value: '' },
      metric2: { label: 'Better presence', value: '' },
      metric3: { label: 'Better confidence', value: '' },
    },
    motivation: 'Look better instantly - body alignment changes everything.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/posture.png',
    backgroundColor: '#FFE4E1',
  },
  sleep: {
    name: 'Sleep Agent',
    goal: 'I help you sleep deeper and wake up more energized.',
    mission: 'I find the root causes behind your sleep quality.',
    tasks: [
      'Track deep sleep, REM, interruptions',
      'Predict fatigue from sleep debt',
      'Build better night routines',
      'Detect evening tiredness patterns',
      'Create long-term sleep trends',
    ],
    whatIDo: {
      dailyCheckIn: 'Track deep sleep, REM, interruptions',
      instantInsight: 'Predict fatigue from sleep debt',
      microChallenges: 'Build better night routines',
    },
    insideMind: [
      '[7:18am] Deep sleep 20% below normal.',
      '[10:12am] Morning drowsiness high.',
      '[14:40pm] Afternoon fatigue linked to sleep debt.',
      '[20:05pm] Evening routine unstable.',
      '[23:12pm] Bedtime later than usual.',
      '[23:40pm] High screen use before bed.',
    ],
    permissions: [
      'Health API — sleep records',
      'Motion — night movement',
    ],
    outcomes: {
      metric1: { label: 'Faster sleep', value: '' },
      metric2: { label: 'Longer deep sleep', value: '' },
      metric3: { label: 'More daytime energy', value: '' },
    },
    motivation: 'Sleep like a Sunday morning - every night.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/sleep.png',
    backgroundColor: '#E3F2FD',
  },
  stress: {
    name: 'Stress Agent',
    goal: 'I help you stabilize emotions and control daily stress.',
    mission: 'I read your expressions and patterns to find what affects your mood.',
    tasks: [
      'Detect anxiety, frustration, tiredness',
      'Track emotional rhythm',
      'Link life events to mood changes',
      'Offer calming actions & exercises',
      'Notify you when stress spikes',
    ],
    whatIDo: {
      dailyCheckIn: 'Detect anxiety, frustration, tiredness',
      instantInsight: 'Track emotional rhythm',
      microChallenges: 'Offer calming actions & exercises',
    },
    insideMind: [
      '[9:14am] Mood stable.',
      '[12:50pm] Midday stress increasing.',
      '[15:05pm] Facial tension rising.',
      '[17:18pm] Fatigue linked to workload.',
      '[19:22pm] Evening calm improving.',
      '[22:10pm] Stress 8% lower than yesterday.',
    ],
    permissions: [
      'Camera — emotion tracking',
      'Health API — stress & heart rate',
    ],
    outcomes: {
      metric1: { label: 'More stable mood', value: '' },
      metric2: { label: 'Lower stress', value: '' },
      metric3: { label: 'Better emotional clarity', value: '' },
    },
    motivation: 'Take control of your emotions - not the other way around.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/stress.png',
    backgroundColor: '#FFE0B2',
  },
  feces: {
    name: 'Feces Agent',
    goal: 'I help your gut stay smooth, regular, and healthy.',
    mission: 'I analyze bowel patterns to understand your digestive health.',
    tasks: [
      'Track bowel rhythm',
      'Detect constipation / diarrhea patterns',
      'Predict gut issues from lifestyle',
      'Recommend diet fixes',
      'Build long-term digestive reports',
    ],
    whatIDo: {
      dailyCheckIn: 'Track bowel rhythm',
      instantInsight: 'Detect constipation / diarrhea patterns',
      microChallenges: 'Recommend diet fixes',
    },
    insideMind: [
      '[7:18am] No bowel movement for 2 days.',
      '[7:22am] Fiber intake too low.',
      '[10:14am] Water intake insufficient.',
      '[12:30pm] Digestion slower today.',
      '[17:40pm] Gut activity improving.',
      '[21:05pm] Pattern stable.',
    ],
    permissions: [
      'Photos — stool tracking',
      'Health API — hydration & sleep',
      'Food logs — digestion correlation',
    ],
    outcomes: {
      metric1: { label: 'More regular', value: '' },
      metric2: { label: 'More comfortable', value: '' },
      metric3: { label: 'Healthier gut', value: '' },
    },
    motivation: 'Your gut may be shy, but I am not - I will fix it quietly.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/feces.png',
    backgroundColor: '#FFF8DC',
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
  const isEnergyAgent = agentId === 'energy';
  const isFaceAgent = agentId === 'face';
  const isPostureAgent = agentId === 'posture';
  const isSleepAgent = agentId === 'sleep';
  const isFecesAgent = agentId === 'feces';

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
              <Text style={styles.missionTitle}>Mission & Goal</Text>
              <Text style={styles.missionDescription}>{agent.mission}</Text>
            </View>
          )}

          <View style={styles.sectionCard}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.sectionTitle}>What I Do</Text>
            {agent.tasks.map((task, index) => (
              <View key={index} style={styles.taskRow}>
                <Text style={styles.taskBullet}>•</Text>
                <Text style={styles.taskText}>{task}</Text>
              </View>
            ))}
          </View>

          <ScrollingMindBanner logs={agent.insideMind} />

          <View style={styles.sectionCard}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.sectionTitle}>What I Need To Connect With You</Text>
            {isEnergyAgent ? (
              <>
                <PermissionToggle
                  icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                  title="Camera"
                  subtitle="for food recognition"
                />
                <PermissionToggle
                  icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                  title="Photos"
                  subtitle="to log meals"
                />
                <PermissionToggle
                  icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                  title="Health API"
                  subtitle="weight & activity data"
                />
              </>
            ) : isFaceAgent ? (
              <>
                <PermissionToggle
                  icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                  title="Camera"
                  subtitle="for skin tracking"
                />
                <PermissionToggle
                  icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                  title="Health API"
                  subtitle="sleep & stress correlation"
                />
              </>
            ) : isPostureAgent ? (
              <>
                <PermissionToggle
                  icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                  title="Camera"
                  subtitle="posture scan"
                />
                <PermissionToggle
                  icon={<Activity size={24} color="#000000" strokeWidth={2} />}
                  title="Motion"
                  subtitle="sitting & movement detection"
                />
              </>
            ) : isSleepAgent ? (
              <>
                <PermissionToggle
                  icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                  title="Health API"
                  subtitle="sleep records"
                />
                <PermissionToggle
                  icon={<Activity size={24} color="#000000" strokeWidth={2} />}
                  title="Motion"
                  subtitle="night movement"
                />
              </>
            ) : isStressAgent ? (
              <>
                <PermissionToggle
                  icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                  title="Camera"
                  subtitle="emotion tracking"
                />
                <PermissionToggle
                  icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                  title="Health API"
                  subtitle="stress & heart rate"
                />
              </>
            ) : (
              <>
                <PermissionToggle
                  icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                  title="Photos"
                  subtitle="stool tracking"
                />
                <PermissionToggle
                  icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                  title="Health API"
                  subtitle="hydration & sleep"
                />
                <PermissionToggle
                  icon={<Activity size={24} color="#000000" strokeWidth={2} />}
                  title="Food logs"
                  subtitle="digestion correlation"
                />
              </>
            )}
          </View>

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
            </View>
          </View>

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
  missionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    marginBottom: 8,
  },
  missionDescription: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    lineHeight: 22,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskBullet: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    marginRight: 8,
    marginTop: 2,
  },
  taskText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    flex: 1,
    lineHeight: 20,
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
  outcomesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
