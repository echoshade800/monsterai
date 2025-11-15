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
    name: 'Energy Agent',
    goal: 'My goal is to track your daily energy and help you maintain stable, healthy vitality.',
    mission: 'I watch your energy patterns and help you stay steady throughout the day.',
    tasks: [
      'Analyze facial energy signals.',
      'Detect drops in alertness.',
      'Give quick boosting suggestions.',
    ],
    whatIDo: {
      dailyCheckIn: 'I message you each morning to check your energy baseline.',
      instantInsight: 'If your energy dips, I notify you with quick tips.',
      microChallenges: 'Small missions to help boost alertness.',
    },
    insideMind: [
      '[9:12am] Energy dropped 8% after breakfast.',
      '[9:14am] Suggest: Light movement for 2 min.',
      '[11:05am] Morning alertness steady.',
      '[12:20pm] Noticed mild fatigue.',
      '[14:18pm] Energy spike after fresh air exposure.',
      '[16:02pm] Afternoon dip detected.',
    ],
    permissions: [
      'Camera Access — Facial Energy Scan',
      'Photos — Photo-based Energy Input',
      'Health API — Heart rate & activity influence',
      'Motion Sensor — Movement & fatigue detection',
    ],
    outcomes: {
      metric1: { label: 'More stable daily energy', value: '' },
      metric2: { label: 'Fewer afternoon crashes', value: '' },
      metric3: { label: 'Better morning alertness', value: '' },
    },
    motivation: 'Keep your energy steady and your day powerful.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/energy.png',
    backgroundColor: '#F5E6D3',
  },
  face: {
    name: 'Face Agent',
    goal: 'My goal is to help you track expressions and understand your emotional signals.',
    mission: 'I read your micro-expressions to help you understand your emotional patterns.',
    tasks: [
      'Analyze facial expression trends.',
      'Detect mood shifts early.',
      'Give gentle feedback when needed.',
    ],
    whatIDo: {
      dailyCheckIn: 'I ask for a quick face scan to learn your mood.',
      instantInsight: 'If your expression changes noticeably, I tell you why it matters.',
      microChallenges: 'Simple mood-boosting actions.',
    },
    insideMind: [
      '[8:44am] Smile activity decreased slightly.',
      '[9:10am] Eye fatigue detected.',
      '[11:22am] Neutral expression longer than usual.',
      '[13:40pm] Positive expression returned.',
      '[15:05pm] Stress micro-signals noticed.',
      '[17:18pm] Mood stabilized.',
    ],
    permissions: [
      'Camera — Facial Expression Scan',
      'Photos — Optional upload',
      'Health API — Emotion-related biometrics',
    ],
    outcomes: {
      metric1: { label: 'Better mood awareness', value: '' },
      metric2: { label: 'Early emotional-shift detection', value: '' },
      metric3: { label: 'More expressive balance', value: '' },
    },
    motivation: 'Notice your emotions, shape your day.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/face.png',
    backgroundColor: '#E8F5E9',
  },
  posture: {
    name: 'Posture Agent',
    goal: 'My goal is to keep your posture aligned and prevent daily strain.',
    mission: 'I detect posture patterns to help reduce tension and discomfort.',
    tasks: [
      'Identify slouching or forward head posture.',
      'Alert you when tension patterns rise.',
      'Guide you through quick posture resets.',
    ],
    whatIDo: {
      dailyCheckIn: 'I check your posture baseline daily.',
      instantInsight: 'I notify you when unhealthy posture is detected.',
      microChallenges: 'Mini movement missions to reset alignment.',
    },
    insideMind: [
      '[9:05am] Good morning alignment detected.',
      '[11:20am] Slight forward head posture.',
      '[12:30pm] Shoulder tension increasing.',
      '[14:05pm] Posture improved after stretch.',
      '[15:40pm] Noted slouching while seated.',
      '[17:10pm] Evening alignment stabilized.',
    ],
    permissions: [
      'Motion Sensor — Posture & movement tracking',
      'Camera — Posture scan',
      'Health API — Activity & tension patterns',
    ],
    outcomes: {
      metric1: { label: 'Less daily tension', value: '' },
      metric2: { label: 'Better spinal alignment', value: '' },
      metric3: { label: 'Healthier work habits', value: '' },
    },
    motivation: 'Stand tall, move freely.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/posture.png',
    backgroundColor: '#FFE4E1',
  },
  sleep: {
    name: 'Sleep Agent',
    goal: 'My goal is to help you sleep deeper, fall asleep easier, and recover better.',
    mission: 'I analyze your sleep rhythm and help you build healthy nighttime patterns.',
    tasks: [
      'Monitor sleep timing and quality.',
      'Alert you to irregular patterns.',
      'Guide better wind-down routines.',
    ],
    whatIDo: {
      dailyCheckIn: 'A morning summary of your sleep pattern.',
      instantInsight: 'I notify you when sleep debt builds.',
      microChallenges: 'Small night routine improvements.',
    },
    insideMind: [
      '[7:18am] Deep sleep duration shorter than usual.',
      '[10:12am] Morning grogginess detected.',
      '[14:40pm] Afternoon dip suggests sleep debt.',
      '[20:05pm] Consistent wind-down routine detected.',
      '[23:12pm] Late bedtime trend noticed.',
      '[23:40pm] Suggest: Reduce screen time.',
    ],
    permissions: [
      'Health API — Sleep data',
      'Motion Sensor — Night movement',
      'Calendar — Routine timing',
    ],
    outcomes: {
      metric1: { label: 'Better sleep quality', value: '' },
      metric2: { label: 'More consistent rhythm', value: '' },
      metric3: { label: 'Reduced sleep debt', value: '' },
    },
    motivation: 'Rest deeper, wake brighter.',
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
    name: 'Feces Agent',
    goal: 'My goal is to help you stay regular and support a smooth digestive rhythm.',
    mission: 'I track your bowel rhythm and help maintain healthy digestion.',
    tasks: [
      'Monitor timing & regularity.',
      'Detect irregular patterns early.',
      'Suggest easy digestive helpers.',
    ],
    whatIDo: {
      dailyCheckIn: 'I check in each morning about your gut status.',
      instantInsight: 'If irregularity appears, I send helpful suggestions.',
      microChallenges: 'Gentle habits to support digestion.',
    },
    insideMind: [
      '[7:18am] No bowel activity for 2 days.',
      '[7:22am] Suggest: Warm lemon water.',
      '[10:14am] Fiber intake lower than usual.',
      '[12:30pm] Hydration below baseline.',
      '[17:40pm] Digestive rhythm stabilizing.',
      '[21:05pm] Consistent pattern detected.',
    ],
    permissions: [
      'Digestive Log — Stool timing',
      'Health API — Sleep, hydration, HR',
      'Photos — Optional log',
    ],
    outcomes: {
      metric1: { label: 'More regular rhythm', value: '' },
      metric2: { label: 'Reduced discomfort', value: '' },
      metric3: { label: 'Better gut awareness', value: '' },
    },
    motivation: 'Stay light, stay regular.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/feces.png',
    backgroundColor: '#FFF8DC',
  },
  food: {
    name: 'Food Agent',
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
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/food.png',
    backgroundColor: '#FFF4E6',
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
  const isFoodAgent = agentId === 'food';

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

          {(isStressAgent || isEnergyAgent || isFaceAgent || isPostureAgent || isSleepAgent || isFecesAgent || isFoodAgent) ? (
            <ScrollingMindBanner logs={agent.insideMind} />
          ) : (
            <View style={styles.mindCard}>
              <Text style={styles.mindTitle}>Inside My Mind</Text>
              {agent.insideMind.map((log, index) => (
                <Text key={index} style={styles.mindLog}>{log}</Text>
              ))}
            </View>
          )}

          {(isStressAgent || isEnergyAgent || isFaceAgent || isPostureAgent || isSleepAgent || isFecesAgent || isFoodAgent) ? (
            <View style={styles.sectionCard}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
              <Text style={styles.sectionTitle}>What I need to connect with you</Text>
              {isStressAgent ? (
                <>
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
                </>
              ) : isEnergyAgent ? (
                <>
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Camera Access"
                    subtitle="Facial Energy Scan"
                  />
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Photos"
                    subtitle="Photo-based Energy Input"
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API"
                    subtitle="Heart rate & activity influence"
                  />
                  <PermissionToggle
                    icon={<Activity size={24} color="#000000" strokeWidth={2} />}
                    title="Motion Sensor"
                    subtitle="Movement & fatigue detection"
                  />
                </>
              ) : isFaceAgent ? (
                <>
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Camera"
                    subtitle="Facial Expression Scan"
                  />
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Photos"
                    subtitle="Optional upload"
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API"
                    subtitle="Emotion-related biometrics"
                  />
                </>
              ) : isPostureAgent ? (
                <>
                  <PermissionToggle
                    icon={<Activity size={24} color="#000000" strokeWidth={2} />}
                    title="Motion Sensor"
                    subtitle="Posture & movement tracking"
                  />
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Camera"
                    subtitle="Posture scan"
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API"
                    subtitle="Activity & tension patterns"
                  />
                </>
              ) : isSleepAgent ? (
                <>
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API"
                    subtitle="Sleep data"
                  />
                  <PermissionToggle
                    icon={<Activity size={24} color="#000000" strokeWidth={2} />}
                    title="Motion Sensor"
                    subtitle="Night movement"
                  />
                  <PermissionToggle
                    icon={<Activity size={24} color="#000000" strokeWidth={2} />}
                    title="Calendar"
                    subtitle="Routine timing"
                  />
                </>
              ) : isFecesAgent ? (
                <>
                  <PermissionToggle
                    icon={<Activity size={24} color="#000000" strokeWidth={2} />}
                    title="Digestive Log"
                    subtitle="Stool timing"
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API"
                    subtitle="Sleep, hydration, HR"
                  />
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Photos"
                    subtitle="Optional log"
                  />
                </>
              ) : (
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

          {(isStressAgent || isEnergyAgent || isFaceAgent || isPostureAgent || isSleepAgent || isFecesAgent || isFoodAgent) ? (
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
