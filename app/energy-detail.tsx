import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TimePickerModal } from '../components/TimePickerModal';

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
  
  // States
  const [expandedMealPlan, setExpandedMealPlan] = useState(false);
  const [reminders, setReminders] = useState<ReminderItem[]>([
    { id: '1', name: 'Breakfast Reminder', time: 'OFF', enabled: false },
    { id: '2', name: 'Lunch Reminder', time: '12:00', enabled: true },
    { id: '3', name: 'Dinner Reminder', time: '19:30', enabled: true },
    { id: '4', name: 'Eating Window', time: '12:00 – 20:00', enabled: true },
  ]);
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Today's meals
  const todayMeals: MealItem[] = [
    { type: 'Breakfast', description: 'Oats + berries + almond butter' },
    { type: 'Lunch', description: 'Quinoa bowl with grilled veggies & chickpeas' },
    { type: 'Dinner', description: 'Baked salmon + sweet potato + steamed greens' },
  ];

  // Inside My Mind data
  const insideMindData = [
    { time: '[6:30pm]', text: 'User logged "pizza + soda".' },
    { time: '[6:32pm]', text: 'High carb load → predict energy crash in 60–90min.' },
    { time: '[6:35pm]', text: 'Suggest: Eat fiber-rich salad to slow digestion.' },
    { time: '[11:00am]', text: 'User logged "coffee + donut".' },
    { time: '[11:07am]', text: 'Sugar spike detected → energy surge in 20min.' },
  ];

  const handleReminderPress = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder && reminder.enabled && reminder.time !== 'OFF') {
      setSelectedReminderId(id);
      setShowTimePicker(true);
    }
  };

  const handleTimeSave = (newTime: string) => {
    if (selectedReminderId) {
      setReminders(prev => prev.map(r => 
        r.id === selectedReminderId ? { ...r, time: newTime } : r
      ));
    }
    setShowTimePicker(false);
    setSelectedReminderId(null);
  };

  const handleStrategyPress = () => {
    router.push('/energy-strategy-selection');
  };

  const handleWeeklyReportPress = () => {
    router.push('/energy-weekly-report');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Navigation Bar */}
      <View style={styles.navBar}>
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
          {/* Bottom gradient overlay - only at the very bottom */}
          <LinearGradient
            colors={['rgba(235, 237, 245, 0)', 'rgba(235, 237, 245, 1)']}
            style={styles.heroGradient}
            pointerEvents="none"
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
          <Text style={styles.sectionHeaderTitle}>Meal Plan</Text>
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

          {/* Time Axis */}
          <View style={styles.timeAxis}>
            <View style={styles.timeAxisBar}>
              <Text style={styles.timeAxisLabel}>12:00</Text>
              <View style={styles.timeAxisLine}>
                <View style={styles.timeAxisActive} />
              </View>
              <Text style={styles.timeAxisLabel}>20:00</Text>
            </View>
          </View>

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

          {/* Expanded Content */}
          {expandedMealPlan && (
            <View style={styles.expandedContent}>
              <Text style={styles.expandedText}>Monday: Light meals with vegetables</Text>
              <Text style={styles.expandedText}>Tuesday: Protein-rich breakfast and lunch</Text>
              <Text style={styles.expandedText}>Wednesday: Balanced meals throughout the day</Text>
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
          <Text style={styles.sectionHeaderTitle}>🧠 Inside My Mind</Text>
          <View style={styles.insideMindCard}>
          <View style={styles.insideMindContent}>
            {insideMindData.map((item, index) => (
              <View key={index} style={styles.insideMindRow}>
                <Text style={styles.insideMindTime}>{item.time}</Text>
                <Text style={styles.insideMindText}> {item.text}</Text>
              </View>
            ))}
          </View>
        </View>
        </View>

        {/* Current Strategy */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Current Strategy</Text>
          <View style={styles.strategyCard}>
          <View style={styles.ipHeader}>
            <Image
              source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/energy/energyspeak.png' }}
              style={styles.ipHeaderAvatar}
            />
            <Text style={styles.ipHeaderText}>
              Fuel in 8 hours—supports fat burn.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.strategyRow}
            onPress={handleStrategyPress}
            activeOpacity={0.7}
          >
            <Text style={styles.strategyTitle}>Intermittent Fasting (16/8)</Text>
            <Text style={styles.strategyArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.strategyDataRows}>
            <View style={styles.strategyDataRow}>
              <Text style={styles.strategyDataLabel}>Current Weight</Text>
              <Text style={styles.strategyDataValue}>58.4kg</Text>
            </View>
            <View style={styles.strategyDataRow}>
              <Text style={styles.strategyDataLabel}>Goal Weight</Text>
              <Text style={styles.strategyDataValue}>52kg</Text>
            </View>
            <View style={styles.strategyDataRow}>
              <Text style={styles.strategyDataLabel}>Weekly Goal</Text>
              <Text style={styles.strategyDataValue}>Lose 1kg per week</Text>
            </View>
          </View>
        </View>
        </View>

        {/* Basic Info */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Basic Info</Text>
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
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Height</Text>
              <Text style={styles.infoValue}>168 cm</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>29</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>Female</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Activity Level</Text>
              <Text style={styles.infoValue}>Moderately Active</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Diet Preferences</Text>
              <Text style={styles.infoValue}>Light flavors, low spice, no dairy</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Units</Text>
              <Text style={styles.infoValue}>kg, cm</Text>
            </View>
          </View>
        </View>
        </View>

        {/* Weekly Report */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Your Week in Review</Text>
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

      {/* Time Picker Modal */}
      {showTimePicker && selectedReminderId && (
        <TimePickerModal
          visible={showTimePicker}
          initialTime={reminders.find(r => r.id === selectedReminderId)?.time || '12:00 AM'}
          onClose={() => {
            setShowTimePicker(false);
            setSelectedReminderId(null);
          }}
          onSave={handleTimeSave}
        />
      )}
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
    paddingTop: 60,
    paddingBottom: 16,
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
    paddingBottom: 40,
  },
  heroContainer: {
    width: '100%',
    height: 150,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 12,
    marginBottom: 8,
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
  timeAxis: {
    marginBottom: 20,
  },
  timeAxisBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAxisLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Nunito',
  },
  timeAxisLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#E9EDF0',
    marginHorizontal: 12,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timeAxisActive: {
    width: '60%',
    height: '100%',
    backgroundColor: '#FF9F66',
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
    marginTop: 4,
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  expandedText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
    fontFamily: 'Nunito',
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
  },
  insideMindContent: {
    gap: 12,
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
});

