import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Brain, Calendar, ChevronRight, ClipboardList, Target, User } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [currentWeight, setCurrentWeight] = useState(58.4);
  const [goalWeight, setGoalWeight] = useState(52.0);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [weightPickerType, setWeightPickerType] = useState<'current' | 'goal'>('current');

  // Eating Window state
  const [showEatingWindowPicker, setShowEatingWindowPicker] = useState(false);

  // Basic Info states
  const [height, setHeight] = useState(175); // cm
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Non-binary'>('Male');
  const [activityLevel, setActivityLevel] = useState<'Not Very Active' | 'Lightly Active' | 'Active' | 'Very Active'>('Lightly Active');
  const [dietPreference, setDietPreference] = useState('Light flavors, low spice, no dairy');
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

  const handleWeightSave = (weight: number) => {
    if (weightPickerType === 'current') {
      setCurrentWeight(weight);
    } else {
      setGoalWeight(weight);
    }
    setShowWeightPicker(false);
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

  const handleHeightSave = (newHeight: number) => {
    setHeight(newHeight);
    setShowHeightPicker(false);
  };

  const handleAgeSave = (newAge: number) => {
    setAge(newAge);
    setShowAgePicker(false);
  };

  const handleGenderSave = (newGender: 'Male' | 'Female' | 'Non-binary') => {
    setGender(newGender);
    setShowGenderPicker(false);
  };

  const handleActivityLevelSave = (newActivityLevel: 'Not Very Active' | 'Lightly Active' | 'Active' | 'Very Active') => {
    setActivityLevel(newActivityLevel);
    setShowActivityLevelPicker(false);
  };

  const handleDietPreferenceSave = (newPreference: string) => {
    setDietPreference(newPreference);
    setShowDietPreferenceModal(false);
  };

  const handleChatWithMe = () => {
    // Navigate to Echo page (main chat) with @energy pre-filled
    router.push({
      pathname: '/(tabs)',
      params: { mentionAgent: 'energy' },
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
        <Text style={styles.navTitle}>Energy</Text>
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
                <Text style={styles.strategyDataValue}>{currentWeight.toFixed(1)}kg</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.strategyDataRow}
                onPress={() => handleWeightPress('goal')}
                activeOpacity={0.7}
              >
                <Text style={styles.strategyDataLabel}>Goal Weight</Text>
                <Text style={styles.strategyDataValue}>{goalWeight.toFixed(1)}kg</Text>
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
              <Text style={styles.infoValue}>{height} cm</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => setShowAgePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{age}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => setShowGenderPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{gender}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => setShowActivityLevelPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.infoLabel}>Activity Level</Text>
              <Text style={styles.infoValue}>{activityLevel}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => setShowDietPreferenceModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.infoLabel}>Diet Preferences</Text>
              <Text style={[styles.infoValue, styles.infoValueMultiline]} numberOfLines={2}>
                {dietPreference}
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
        onClose={() => setShowHeightPicker(false)}
        onSave={handleHeightSave}
      />

      {/* Age Picker Modal */}
      <AgePickerModal
        visible={showAgePicker}
        initialAge={age}
        onClose={() => setShowAgePicker(false)}
        onSave={handleAgeSave}
      />

      {/* Gender Picker Modal */}
      <GenderPickerModal
        visible={showGenderPicker}
        initialGender={gender}
        onClose={() => setShowGenderPicker(false)}
        onSave={handleGenderSave}
      />

      {/* Activity Level Picker Modal */}
      <ActivityLevelPickerModal
        visible={showActivityLevelPicker}
        initialActivityLevel={activityLevel}
        onClose={() => setShowActivityLevelPicker(false)}
        onSave={handleActivityLevelSave}
      />

      {/* Diet Preference Modal */}
      <DietPreferenceModal
        visible={showDietPreferenceModal}
        initialPreference={dietPreference}
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

