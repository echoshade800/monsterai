import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Brain, Calendar, ChevronRight, ClipboardList, Target, User } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityLevelPickerModal } from '../components/ActivityLevelPickerModal';
import { AgePickerModal } from '../components/AgePickerModal';
import { DietPreferenceModal } from '../components/DietPreferenceModal';
import { EatingWindowPickerModal } from '../components/EatingWindowPickerModal';
import { EatingWindowTimeline } from '../components/EatingWindowTimeline';
import { GenderPickerModal } from '../components/GenderPickerModal';
import { HeightPickerModal } from '../components/HeightPickerModal';
import { TimePickerModal } from '../components/TimePickerModal';
import { WeightPickerModal } from '../components/WeightPickerModal';
import { getStrategyById } from '../constants/strategies';
import userService from '../src/services/userService';
import storageManager from '../src/utils/storage';

// Mock data interfaces
interface ReminderItem {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
}

interface MealItem {
  type: string;
  description: string;
}

export default function EnergyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const strategyCardRef = useRef<View>(null);
  
  // States
  const [expandedMealPlan, setExpandedMealPlan] = useState(false);
  const [currentStrategyId, setCurrentStrategyId] = useState<string | null>(null);
  const [reminders, setReminders] = useState<ReminderItem[]>([
    { id: '1', name: 'Breakfast Reminder', time: 'OFF', enabled: false },
    { id: '2', name: 'Lunch Reminder', time: '13:00', enabled: true },
    { id: '3', name: 'Dinner Reminder', time: '19:30', enabled: true },
    { id: '4', name: 'Eating Window', time: '12:00 – 20:00', enabled: true },
  ]);
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Weight states
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [currentWeightUnit, setCurrentWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [goalWeightUnit, setGoalWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [weightPickerType, setWeightPickerType] = useState<'current' | 'goal'>('current');

  // Eating Window state
  const [showEatingWindowPicker, setShowEatingWindowPicker] = useState(false);

  // Basic Info states - loaded from API
  const [height, setHeight] = useState<number | null>(null); // cm
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Non-binary' | 'Prefer not to say' | null>(null);
  const [activityLevel, setActivityLevel] = useState<'Not Very Active' | 'Lightly Active' | 'Active' | 'Very Active' | null>(null);
  const [dietPreference, setDietPreference] = useState<string | null>(null);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showAgePicker, setShowAgePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showActivityLevelPicker, setShowActivityLevelPicker] = useState(false);
  const [showDietPreferenceModal, setShowDietPreferenceModal] = useState(false);

  // Today's meals
  const todayMeals: MealItem[] = [
    { type: 'Breakfast', description: 'Oats + berries + almond butter' },
    { type: 'Lunch', description: 'Quinoa bowl with grilled veggies & chickpeas' },
    { type: 'Dinner', description: 'Baked salmon + sweet potato + steamed greens' },
  ];

  // Helper function to create a Date from time string (e.g., "13:00")
  const createTimeToday = (hour: number, minute: number = 0): Date => {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  // Helper function to parse time string like "13:00" to Date
  const parseTimeString = (timeStr: string): Date => {
    const match = timeStr.match(/(\d+):(\d+)/);
    if (match) {
      const hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      return createTimeToday(hour, minute);
    }
    return createTimeToday(12, 0); // fallback
  };

  // Helper function to parse eating window time range like "12:00 – 20:00"
  const parseEatingWindowRange = (timeRange: string): { start: Date; end: Date } => {
    const match = timeRange.match(/(\d+):(\d+)\s*[–-]\s*(\d+):(\d+)/);
    if (match) {
      const startHour = parseInt(match[1], 10);
      const startMinute = parseInt(match[2], 10);
      const endHour = parseInt(match[3], 10);
      const endMinute = parseInt(match[4], 10);
      return {
        start: createTimeToday(startHour, startMinute),
        end: createTimeToday(endHour, endMinute),
      };
    }
    return { start: createTimeToday(12, 0), end: createTimeToday(20, 0) }; // fallback
  };

  // Convert gender format from API (lowercase) to display format
  const convertGenderFromAPI = (apiGender: string | null | undefined): 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say' | null => {
    if (!apiGender) return null;
    const lower = apiGender.toLowerCase();
    if (lower === 'male') return 'Male';
    if (lower === 'female') return 'Female';
    if (lower === 'non-binary' || lower === 'nonbinary') return 'Non-binary';
    if (lower === 'prefer not to say' || lower === 'prefernottosay') return 'Prefer not to say';
    return null;
  };

  // Convert gender format to API format (lowercase)
  const convertGenderToAPI = (gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'): string => {
    return gender.toLowerCase();
  };

  // Extract height in cm from API value (could be number or string like "175 cm")
  const extractHeightFromAPI = (apiHeight: any): number | null => {
    if (!apiHeight) return null;
    if (typeof apiHeight === 'number') return apiHeight;
    if (typeof apiHeight === 'string') {
      const match = apiHeight.match(/(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    return null;
  };

  // Conversion functions
  const kgToLbs = (kg: number) => kg * 2.20462;
  const lbsToKg = (lbs: number) => lbs / 2.20462;

  // Load user profile data from API (same source as Profile page)
  const loadUserProfileData = useCallback(async () => {
    try {
      const result: any = await userService.getUserInfo();
      if (result?.success && result?.data) {
        const userData = result.data;
        
        // Load gender
        if (userData.gender) {
          const convertedGender = convertGenderFromAPI(userData.gender);
          if (convertedGender) {
            setGender(convertedGender);
          }
        } else {
          setGender(null);
        }
        
        // Load height (convert to number in cm)
        if (userData.height) {
          const heightInCm = extractHeightFromAPI(userData.height);
          if (heightInCm) {
            setHeight(heightInCm);
          }
        } else {
          setHeight(null);
        }
        
        // Load height unit from API or local storage
        if ((userData as any).heightUnit) {
          setHeightUnit((userData as any).heightUnit);
        } else {
          // Try to load from local storage
          try {
            const savedHeightUnit = await storageManager.getItem('heightUnit');
            if (savedHeightUnit === 'cm' || savedHeightUnit === 'ft') {
              setHeightUnit(savedHeightUnit);
            }
          } catch (error) {
            console.warn('Failed to load heightUnit from local storage:', error);
          }
        }
        
        // Load age
        if (userData.age) {
          const ageNum = typeof userData.age === 'number' ? userData.age : parseInt(String(userData.age), 10);
          if (!isNaN(ageNum)) {
            setAge(ageNum);
          }
        } else {
          setAge(null);
        }
        
        // Load current weight unit from API or local storage first
        let loadedWeightUnit: 'kg' | 'lbs' = 'kg';
        if ((userData as any).weightUnit) {
          loadedWeightUnit = (userData as any).weightUnit;
          console.log('[EnergyDetail] Loaded weightUnit from API:', loadedWeightUnit);
        } else {
          // Try to load from local storage
          try {
            const savedWeightUnit = await storageManager.getItem('currentWeightUnit');
            console.log('[EnergyDetail] Loaded weightUnit from local storage:', savedWeightUnit, 'type:', typeof savedWeightUnit);
            if (savedWeightUnit && (savedWeightUnit === 'kg' || savedWeightUnit === 'lbs')) {
              loadedWeightUnit = savedWeightUnit as 'kg' | 'lbs';
            } else {
              console.log('[EnergyDetail] No valid weightUnit found, using default: kg');
            }
          } catch (error) {
            console.warn('[EnergyDetail] Failed to load currentWeightUnit from local storage:', error);
          }
        }
        setCurrentWeightUnit(loadedWeightUnit);
        console.log('[EnergyDetail] Final loadedWeightUnit:', loadedWeightUnit);
        
        // Load weight (current weight)
        if (userData.weight) {
          const weightNum = typeof userData.weight === 'number' ? userData.weight : parseFloat(String(userData.weight));
          console.log('[EnergyDetail] Loaded weight from API:', weightNum, 'unit:', loadedWeightUnit);
          if (!isNaN(weightNum) && weightNum > 0) {
            // If the stored unit is lbs, the value from backend is in lbs, convert to kg for internal state
            // If the stored unit is kg, the value from backend is in kg, use directly
            const weightInKg = loadedWeightUnit === 'lbs' ? lbsToKg(weightNum) : weightNum;
            console.log('[EnergyDetail] Converted weightInKg:', weightInKg, 'from', weightNum, loadedWeightUnit);
            setCurrentWeight(weightInKg);
          } else {
            setCurrentWeight(null);
          }
        } else {
          setCurrentWeight(null);
        }
        
        // Load goal weight unit from API or local storage first
        let loadedGoalWeightUnit: 'kg' | 'lbs' = 'kg';
        if ((userData as any).goalWeightUnit) {
          loadedGoalWeightUnit = (userData as any).goalWeightUnit;
        } else {
          // Try to load from local storage
          try {
            const savedGoalWeightUnit = await storageManager.getItem('goalWeightUnit');
            if (savedGoalWeightUnit === 'kg' || savedGoalWeightUnit === 'lbs') {
              loadedGoalWeightUnit = savedGoalWeightUnit;
            }
          } catch (error) {
            console.warn('Failed to load goalWeightUnit from local storage:', error);
          }
        }
        setGoalWeightUnit(loadedGoalWeightUnit);
        
        // Load goal weight (if available)
        if (userData.goalWeight) {
          const goalWeightNum = typeof userData.goalWeight === 'number' ? userData.goalWeight : parseFloat(String(userData.goalWeight));
          if (!isNaN(goalWeightNum) && goalWeightNum > 0) {
            // If the stored unit is lbs, the value from backend is in lbs, convert to kg for internal state
            // If the stored unit is kg, the value from backend is in kg, use directly
            const weightInKg = loadedGoalWeightUnit === 'lbs' ? lbsToKg(goalWeightNum) : goalWeightNum;
            setGoalWeight(weightInKg);
          } else {
            setGoalWeight(null);
          }
        } else {
          setGoalWeight(null);
        }
        
        // Load activity level (if available)
        if (userData.activityLevel) {
          setActivityLevel(userData.activityLevel);
        } else {
          setActivityLevel(null);
        }
        
        // Load diet preference (if available)
        if (userData.dietPreference) {
          setDietPreference(userData.dietPreference);
        } else {
          setDietPreference(null);
        }
      }
    } catch (error) {
      console.error('Failed to load user profile data:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadUserProfileData();
  }, [loadUserProfileData]);

  // Reload data when page gains focus (e.g., returning from Profile page)
  useFocusEffect(
    useCallback(() => {
      loadUserProfileData();
    }, [loadUserProfileData])
  );

  // Dynamically calculate eating window data based on reminders
  const eatingWindowData = useMemo(() => {
    const eatingWindowReminder = reminders.find(r => r.name === 'Eating Window');
    const breakfastReminder = reminders.find(r => r.name === 'Breakfast Reminder');
    const lunchReminder = reminders.find(r => r.name === 'Lunch Reminder');
    const dinnerReminder = reminders.find(r => r.name === 'Dinner Reminder');

    // Eating Window is the source of truth for timeline range
    const eatingWindowRange = eatingWindowReminder 
      ? parseEatingWindowRange(eatingWindowReminder.time)
      : { start: createTimeToday(12, 0), end: createTimeToday(20, 0) };

    // Calculate eating slots: 2h after each meal reminder time (only if enabled)
    const eatingSlots: { start: Date; end: Date }[] = [];
    
    // Breakfast slot: 2h after breakfast reminder
    if (breakfastReminder && breakfastReminder.enabled && breakfastReminder.time !== 'OFF') {
      const breakfastTime = parseTimeString(breakfastReminder.time);
      const breakfastEnd = new Date(breakfastTime);
      breakfastEnd.setHours(breakfastEnd.getHours() + 2);
      eatingSlots.push({ start: breakfastTime, end: breakfastEnd });
    }

    // Lunch slot: 2h after lunch reminder
    if (lunchReminder && lunchReminder.enabled && lunchReminder.time !== 'OFF') {
      const lunchTime = parseTimeString(lunchReminder.time);
      const lunchEnd = new Date(lunchTime);
      lunchEnd.setHours(lunchEnd.getHours() + 2);
      eatingSlots.push({ start: lunchTime, end: lunchEnd });
    }

    // Dinner slot: 2h after dinner reminder
    if (dinnerReminder && dinnerReminder.enabled && dinnerReminder.time !== 'OFF') {
      const dinnerTime = parseTimeString(dinnerReminder.time);
      const dinnerEnd = new Date(dinnerTime);
      dinnerEnd.setHours(dinnerEnd.getHours() + 2);
      eatingSlots.push({ start: dinnerTime, end: dinnerEnd });
    }

    return {
      eatingWindowStart: eatingWindowRange.start,
      eatingWindowEnd: eatingWindowRange.end,
      reminders: [
        breakfastReminder,
        lunchReminder,
        dinnerReminder,
      ].filter(r => r !== undefined) as ReminderItem[],
      eatingSlots,
    };
  }, [reminders]); // Recalculate when reminders change

  // Inside My Mind data
  const insideMindData = [
    { time: '[6:30pm]', text: 'User logged "pizza + soda".' },
    { time: '[6:32pm]', text: 'High carb load → predict energy crash in 60–90min.' },
    { time: '[6:35pm]', text: 'Suggest: Eat fiber-rich salad to slow digestion.' },
    { time: '[11:00am]', text: 'User logged "coffee + donut".' },
    { time: '[11:07am]', text: 'Sugar spike detected → energy surge in 20min.' },
    { time: '[9:15am]', text: 'Fasting window ended. Ready to eat.' },
    { time: '[9:20am]', text: 'User logged "scrambled eggs + avocado toast".' },
    { time: '[9:25am]', text: 'Good protein start → stable blood sugar expected.' },
    { time: '[2:45pm]', text: 'User logged "apple + handful of almonds".' },
    { time: '[2:47pm]', text: 'Light snack → won\'t disrupt dinner appetite.' },
    { time: '[8:00pm]', text: 'Eating window closing soon. Plan tomorrow\'s first meal.' },
    { time: '[8:15pm]', text: 'User inactive for 3 hours → may have skipped dinner.' },
    { time: '[10:30pm]', text: 'Sleep pattern analysis: 7.2 hours average this week.' },
  ];

  const handleReminderPress = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
      if (reminder.id === '4') {
        // Eating Window - open special picker
        setShowEatingWindowPicker(true);
      } else {
        // Regular reminder - open time picker
        setSelectedReminderId(id);
        setShowTimePicker(true);
      }
    }
  };

  const handleTimeSave = (newTime: string, enabled: boolean) => {
    if (selectedReminderId) {
      setReminders(prev => prev.map(r => 
        r.id === selectedReminderId 
          ? { ...r, time: enabled ? newTime : 'OFF', enabled } 
          : r
      ));
    }
    setShowTimePicker(false);
    setSelectedReminderId(null);
  };

  const handleStrategyPress = () => {
    router.push({
      pathname: '/energy-strategy-list',
      params: { currentStrategyId: currentStrategyId || '' },
    });
  };

  // Handle strategy selection from params
  useEffect(() => {
    if (params.selectedStrategyId) {
      setCurrentStrategyId(params.selectedStrategyId as string);
      
      // Scroll to Current Strategy section after a short delay
      setTimeout(() => {
        strategyCardRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
          },
          () => {}
        );
      }, 300);
    }
  }, [params.selectedStrategyId]);

  const handleWeeklyReportPress = () => {
    router.push('/energy-weekly-report');
  };

  const handleWeightPress = (type: 'current' | 'goal') => {
    setWeightPickerType(type);
    setShowWeightPicker(true);
  };

  const handleWeightSave = async (weight: number, unit: 'kg' | 'lbs') => {
    try {
      // Validate weight value
      if (isNaN(weight) || weight <= 0) {
        console.error('Invalid weight value:', weight);
        return;
      }

      // Store weight in the unit selected by user (no conversion)
      // If user selected lbs, weight is in lbs; if kg, weight is in kg
      const weightToStore = weight;
      
      // Update API - store the value with unit concatenated in the weight string
      const updateData: any = {};
      if (weightPickerType === 'current') {
        updateData.weight = `${weightToStore}${unit}`;
        console.log('[EnergyDetail] Saving weight:', weightToStore, 'unit:', unit, 'type:', weightPickerType);
        // Also save to local storage as backup
        try {
          await storageManager.setItem('currentWeightUnit', unit);
          console.log('[EnergyDetail] Saved currentWeightUnit to local storage:', unit);
        } catch (storageError) {
          console.warn('[EnergyDetail] Failed to save currentWeightUnit to local storage:', storageError);
        }
      } else {
        updateData.goalWeight = `${weightToStore}${unit}`;
        console.log('[EnergyDetail] Saving goalWeight:', weightToStore, 'unit:', unit);
        // Also save to local storage as backup
        try {
          await storageManager.setItem('goalWeightUnit', unit);
          console.log('[EnergyDetail] Saved goalWeightUnit to local storage:', unit);
        } catch (storageError) {
          console.warn('[EnergyDetail] Failed to save goalWeightUnit to local storage:', storageError);
        }
      }
      
      const updateResult: any = await userService.updateUserInfo(updateData);
      
      if (updateResult?.success) {
        if (weightPickerType === 'current') {
          // For internal state, convert to kg for consistency
          // But save the unit preference for display
          const weightInKg = unit === 'kg' ? weight : lbsToKg(weight);
          if (!isNaN(weightInKg) && weightInKg > 0) {
            setCurrentWeight(weightInKg);
            setCurrentWeightUnit(unit);
          } else {
            console.error('Invalid weightInKg calculated:', weightInKg);
          }
        } else {
          const weightInKg = unit === 'kg' ? weight : lbsToKg(weight);
          if (!isNaN(weightInKg) && weightInKg > 0) {
            setGoalWeight(weightInKg);
            setGoalWeightUnit(unit);
          } else {
            console.error('Invalid weightInKg calculated:', weightInKg);
          }
        }
        setShowWeightPicker(false);
      } else {
        console.error('Failed to update weight:', updateResult?.message);
      }
    } catch (error) {
      console.error('Error saving weight:', error);
    }
  };

  const handleEatingWindowSave = (startTime: string, endTime: string, enabled: boolean) => {
    setReminders(prev => prev.map(r => 
      r.id === '4' 
        ? { 
            ...r, 
            time: enabled ? `${startTime} – ${endTime}` : 'OFF', 
            enabled 
          } 
        : r
    ));
    setShowEatingWindowPicker(false);
  };

  // Conversion functions for height
  const cmToFeet = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  const feetToCm = (feet: number, inches: number) => {
    return Math.round((feet * 12 + inches) * 2.54);
  };

  const handleHeightSave = async (newHeight: number, unit: 'cm' | 'ft') => {
    try {
      // Height is always stored in cm in the backend
      // newHeight is already in cm (from HeightPickerModal)
      const updateData: any = {
        height: String(newHeight), // API expects string
        heightUnit: unit, // Try to save unit to backend
      };
      
      // Also save to local storage as backup
      try {
        await storageManager.setItem('heightUnit', unit);
      } catch (storageError) {
        console.warn('Failed to save heightUnit to local storage:', storageError);
      }
      
      const updateResult: any = await userService.updateUserInfo(updateData);
      
      if (updateResult?.success) {
        setHeight(newHeight);
        setHeightUnit(unit);
        setShowHeightPicker(false);
      } else {
        console.error('Failed to update height:', updateResult?.message);
      }
    } catch (error) {
      console.error('Error saving height:', error);
    }
  };

  const handleAgeSave = async (newAge: number) => {
    try {
      const updateData: any = {
        age: newAge,
      };
      
      const updateResult: any = await userService.updateUserInfo(updateData);
      
      if (updateResult?.success) {
        setAge(newAge);
        setShowAgePicker(false);
      } else {
        console.error('Failed to update age:', updateResult?.message);
      }
    } catch (error) {
      console.error('Error saving age:', error);
    }
  };

  const handleGenderSave = async (newGender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say') => {
    try {
      const updateData: any = {
        gender: convertGenderToAPI(newGender),
      };
      
      const updateResult: any = await userService.updateUserInfo(updateData);
      
      if (updateResult?.success) {
        setGender(newGender);
        setShowGenderPicker(false);
      } else {
        console.error('Failed to update gender:', updateResult?.message);
      }
    } catch (error) {
      console.error('Error saving gender:', error);
    }
  };

  const handleActivityLevelSave = async (newActivityLevel: 'Not Very Active' | 'Lightly Active' | 'Active' | 'Very Active') => {
    try {
      const updateData: any = {
        activityLevel: newActivityLevel,
      };
      
      const updateResult: any = await userService.updateUserInfo(updateData);
      
      if (updateResult?.success) {
        setActivityLevel(newActivityLevel);
        setShowActivityLevelPicker(false);
      } else {
        console.error('Failed to update activity level:', updateResult?.message);
      }
    } catch (error) {
      console.error('Error saving activity level:', error);
    }
  };

  const handleDietPreferenceSave = async (newPreference: string) => {
    try {
      const updateData: any = {
        dietPreference: newPreference,
      };
      
      const updateResult: any = await userService.updateUserInfo(updateData);
      
      if (updateResult?.success) {
        setDietPreference(newPreference);
        setShowDietPreferenceModal(false);
      } else {
        console.error('Failed to update diet preference:', updateResult?.message);
      }
    } catch (error) {
      console.error('Error saving diet preference:', error);
    }
  };

  const handleChatWithMe = () => {
    // Navigate to Echo page (main chat) with @foodie pre-filled
    router.push({
      pathname: '/(tabs)',
      params: { mentionAgent: 'foodie' },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Navigation Bar */}
      <View style={[styles.navBar, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Foodie</Text>
        <View style={styles.hiredBadge}>
          <Text style={styles.hiredText}>Hired</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/energy/energylay.png' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Combined Data Banner */}
        <View style={styles.dataBanner}>
          {/* IP Feedback Card */}
          <View style={styles.feedbackCard}>
            <Image
              source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/energy/energyspeak.png' }}
              style={styles.feedbackAvatar}
            />
            <Text style={styles.feedbackText}>
              Great job 👀 Mild deficit → gentle fat loss 💛
            </Text>
          </View>

          {/* Data Panel - Calories & Macros */}
          <View style={styles.dataCard}>
            <View style={styles.caloriesSection}>
              <Text style={styles.caloriesLabel}>Calories left</Text>
              <Text style={styles.caloriesValue}>1,480 kcal</Text>
            </View>
            
            <View style={styles.macrosRow}>
              {/* Carbs */}
              <View style={styles.macroItem}>
                <View style={[styles.macroRing, { borderColor: '#8B7FE8' }]} />
                <View style={styles.macroTextContainer}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroValue}>70g left</Text>
                </View>
              </View>

              {/* Fat */}
              <View style={styles.macroItem}>
                <View style={[styles.macroRing, { borderColor: '#FF9F66' }]} />
                <View style={styles.macroTextContainer}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroValue}>26g left</Text>
                </View>
              </View>

              {/* Protein */}
              <View style={styles.macroItem}>
                <View style={[styles.macroRing, { borderColor: '#5CAADD' }]} />
                <View style={styles.macroTextContainer}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>58g left</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Meal Plan Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ClipboardList size={20} color="#000000" style={styles.sectionIcon} />
            <Text style={styles.sectionHeaderTitle}>Meal Plan</Text>
          </View>
          <View style={styles.mealPlanCard}>
          {/* IP Header */}
          <View style={styles.ipHeader}>
            <Image
              source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/energy/energyspeak.png' }}
              style={styles.ipHeaderAvatar}
            />
            <Text style={styles.ipHeaderText}>
              Your reminders are set. I won't let you forget again 😤
            </Text>
          </View>

          {/* Eating Window Timeline */}
          <EatingWindowTimeline
            eatingWindowStart={eatingWindowData.eatingWindowStart}
            eatingWindowEnd={eatingWindowData.eatingWindowEnd}
            reminders={eatingWindowData.reminders}
            eatingSlots={eatingWindowData.eatingSlots}
          />

          {/* Today's Meals */}
          <View style={styles.mealsSection}>
            {/* Today Row */}
            <View style={styles.mealRow}>
              <View style={styles.mealLabel}>
                <Text style={styles.mealsSectionTitle}>Today</Text>
                <Text style={styles.mealDaySubtitle}>(Sunday)</Text>
              </View>
              <View style={styles.mealContent} />
            </View>

            {/* Meals */}
            {todayMeals.map((meal, index) => (
              <View key={index} style={styles.mealRow}>
                <View style={styles.mealLabel}>
                  <Text style={styles.mealIcon}>
                    {meal.type === 'Breakfast' ? '🍳' : meal.type === 'Lunch' ? '🥗' : '🍽️'}
                  </Text>
                  <Text style={styles.mealType}>{meal.type}</Text>
                </View>
                <View style={styles.mealContent}>
                  <Text style={styles.mealDescription}>{meal.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Expand Button */}
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setExpandedMealPlan(!expandedMealPlan)}
            activeOpacity={0.7}
          >
            <Text style={styles.expandButtonText}>Eat Well: Next 3 Days</Text>
            <Text style={styles.expandArrow}>{expandedMealPlan ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Expanded Content - Next 3 Days */}
          {expandedMealPlan && (
            <View style={styles.expandedContent}>
              {/* November 26 (Wednesday) */}
              <View style={styles.expandedDaySection}>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealsSectionTitle}>November 26</Text>
                    <Text style={styles.mealDaySubtitle}>(wednesday)</Text>
                  </View>
                  <View style={styles.mealContent} />
                </View>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealIcon}>🍳</Text>
                    <Text style={styles.mealType}>Breakfast</Text>
                  </View>
                  <View style={styles.mealContent}>
                    <Text style={styles.mealDescription}>Greek yogurt + banana + almonds</Text>
                  </View>
                </View>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealIcon}>🥗</Text>
                    <Text style={styles.mealType}>Lunch</Text>
                  </View>
                  <View style={styles.mealContent}>
                    <Text style={styles.mealDescription}>Whole-wheat wrap with hummus & veggies</Text>
                  </View>
                </View>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealIcon}>🍽️</Text>
                    <Text style={styles.mealType}>Dinner</Text>
                  </View>
                  <View style={styles.mealContent}>
                    <Text style={styles.mealDescription}>Tofu stir-fry + brown rice + bok choy</Text>
                  </View>
                </View>
              </View>

              {/* November 27 (Thursday) */}
              <View style={styles.expandedDaySection}>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealsSectionTitle}>November 27</Text>
                    <Text style={styles.mealDaySubtitle}>(thursday)</Text>
                  </View>
                  <View style={styles.mealContent} />
                </View>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealIcon}>🍳</Text>
                    <Text style={styles.mealType}>Breakfast</Text>
                  </View>
                  <View style={styles.mealContent}>
                    <Text style={styles.mealDescription}>Smoothie: spinach, mango, flaxseed</Text>
                  </View>
                </View>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealIcon}>🥗</Text>
                    <Text style={styles.mealType}>Lunch</Text>
                  </View>
                  <View style={styles.mealContent}>
                    <Text style={styles.mealDescription}>Lentil soup + whole-grain toast</Text>
                  </View>
                </View>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealIcon}>🍽️</Text>
                    <Text style={styles.mealType}>Dinner</Text>
                  </View>
                  <View style={styles.mealContent}>
                    <Text style={styles.mealDescription}>Grilled cod + quinoa + roasted zucchini</Text>
                  </View>
                </View>
              </View>

              {/* November 28 (Friday) */}
              <View style={styles.expandedDaySection}>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealsSectionTitle}>November 28</Text>
                    <Text style={styles.mealDaySubtitle}>(friday)</Text>
                  </View>
                  <View style={styles.mealContent} />
                </View>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealIcon}>🍳</Text>
                    <Text style={styles.mealType}>Breakfast</Text>
                  </View>
                  <View style={styles.mealContent}>
                    <Text style={styles.mealDescription}>Scrambled eggs + whole-wheat toast</Text>
                  </View>
                </View>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealIcon}>🥗</Text>
                    <Text style={styles.mealType}>Lunch</Text>
                  </View>
                  <View style={styles.mealContent}>
                    <Text style={styles.mealDescription}>Mediterranean salad with feta</Text>
                  </View>
                </View>
                <View style={styles.mealRow}>
                  <View style={styles.mealLabel}>
                    <Text style={styles.mealIcon}>🍽️</Text>
                    <Text style={styles.mealType}>Dinner</Text>
                  </View>
                  <View style={styles.mealContent}>
                    <Text style={styles.mealDescription}>Chicken breast + roasted vegetables</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Reminders */}
          <View style={styles.remindersSection}>
            <Text style={styles.remindersSectionTitle}>Reminders</Text>
            {reminders.map((reminder) => (
              <TouchableOpacity
                key={reminder.id}
                style={styles.reminderRow}
                onPress={() => handleReminderPress(reminder.id)}
                activeOpacity={reminder.enabled && reminder.time !== 'OFF' ? 0.7 : 1}
              >
                <Text style={styles.reminderName}>{reminder.name}</Text>
                <Text style={[
                  styles.reminderTime,
                  reminder.enabled && reminder.time !== 'OFF' && styles.reminderTimeActive
                ]}>
                  {reminder.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        </View>

        {/* Inside My Mind */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Brain size={20} color="#000000" style={styles.sectionIcon} />
            <Text style={styles.sectionHeaderTitle}>Inside My Mind</Text>
          </View>
          <View style={styles.insideMindCard}>
            <ScrollView 
              style={styles.insideMindScrollView}
              contentContainerStyle={styles.insideMindContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {insideMindData.map((item, index) => (
                <View key={index} style={styles.insideMindRow}>
                  <Text style={styles.insideMindTime}>{item.time}</Text>
                  <Text style={styles.insideMindText}> {item.text}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Current Strategy */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#000000" style={styles.sectionIcon} />
            <Text style={styles.sectionHeaderTitle}>Current Strategy</Text>
          </View>
          <View ref={strategyCardRef} style={styles.strategyCard}>
            <View style={styles.ipHeader}>
              <Image
                source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/energy/energyspeak.png' }}
                style={styles.ipHeaderAvatar}
              />
              <Text style={styles.ipHeaderText}>
                {currentStrategyId 
                  ? "You're on track to hit your goal by Apr 6, 2026."
                  : "Choose a method that fits your lifestyle 🍽️"
                }
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.strategyRow}
              onPress={handleStrategyPress}
              activeOpacity={0.7}
            >
              {currentStrategyId ? (
                <>
                  <Text style={styles.strategyTitle}>
                    {getStrategyById(currentStrategyId)?.name || 'Unknown Strategy'}
                  </Text>
                  <ChevronRight size={20} color="#666666" strokeWidth={2} />
                </>
              ) : (
                <View style={styles.strategyEmptyState}>
                  <View style={styles.strategyEmptyTextContainer}>
                    <Text style={styles.strategyEmptyTitle}>
                      Choose your weight management method
                    </Text>
                    <Text style={styles.strategyEmptySubtitle}>
                      Pick a style that matches how you like to eat.
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#666666" strokeWidth={2} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.strategyDataRows}>
              <TouchableOpacity 
                style={styles.strategyDataRow}
                onPress={() => handleWeightPress('current')}
                activeOpacity={0.7}
              >
                <Text style={styles.strategyDataLabel}>Current Weight</Text>
                <Text style={styles.strategyDataValue}>
                  {(() => {
                    if (currentWeight === null || isNaN(currentWeight) || currentWeight <= 0) {
                      return '—';
                    }
                    if (currentWeightUnit === 'kg') {
                      return `${currentWeight.toFixed(1)}kg`;
                    } else {
                      const lbsValue = kgToLbs(currentWeight);
                      if (isNaN(lbsValue) || lbsValue <= 0) {
                        return '—';
                      }
                      return `${lbsValue.toFixed(1)}lbs`;
                    }
                  })()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.strategyDataRow}
                onPress={() => handleWeightPress('goal')}
                activeOpacity={0.7}
              >
                <Text style={styles.strategyDataLabel}>Goal Weight</Text>
                <Text style={styles.strategyDataValue}>
                  {(() => {
                    if (goalWeight === null || isNaN(goalWeight) || goalWeight <= 0) {
                      return '—';
                    }
                    if (goalWeightUnit === 'kg') {
                      return `${goalWeight.toFixed(1)}kg`;
                    } else {
                      const lbsValue = kgToLbs(goalWeight);
                      if (isNaN(lbsValue) || lbsValue <= 0) {
                        return '—';
                      }
                      return `${lbsValue.toFixed(1)}lbs`;
                    }
                  })()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#000000" style={styles.sectionIcon} />
            <Text style={styles.sectionHeaderTitle}>Basic Info</Text>
          </View>
          <View style={styles.basicInfoCard}>
          <View style={styles.ipHeader}>
            <Image
              source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/energy/energyspeak.png' }}
              style={styles.ipHeaderAvatar}
            />
            <Text style={styles.ipHeaderText}>
              Tell me more—I'll give better advice 🐱
            </Text>
          </View>

          <View style={styles.infoRows}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>TDEE (kcal/day)</Text>
              <Text style={styles.infoValue}>2,130</Text>
            </View>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => setShowHeightPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.infoLabel}>Height</Text>
              <Text style={styles.infoValue}>
                {(() => {
                  if (height === null || isNaN(height) || height <= 0) {
                    return '—';
                  }
                  if (heightUnit === 'cm') {
                    return `${height} cm`;
                  } else {
                    const { feet, inches } = cmToFeet(height);
                    return `${feet}' ${inches}"`;
                  }
                })()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => setShowAgePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{age !== null ? age.toString() : '—'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => setShowGenderPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{gender !== null ? gender : '—'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => setShowActivityLevelPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.infoLabel}>Activity Level</Text>
              <Text style={styles.infoValue}>{activityLevel !== null ? activityLevel : '—'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => setShowDietPreferenceModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.infoLabel}>Diet Preferences</Text>
              <Text style={[styles.infoValue, styles.infoValueMultiline]} numberOfLines={2}>
                {dietPreference || '—'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>

        {/* Weekly Report */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#000000" style={styles.sectionIcon} />
            <Text style={styles.sectionHeaderTitle}>Your Week in Review</Text>
          </View>
          <View style={styles.weeklyReportCard}>
            <View style={styles.ipHeader}>
              <Image
                source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/energy/energyspeak.png' }}
                style={styles.ipHeaderAvatar}
              />
              <Text style={styles.ipHeaderText}>
                Steady rhythm this week 👏 Keep it up!
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.seeDetailsButton}
              onPress={handleWeeklyReportPress}
              activeOpacity={0.8}
            >
              <Text style={styles.seeDetailsButtonText}>See details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Chat with me Button - Fixed at bottom - Double Layer Capsule */}
      <View style={[styles.chatButtonContainer, { bottom: insets.bottom + 16 }]}>
        {/* Outer Layer - Gradient Border with White Border */}
        <View style={styles.chatButtonOuterWrapper}>
          <LinearGradient
            colors={['rgba(255, 140, 51, 0.15)', 'rgba(255, 255, 255, 0)', 'rgba(46, 70, 255, 0.15)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            locations={[0, 0.49, 1]}
            style={styles.chatButtonOuter}
          >
            {/* Inner Layer - Frosted Glass Capsule */}
            <TouchableOpacity
              style={styles.chatButtonInner}
              onPress={handleChatWithMe}
              activeOpacity={0.85}
            >
              <BlurView intensity={60} tint="light" style={styles.chatButtonBlur}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.9)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.chatButtonInnerGradient}
                >
                  <View style={styles.chatButtonContent}>
                    <Text style={styles.chatButtonText}>Chat with me</Text>
                    <ArrowRight size={20} color="#000000" strokeWidth={2.5} />
                  </View>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && selectedReminderId && (
        <TimePickerModal
          visible={showTimePicker}
          initialTime={reminders.find(r => r.id === selectedReminderId)?.time || '12:00'}
          initialEnabled={reminders.find(r => r.id === selectedReminderId)?.enabled ?? true}
          onClose={() => {
            setShowTimePicker(false);
            setSelectedReminderId(null);
          }}
          onSave={handleTimeSave}
          showToggle={true}
        />
      )}

      {/* Weight Picker Modal */}
      <WeightPickerModal
        visible={showWeightPicker}
        initialWeight={weightPickerType === 'current' ? currentWeight : goalWeight}
        initialUnit={weightPickerType === 'current' ? currentWeightUnit : goalWeightUnit}
        onClose={() => setShowWeightPicker(false)}
        onSave={handleWeightSave}
      />

      {/* Eating Window Picker Modal */}
      <EatingWindowPickerModal
        visible={showEatingWindowPicker}
        startTime={reminders.find(r => r.id === '4')?.time.split(' – ')[0] || '12:00'}
        endTime={reminders.find(r => r.id === '4')?.time.split(' – ')[1] || '20:00'}
        enabled={reminders.find(r => r.id === '4')?.enabled ?? true}
        onClose={() => setShowEatingWindowPicker(false)}
        onSave={handleEatingWindowSave}
      />

      {/* Height Picker Modal */}
      <HeightPickerModal
        visible={showHeightPicker}
        initialHeight={height}
        initialUnit={heightUnit}
        onClose={() => setShowHeightPicker(false)}
        onSave={handleHeightSave}
      />

      {/* Age Picker Modal */}
      <AgePickerModal
        visible={showAgePicker}
        initialAge={age ?? 28}
        onClose={() => setShowAgePicker(false)}
        onSave={handleAgeSave}
      />

      {/* Gender Picker Modal */}
      <GenderPickerModal
        visible={showGenderPicker}
        initialGender={gender ?? 'Male'}
        onClose={() => setShowGenderPicker(false)}
        onSave={handleGenderSave}
      />

      {/* Activity Level Picker Modal */}
      <ActivityLevelPickerModal
        visible={showActivityLevelPicker}
        initialActivityLevel={activityLevel ?? 'Lightly Active'}
        onClose={() => setShowActivityLevelPicker(false)}
        onSave={handleActivityLevelSave}
      />

      {/* Diet Preference Modal */}
      <DietPreferenceModal
        visible={showDietPreferenceModal}
        initialPreference={dietPreference || ''}
        onClose={() => setShowDietPreferenceModal(false)}
        onSave={handleDietPreferenceSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBEDF5',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#EBEDF5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  navTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Nunito',
    textAlign: 'left',
  },
  hiredBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hiredText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Nunito',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Extra space for fixed button
  },
  heroContainer: {
    width: '100%',
    height: 150,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  dataBanner: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  feedbackAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Nunito',
  },
  dataCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  caloriesSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
    fontFamily: 'Nunito',
  },
  caloriesValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  macroRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    marginRight: 8,
  },
  macroTextContainer: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Nunito',
  },
  macroValue: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Nunito',
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  mealPlanCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 16,
  },
  ipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  ipHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  ipHeaderText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Nunito',
  },
  mealsSection: {
    marginBottom: 16,
  },
  mealsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  mealDaySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'Nunito',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealLabel: {
    width: '33%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  mealIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  mealContent: {
    flex: 1,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  mealDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    fontFamily: 'Nunito',
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: -8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
    fontFamily: 'Nunito',
  },
  expandArrow: {
    fontSize: 12,
    color: '#666666',
  },
  expandedContent: {
    paddingTop: 12,
  },
  expandedDaySection: {
    marginBottom: 16,
  },
  remindersSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9EDF0',
  },
  remindersSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    fontFamily: 'Nunito',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  reminderName: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Nunito',
  },
  reminderTime: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'Nunito',
  },
  reminderTimeActive: {
    color: '#000000',
    fontWeight: '600',
  },
  insideMindCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 16,
    maxHeight: 300, // Set maximum height for scrolling
  },
  insideMindScrollView: {
    maxHeight: 268, // Card maxHeight (300) - padding (16*2)
  },
  insideMindContent: {
    gap: 12,
    paddingBottom: 8, // Extra padding at bottom for better scroll experience
  },
  insideMindRow: {
    flexDirection: 'row',
  },
  insideMindTime: {
    fontSize: 13,
    color: '#8B7FE8',
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  insideMindText: {
    flex: 1,
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    fontFamily: 'Nunito',
  },
  strategyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 16,
  },
  strategyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EDF0',
    marginBottom: 16,
  },
  strategyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  strategyArrow: {
    fontSize: 24,
    color: '#666666',
  },
  strategyEmptyState: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strategyEmptyTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  strategyEmptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'Nunito',
  },
  strategyEmptySubtitle: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    fontFamily: 'Nunito',
  },
  strategyDataRows: {
    gap: 12,
  },
  strategyDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  strategyDataLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Nunito',
  },
  strategyDataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  basicInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 16,
  },
  infoRows: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Nunito',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
    fontFamily: 'Nunito',
  },
  infoValueMultiline: {
    lineHeight: 18,
  },
  weeklyReportCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 16,
  },
  seeDetailsButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 150,
  },
  seeDetailsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Nunito',
  },
  chatButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  chatButtonOuterWrapper: {
    width: 218,
    height: 59,
    borderRadius: 60,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  chatButtonOuter: {
    flex: 1,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  chatButtonInner: {
    width: 202,
    height: 42,
    borderRadius: 60,
    overflow: 'hidden',
  },
  chatButtonBlur: {
    flex: 1,
    borderRadius: 60,
    overflow: 'hidden',
  },
  chatButtonInnerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Nunito',
  },
});

