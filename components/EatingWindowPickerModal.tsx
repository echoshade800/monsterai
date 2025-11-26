import { X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MonsterTimePicker } from './MonsterTimePicker';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 600;

interface EatingWindowPickerModalProps {
  visible: boolean;
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  enabled: boolean;
  onClose: () => void;
  onSave: (startTime: string, endTime: string, enabled: boolean) => void;
}

export function EatingWindowPickerModal({ 
  visible, 
  startTime,
  endTime,
  enabled: initialEnabled,
  onClose, 
  onSave 
}: EatingWindowPickerModalProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [editingField, setEditingField] = useState<'start' | 'end'>('start');

  // Parse time strings to hour/minute
  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)/);
    if (match) {
      return {
        hour: parseInt(match[1], 10),
        minute: parseInt(match[2], 10),
      };
    }
    return { hour: 12, minute: 0 };
  };

  const startParsed = parseTime(startTime);
  const endParsed = parseTime(endTime);

  const [selectedStartHour, setSelectedStartHour] = useState(startParsed.hour);
  const [selectedStartMinute, setSelectedStartMinute] = useState(startParsed.minute);
  const [selectedEndHour, setSelectedEndHour] = useState(endParsed.hour);
  const [selectedEndMinute, setSelectedEndMinute] = useState(endParsed.minute);

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Reset values when modal opens
  useEffect(() => {
    if (visible) {
      setIsEnabled(initialEnabled);
      const start = parseTime(startTime);
      const end = parseTime(endTime);
      setSelectedStartHour(start.hour);
      setSelectedStartMinute(start.minute);
      setSelectedEndHour(end.hour);
      setSelectedEndMinute(end.minute);
      setEditingField('start');
    }
  }, [visible, startTime, endTime, initialEnabled]);

  // Animation effect
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSave = () => {
    if (isEnabled) {
      const formattedStart = `${selectedStartHour.toString().padStart(2, '0')}:${selectedStartMinute.toString().padStart(2, '0')}`;
      const formattedEnd = `${selectedEndHour.toString().padStart(2, '0')}:${selectedEndMinute.toString().padStart(2, '0')}`;
      onSave(formattedStart, formattedEnd, true);
    } else {
      onSave('OFF', 'OFF', false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleStartTimeChange = (hour: number, minute: number) => {
    setSelectedStartHour(hour);
    setSelectedStartMinute(minute);
  };

  const handleEndTimeChange = (hour: number, minute: number) => {
    setSelectedEndHour(hour);
    setSelectedEndMinute(minute);
  };

  const formatTimeDisplay = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleCancel}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit eating window</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <X size={24} color="#666666" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* ON/OFF Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Eating Window</Text>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{ false: '#E9EDF0', true: '#4CCB5E' }}
              thumbColor={'#FFFFFF'}
              ios_backgroundColor="#E9EDF0"
            />
          </View>

          {isEnabled && (
            <>
              {/* Time Selection Buttons */}
              <View style={styles.timeFieldsContainer}>
                {/* Start Time Field */}
                <TouchableOpacity
                  style={[styles.timeField, editingField === 'start' && styles.timeFieldActive]}
                  onPress={() => setEditingField('start')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeFieldLabel}>Start eating</Text>
                  <Text style={styles.timeFieldTime}>
                    {formatTimeDisplay(selectedStartHour, selectedStartMinute)}
                  </Text>
                </TouchableOpacity>

                {/* End Time Field */}
                <TouchableOpacity
                  style={[styles.timeField, editingField === 'end' && styles.timeFieldActive]}
                  onPress={() => setEditingField('end')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeFieldLabel}>End eating</Text>
                  <Text style={styles.timeFieldTime}>
                    {formatTimeDisplay(selectedEndHour, selectedEndMinute)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Time Picker */}
              <View style={styles.pickerContainer}>
                {editingField === 'start' ? (
                  <MonsterTimePicker
                    initialHour={selectedStartHour}
                    initialMinute={selectedStartMinute}
                    onHourChange={(hour) => handleStartTimeChange(hour, selectedStartMinute)}
                    onMinuteChange={(minute) => handleStartTimeChange(selectedStartHour, minute)}
                  />
                ) : (
                  <MonsterTimePicker
                    initialHour={selectedEndHour}
                    initialMinute={selectedEndMinute}
                    onHourChange={(hour) => handleEndTimeChange(hour, selectedEndMinute)}
                    onMinuteChange={(minute) => handleEndTimeChange(selectedEndHour, minute)}
                  />
                )}
              </View>
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Nunito',
  },
  closeButton: {
    padding: 4,
    position: 'absolute',
    right: 0,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  timeFieldsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timeField: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeFieldActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#4CCB5E',
  },
  timeFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    fontFamily: 'Nunito',
  },
  timeFieldTime: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Nunito',
  },
});

