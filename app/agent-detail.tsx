import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bell, Camera, Heart, ImageIcon, Target, TrendingUp, Utensils, Waves } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Linking, Platform, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import calendarManager from '../src/utils/calendar-manager';
import healthDataManager, { HealthDataType } from '../src/utils/health-data-manager';
import locationManager from '../src/utils/location-manager';

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
    name: 'Facey',
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
    name: 'Posture',
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
    name: 'Sleeper',
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
    name: 'Moodie',
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
    name: 'Poopy',
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

const PermissionToggle = ({ 
  icon, 
  title, 
  subtitle, 
  permissionId,
  enabled,
  onToggle 
}: { 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string;
  permissionId: string;
  enabled: boolean;
  onToggle: (id: string) => void;
}) => {
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
        onValueChange={() => onToggle(permissionId)}
        value={enabled}
      />
    </View>
  );
};

export default function AgentDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const agentId = params.id as string;
  
  // Redirect foodie (or energy) to the dedicated energy-detail page
  useEffect(() => {
    if (agentId === 'foodie' || agentId === 'energy') {
      router.replace('/energy-detail');
      return;
    }
  }, [agentId, router]);
  
  // Map new agent names to old keys for AGENTS_DATA lookup
  const agentNameMapping: Record<string, string> = {
    'facey': 'face',
    'sleeper': 'sleep',
    'moodie': 'stress',
    'poopy': 'feces',
    // Keep old names for backward compatibility
    'face': 'face',
    'sleep': 'sleep',
    'stress': 'stress',
    'feces': 'feces',
    'posture': 'posture',
  };
  
  const mappedAgentId = agentNameMapping[agentId] || agentId;
  
  const [isHired, setIsHired] = useState(true);
  const [permissions, setPermissions] = useState({
    camera: false,
    photos: false,
    healthkit: false,
    calendar: false,
    location: false,
    notifications: false,
  });

  const agent = AGENTS_DATA[mappedAgentId];
  
  // If agent not found or is foodie/energy (redirecting), return null
  if (!agent || agentId === 'foodie' || agentId === 'energy') {
    return null;
  }

  // 同步权限状态
  const syncAllPermissions = async () => {
    try {
      // Camera
      const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
      setPermissions(prev => ({ ...prev, camera: cameraPermission.granted }));

      // Photos
      const photosPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      setPermissions(prev => ({ ...prev, photos: photosPermission.granted }));

      // HealthKit
      const isAvailable = await healthDataManager.isAvailable();
      if (isAvailable) {
        const requiredPermissions = [
          HealthDataType.STEP_COUNT,
          HealthDataType.HEART_RATE,
          HealthDataType.SLEEP_ANALYSIS,
          HealthDataType.ACTIVE_ENERGY,
          HealthDataType.HEIGHT,
          HealthDataType.WEIGHT,
          HealthDataType.BLOOD_PRESSURE_SYSTOLIC,
          HealthDataType.BLOOD_PRESSURE_DIASTOLIC,
        ];
        const authorizedPermissions = healthDataManager.getAuthorizedPermissions();
        const allAuthorized = requiredPermissions.every(perm => 
          authorizedPermissions.includes(perm)
        );
        setPermissions(prev => ({ ...prev, healthkit: allAuthorized }));
      }

      // Calendar
      const calendarResult = await calendarManager.checkPermission();
      setPermissions(prev => ({ ...prev, calendar: calendarResult.granted }));

      // Location
      const locationResult = await locationManager.checkLocationPermission('foreground');
      setPermissions(prev => ({ ...prev, location: locationResult.success }));
    } catch (error) {
      console.error('Failed to sync permissions:', error);
    }
  };

  useEffect(() => {
    syncAllPermissions();
  }, []);

  // 当页面聚焦时同步权限状态
  useFocusEffect(
    useCallback(() => {
      syncAllPermissions();
    }, [])
  );

  // 权限切换逻辑（与 home.tsx 保持一致）
  const togglePermission = async (id: string) => {
    const currentValue = permissions[id as keyof typeof permissions];
    const permissionName = id === 'healthkit' ? 'HealthKit' : 
                          id === 'camera' ? 'Camera' :
                          id === 'photos' ? 'Photos' :
                          id === 'calendar' ? 'Calendar' :
                          id === 'location' ? 'Location' :
                          id === 'notifications' ? 'Notifications' : id;

    // 如果尝试关闭权限，跳转到相应的设置页面
    if (currentValue) {
      const isHealthKit = id === 'healthkit';
      const settingsText = isHealthKit ? 'Open Health App' : 'Go to Settings';
      const settingsMessage = isHealthKit 
        ? `Please disable ${permissionName} permission in Health app.`
        : `Please disable ${permissionName} permission in system settings.`;
      
      Alert.alert(
        `Disable ${permissionName} permission`,
        settingsMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: settingsText,
            onPress: async () => {
              try {
                if (isHealthKit) {
                  const healthAppUrl = 'x-apple-health://';
                  const canOpen = await Linking.canOpenURL(healthAppUrl);
                  if (canOpen) {
                    await Linking.openURL(healthAppUrl);
                  } else {
                    await Linking.openSettings();
                  }
                } else {
                  await Linking.openSettings();
                }
              } catch (error) {
                console.error('Failed to open settings:', error);
                if (isHealthKit) {
                  try {
                    await Linking.openSettings();
                  } catch (settingsError) {
                    console.error('Failed to open settings:', settingsError);
                  }
                }
              }
            },
          },
        ],
      );
      return;
    }

    // 开启权限的逻辑
    if (id === 'camera') {
      try {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted) {
          setPermissions(prev => ({ ...prev, camera: true }));
        } else {
          Alert.alert(
            'Camera permission denied',
            'Camera permission is required to use camera function. Please enable camera permission in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('Failed to open settings:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('Failed to request camera permission:', error);
      }
      return;
    }

    if (id === 'photos') {
      try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted) {
          setPermissions(prev => ({ ...prev, photos: true }));
        } else {
          Alert.alert(
            'Photo library permission denied',
            'Photo library permission is required to access photos. Please enable photo library permission in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('Failed to open settings:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('Failed to request photo library permission:', error);
      }
      return;
    }

    if (id === 'healthkit') {
      try {
        const isAvailable = await healthDataManager.isAvailable();
        if (!isAvailable) {
          Alert.alert(
            'HealthKit unavailable',
            'HealthKit is only available on iOS devices and requires device support.',
            [{ text: 'OK', style: 'default' }],
          );
          return;
        }

        const permissionResult = await healthDataManager.requestAllCommonPermissions();
        if (permissionResult.success) {
          const requiredPermissions = [
            HealthDataType.STEP_COUNT,
            HealthDataType.HEART_RATE,
            HealthDataType.SLEEP_ANALYSIS,
            HealthDataType.ACTIVE_ENERGY,
            HealthDataType.HEIGHT,
            HealthDataType.WEIGHT,
            HealthDataType.BLOOD_PRESSURE_SYSTOLIC,
            HealthDataType.BLOOD_PRESSURE_DIASTOLIC,
          ];
          const authorizedPermissions = healthDataManager.getAuthorizedPermissions();
          const allAuthorized = requiredPermissions.every(perm => 
            authorizedPermissions.includes(perm)
          );
          setPermissions(prev => ({ ...prev, healthkit: allAuthorized }));

          if (!allAuthorized) {
            Alert.alert(
              'Some permissions not authorized',
              'Some health data permissions are not authorized. Please enable all HealthKit permissions in Health app.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Health App',
                  onPress: async () => {
                    try {
                      const healthAppUrl = 'x-apple-health://';
                      const canOpen = await Linking.canOpenURL(healthAppUrl);
                      if (canOpen) {
                        await Linking.openURL(healthAppUrl);
                      } else {
                        await Linking.openSettings();
                      }
                    } catch (error) {
                      console.error('Failed to open Health app:', error);
                      try {
                        await Linking.openSettings();
                      } catch (settingsError) {
                        console.error('Failed to open settings:', settingsError);
                      }
                    }
                  },
                },
              ],
            );
          }
        } else {
          Alert.alert(
            'HealthKit permission denied',
            permissionResult.error || 'HealthKit permission is required to access health data. Please enable HealthKit permission in Health app.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Health App',
                onPress: async () => {
                  try {
                    const healthAppUrl = 'x-apple-health://';
                    const canOpen = await Linking.canOpenURL(healthAppUrl);
                    if (canOpen) {
                      await Linking.openURL(healthAppUrl);
                    } else {
                      await Linking.openSettings();
                    }
                  } catch (error) {
                    console.error('Failed to open Health app:', error);
                    try {
                      await Linking.openSettings();
                    } catch (settingsError) {
                      console.error('Failed to open settings:', settingsError);
                    }
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('Failed to request HealthKit permission:', error);
      }
      return;
    }

    if (id === 'calendar') {
      try {
        const permissionResult = await calendarManager.requestPermission();
        if (permissionResult.success) {
          setPermissions(prev => ({ ...prev, calendar: true }));
        } else {
          Alert.alert(
            'Calendar permission denied',
            permissionResult.error || 'Calendar permission is required to access calendar events. Please enable calendar permission in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('Failed to open settings:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('Failed to request calendar permission:', error);
      }
      return;
    }

    if (id === 'location') {
      try {
        const isServiceAvailable = await locationManager.isLocationServiceAvailable();
        if (!isServiceAvailable) {
          Alert.alert(
            'Location service unavailable',
            'Please enable location service in device settings',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('Failed to open settings:', error);
                  }
                },
              },
            ],
          );
          return;
        }

        const permissionResult = await locationManager.requestLocationPermission('foreground');
        if (permissionResult.success) {
          setPermissions(prev => ({ ...prev, location: true }));
        } else {
          Alert.alert(
            'Location permission denied',
            permissionResult.error || 'Location permission is required to use location service. Please enable location permission in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('Failed to open settings:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('Failed to request location permission:', error);
      }
      return;
    }

    if (id === 'notifications') {
      // Notifications are handled globally, just show a message
      Alert.alert(
        'Notifications',
        'Notification permissions are managed in system settings. Please enable notifications in Settings > Notifications.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Settings',
            onPress: async () => {
              try {
                await Linking.openSettings();
              } catch (error) {
                console.error('Failed to open settings:', error);
              }
            },
          },
        ],
      );
      return;
    }
  };

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

  // Check agent type using both new and old names
  const isStressAgent = agentId === 'stress' || agentId === 'moodie';
  const isEnergyAgent = agentId === 'energy';
  const isFaceAgent = agentId === 'face' || agentId === 'facey';
  const isPostureAgent = agentId === 'posture';
  const isSleepAgent = agentId === 'sleep' || agentId === 'sleeper';
  const isFecesAgent = agentId === 'feces' || agentId === 'poopy';

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
                    permissionId="camera"
                    enabled={permissions.camera}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API Access"
                    subtitle="stress & heart rate"
                    permissionId="healthkit"
                    enabled={permissions.healthkit}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="mood alerts & reminders"
                    permissionId="notifications"
                    enabled={permissions.notifications}
                    onToggle={togglePermission}
                  />
                </>
              ) : isEnergyAgent ? (
                <>
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Camera Access"
                    subtitle="analyze your food"
                    permissionId="camera"
                    enabled={permissions.camera}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<ImageIcon size={24} color="#000000" strokeWidth={2} />}
                    title="Photos"
                    subtitle="scan meal history"
                    permissionId="photos"
                    enabled={permissions.photos}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API Access"
                    subtitle="weight trend & activity"
                    permissionId="healthkit"
                    enabled={permissions.healthkit}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="meal reminders & alerts"
                    permissionId="notifications"
                    enabled={permissions.notifications}
                    onToggle={togglePermission}
                  />
                </>
              ) : isFaceAgent ? (
                <>
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Camera Access"
                    subtitle="for skin tracking"
                    permissionId="camera"
                    enabled={permissions.camera}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API"
                    subtitle="for sleep & stress correlation"
                    permissionId="healthkit"
                    enabled={permissions.healthkit}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="daily glow reminders"
                    permissionId="notifications"
                    enabled={permissions.notifications}
                    onToggle={togglePermission}
                  />
                </>
              ) : isPostureAgent ? (
                <>
                  <PermissionToggle
                    icon={<Camera size={24} color="#000000" strokeWidth={2} />}
                    title="Camera Access"
                    subtitle="posture scan"
                    permissionId="camera"
                    enabled={permissions.camera}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Waves size={24} color="#000000" strokeWidth={2} />}
                    title="Motion Access"
                    subtitle="sitting & movement detection"
                    permissionId="location"
                    enabled={permissions.location}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="alignment reminders"
                    permissionId="notifications"
                    enabled={permissions.notifications}
                    onToggle={togglePermission}
                  />
                </>
              ) : isSleepAgent ? (
                <>
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API Access"
                    subtitle="sleep records"
                    permissionId="healthkit"
                    enabled={permissions.healthkit}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Waves size={24} color="#000000" strokeWidth={2} />}
                    title="Motion Access"
                    subtitle="night movement tracking"
                    permissionId="location"
                    enabled={permissions.location}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="bedtime reminders & morning insights"
                    permissionId="notifications"
                    enabled={permissions.notifications}
                    onToggle={togglePermission}
                  />
                </>
              ) : (
                <>
                  <PermissionToggle
                    icon={<ImageIcon size={24} color="#000000" strokeWidth={2} />}
                    title="Photos Access"
                    subtitle="stool tracking"
                    permissionId="photos"
                    enabled={permissions.photos}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Heart size={24} color="#000000" strokeWidth={2} />}
                    title="Health API Access"
                    subtitle="hydration & sleep correlation"
                    permissionId="healthkit"
                    enabled={permissions.healthkit}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Utensils size={24} color="#000000" strokeWidth={2} />}
                    title="Food Logs Access"
                    subtitle="digestion pattern analysis"
                    permissionId="calendar"
                    enabled={permissions.calendar}
                    onToggle={togglePermission}
                  />
                  <PermissionToggle
                    icon={<Bell size={24} color="#000000" strokeWidth={2} />}
                    title="Notifications"
                    subtitle="daily gut check & alerts"
                    permissionId="notifications"
                    enabled={permissions.notifications}
                    onToggle={togglePermission}
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
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  goalText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
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
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
  },
  freeTrialText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
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
    fontFamily: 'Nunito_500Medium',
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
    fontFamily: 'Nunito_700Bold',
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
    fontFamily: 'Nunito_600SemiBold',
    color: '#000000',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
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
    fontFamily: 'Nunito_700Bold',
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
    fontFamily: 'Nunito_500Medium',
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
    fontFamily: 'Nunito_600SemiBold',
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
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
  },
  motivationText: {
    fontSize: 18,
    fontFamily: 'Nunito_600SemiBold',
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
    fontFamily: 'Nunito_700Bold',
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
    fontFamily: 'Nunito_600SemiBold',
    color: '#000000',
    marginBottom: 2,
  },
  permissionSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
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
    fontFamily: 'Nunito_600SemiBold',
    color: '#000000',
    textAlign: 'center',
  },
});
