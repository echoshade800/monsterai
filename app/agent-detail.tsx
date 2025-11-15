import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, StatusBar, Switch, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Target, TrendingUp, Camera, Heart, Activity, ImageIcon, Bell, Waves, Utensils } from 'lucide-react-native';
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
    name: 'Energy Agent',
    goal: 'My goal is to help you eat better, keep your weight steady, and maintain stable daily energy.',
    mission: 'I serve as your personal food analyst and nutrition strategist.',
    tasks: [
      'Identify food quality through photos: calories, protein, fats, sugar balance.',
      'Advise before you eat — ask me: eat it? skip it? how much?',
      'Build consistent meal rhythm for your day.',
      'Warn you when meals are too oily, sugary, or salty.',
      'Predict your 7-day weight trend based on food + activity.',
    ],
    whatIDo: {
      dailyCheckIn: 'I review your meals and give instant feedback on balance & nutrition.',
      instantInsight: 'I flag high-risk foods and help you avoid overeating.',
      microChallenges: 'Small missions to improve protein distribution, reduce sugar spikes, or balance daily calories.',
    },
    insideMind: [
      '[9:14am] Breakfast protein too low — add half a cup of milk.',
      '[12:20pm] Lunch carbs are high — afternoon sleepiness likely.',
      '[18:05pm] Daily calories near limit — keep dinner light.',
      '[20:14pm] Sugar intake +23% above usual — reduce for better sleep.',
      '[21:40pm] Predicted weight +0.3kg tomorrow based on today\'s meals.',
      '[22:10pm] Evening snack risk high — water recommended instead.',
    ],
    permissions: [
      'Camera Access — analyze your food',
      'Photos — scan meal history',
      'Health API Access — weight trend & activity',
      'Notifications — meal reminders & alerts',
    ],
    outcomes: {
      metric1: { label: 'Healthier Meals', value: '' },
      metric2: { label: 'Steadier Weight', value: '' },
      metric3: { label: 'Cleaner Nutrition Structure', value: '' },
      metric4: { label: 'Smarter Food Decisions', value: '' },
    },
    motivation: 'Want to eat healthy without rebound? Leave your plate to me.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/energy.png',
    backgroundColor: '#F5E6D3',
  },
  face: {
    name: 'Face Agent',
    goal: 'I help you improve your skin tone, glow, and facial vitality.',
    mission: 'I track your face and help you understand what affects your glow.',
    tasks: [
      'Detect dullness, redness, and uneven tone.',
      'Score your daily glow level.',
      'Suggest skincare steps and lifestyle improvements.',
      'Connect sleep, stress, and diet to skin changes.',
      'Alert you when fatigue signs appear on your face.',
    ],
    whatIDo: {
      dailyCheckIn: 'I evaluate your skin tone trends each day.',
      instantInsight: 'I notify you when your glow drops or redness increases.',
      microChallenges: 'Small tasks to help you hydrate, restore glow, or rebalance skin condition.',
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
      'Camera Access — for skin tracking',
      'Health API — for sleep & stress correlation',
      'Notifications — daily glow reminders',
    ],
    outcomes: {
      metric1: { label: 'Brighter Skin', value: '' },
      metric2: { label: 'More Even Tone', value: '' },
      metric3: { label: 'Improved Daily Glow', value: '' },
    },
    motivation: 'Glow better every day—your face deserves me.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/face.png',
    backgroundColor: '#E8F5E9',
  },
  posture: {
    name: 'Posture Agent',
    goal: 'I help you stand taller, look better, and move with confidence.',
    mission: 'I detect posture problems you can\'t see and correct them.',
    tasks: [
      'Detect forward head, hunching, and pelvic tilt.',
      'Alert you when you sit too long.',
      'Propose small daily exercises.',
      'Suggest outfits that match your body shape.',
      'Track long-term posture trend.',
    ],
    whatIDo: {
      dailyCheckIn: 'I scan your posture and remind you when alignment slips.',
      instantInsight: 'I notify you when tension rises or tilt increases.',
      microChallenges: 'Mini tasks to improve alignment and reduce discomfort.',
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
      'Camera Access — posture scan',
      'Motion Access — sitting & movement detection',
      'Notifications — alignment reminders',
    ],
    outcomes: {
      metric1: { label: 'Better Posture', value: '' },
      metric2: { label: 'Better Presence', value: '' },
      metric3: { label: 'Better Confidence', value: '' },
    },
    motivation: 'Look better instantly—body alignment changes everything.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/posture.png',
    backgroundColor: '#FFE4E1',
  },
  sleep: {
    name: 'Sleep Agent',
    goal: 'I help you sleep deeper and wake up more energized.',
    mission: 'I find the root causes behind your sleep quality.',
    tasks: [
      'Track deep sleep, REM, and interruptions.',
      'Predict fatigue from sleep debt.',
      'Build better nighttime routines.',
      'Detect evening tiredness patterns.',
      'Create long-term sleep trends.',
    ],
    whatIDo: {
      dailyCheckIn: 'I summarize your sleep and highlight what needs attention.',
      instantInsight: 'I notify you when your fatigue is rising or sleep debt builds up.',
      microChallenges: 'Small tasks to improve sleep habits and night routines.',
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
      'Health API Access — sleep records',
      'Motion Access — night movement tracking',
      'Notifications — bedtime reminders & morning insights',
    ],
    outcomes: {
      metric1: { label: 'Faster Sleep', value: '' },
      metric2: { label: 'Longer Deep Sleep', value: '' },
      metric3: { label: 'More Daytime Energy', value: '' },
    },
    motivation: 'Sleep like a Sunday morning—every night.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/sleep.png',
    backgroundColor: '#E3F2FD',
  },
  stress: {
    name: 'Stress Agent',
    goal: 'I help you stabilize emotions and control daily stress.',
    mission: 'I read your expressions and patterns to find what affects your mood.',
    tasks: [
      'Detect anxiety, frustration, and tiredness.',
      'Track emotional rhythm across the day.',
      'Link life events to mood changes.',
      'Offer calming actions and exercises.',
      'Notify you when stress spikes.',
    ],
    whatIDo: {
      dailyCheckIn: 'I review your emotional trend and highlight what needs care.',
      instantInsight: 'I alert you when facial tension or stress rises.',
      microChallenges: 'Short calming tasks to restore emotional stability.',
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
      'Camera Access — emotion tracking',
      'Health API Access — stress & heart rate',
      'Notifications — mood alerts & reminders',
    ],
    outcomes: {
      metric1: { label: 'More Stable Mood', value: '' },
      metric2: { label: 'Lower Stress', value: '' },
      metric3: { label: 'Better Emotional Clarity', value: '' },
    },
    motivation: 'Take control of your emotions—not the other way around.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/stress.png',
    backgroundColor: '#FFE0B2',
  },
  feces: {
    name: 'Feces Agent',
    goal: 'I help your gut stay smooth, regular, and healthy.',
    mission: 'I analyze bowel patterns to understand your digestive health.',
    tasks: [
      'Track bowel rhythm.',
      'Detect constipation and diarrhea patterns.',
      'Predict gut issues from lifestyle.',
      'Recommend diet fixes.',
      'Build long-term digestive reports.',
    ],
    whatIDo: {
      dailyCheckIn: 'I ask about your gut activity and highlight important changes.',
      instantInsight: 'I detect irregularity and suggest targeted fixes.',
      microChallenges: 'Small routines to improve digestion gently and consistently.',
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
      'Photos Access — stool tracking',
      'Health API Access — hydration & sleep correlation',
      'Food Logs Access — digestion pattern analysis',
      'Notifications — daily gut check & alerts',
    ],
    outcomes: {
      metric1: { label: 'More Regular', value: '' },
      metric2: { label: 'More Comfortable', value: '' },
      metric3: { label: 'Healthier Gut', value: '' },
    },
    motivation: 'Your gut may be shy, but I\'m not—I\'ll fix it quietly.',
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

          {isStressAgent || isEnergyAgent || isFaceAgent || isPostureAgent || isSleepAgent || isFecesAgent ? (
            <ScrollingMindBanner logs={agent.insideMind} />
          ) : (
            <View style={styles.mindCard}>
              <Text style={styles.mindTitle}>Inside My Mind</Text>
              {agent.insideMind.map((log, index) => (
                <Text key={index} style={styles.mindLog}>{log}</Text>
              ))}
            </View>
          )}

          {isStressAgent || isEnergyAgent || isFaceAgent || isPostureAgent || isSleepAgent || isFecesAgent ? (
            <View style={styles.sectionCard}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
              <Text style={styles.sectionTitle}>What I need to connect with you</Text>
              {isStressAgent ? (
                <>
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Camera Access"
                    subtitle="emotion tracking"
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API Access"
                    subtitle="stress & heart rate"
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="mood alerts & reminders"
                  />
                </>
              ) : isEnergyAgent ? (
                <>
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Camera Access"
                    subtitle="analyze your food"
                  />
                  <PermissionToggle
                    icon={<ImageIcon size={24} color="#000000" strokeWidth={2} />}
                    title="Photos"
                    subtitle="scan meal history"
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API Access"
                    subtitle="weight trend & activity"
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="meal reminders & alerts"
                  />
                </>
              ) : isFaceAgent ? (
                <>
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Camera Access"
                    subtitle="for skin tracking"
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API"
                    subtitle="for sleep & stress correlation"
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="daily glow reminders"
                  />
                </>
              ) : isPostureAgent ? (
                <>
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Camera Access"
                    subtitle="posture scan"
                  />
                  <PermissionToggle
                    icon={<Waves size={24} color="#000000" strokeWidth={2} />}
                    title="Motion Access"
                    subtitle="sitting & movement detection"
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="alignment reminders"
                  />
                </>
              ) : isSleepAgent ? (
                <>
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API Access"
                    subtitle="sleep records"
                  />
                  <PermissionToggle
                    icon={<Waves size={24} color="#000000" strokeWidth={2} />}
                    title="Motion Access"
                    subtitle="night movement tracking"
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="bedtime reminders & morning insights"
                  />
                </>
              ) : (
                <>
                  <PermissionToggle
                    icon={<ImageIcon size={24} color="#000000" strokeWidth={2} />}
                    title="Photos Access"
                    subtitle="stool tracking"
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API Access"
                    subtitle="hydration & sleep correlation"
                  />
                  <PermissionToggle
                    icon={<Utensils size={24} color="#000000" strokeWidth={2} />}
                    title="Food Logs Access"
                    subtitle="digestion pattern analysis"
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="daily gut check & alerts"
                  />
                </>
              )}
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

          {isStressAgent || isEnergyAgent || isFaceAgent || isPostureAgent || isSleepAgent || isFecesAgent ? (
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
