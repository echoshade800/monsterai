import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, Alert, Modal, TextInput, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';

export default function AccountSettingsScreen() {
  const router = useRouter();

  const [name, setName] = useState('USER6VPTIXFW8');
  const [birthday, setBirthday] = useState('2003/10/17');
  const [sex, setSex] = useState('Female');
  const [height, setHeight] = useState('171 cm');

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempYear, setTempYear] = useState('2003');
  const [tempMonth, setTempMonth] = useState('10');
  const [tempDay, setTempDay] = useState('17');
  const [tempHeight, setTempHeight] = useState('171');

  const handleBack = () => {
    router.back();
  };

  const handleEditName = () => {
    setTempValue(name);
    setEditingField('name');
  };

  const handleEditBirthday = () => {
    const parts = birthday.split('/');
    setTempYear(parts[0]);
    setTempMonth(parts[1]);
    setTempDay(parts[2]);
    setEditingField('birthday');
  };

  const handleEditSex = () => {
    setEditingField('sex');
  };

  const handleEditHeight = () => {
    setTempHeight(height.replace(' cm', ''));
    setEditingField('height');
  };

  const handleSave = () => {
    if (editingField === 'name') {
      setName(tempValue);
    } else if (editingField === 'birthday') {
      setBirthday(`${tempYear}/${tempMonth}/${tempDay}`);
    } else if (editingField === 'sex') {
      setSex(tempValue);
    } else if (editingField === 'height') {
      setHeight(`${tempHeight} cm`);
    }
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  const handleReset = () => {
    Alert.alert('Reset Password', 'Reset password functionality coming soon');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            router.replace('/login');
          },
        },
      ]
    );
  };

  const years = Array.from({ length: 100 }, (_, i) => (2024 - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const heights = Array.from({ length: 121 }, (_, i) => (120 + i).toString());

  const renderPickerItem = (item: string, selectedValue: string, onSelect: (value: string) => void) => (
    <TouchableOpacity
      key={item}
      style={[styles.pickerItem, item === selectedValue && styles.pickerItemSelected]}
      onPress={() => onSelect(item)}
    >
      <Text style={[styles.pickerItemText, item === selectedValue && styles.pickerItemTextSelected]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <View style={styles.card}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemLabel}>Name</Text>
                <Text style={styles.menuItemValue}>{name}</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={handleEditName}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemLabel}>Birthday</Text>
                <Text style={styles.menuItemValue}>{birthday}</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={handleEditBirthday}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemLabel}>Sex</Text>
                <Text style={styles.menuItemValue}>{sex}</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={handleEditSex}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemLabel}>Height</Text>
                <Text style={styles.menuItemValue}>{height}</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={handleEditHeight}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <View style={styles.card}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemLabel}>Email</Text>
                <Text style={styles.menuItemValue}>hello6@hello.com</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('Edit Email', 'Email editing coming soon')}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemLabel}>Password</Text>
                <Text style={styles.menuItemValue}>No password</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={handleReset}>
                <Text style={styles.editButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={styles.menuItemText}>Log Out</Text>
              <ChevronRight size={20} color="#666" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={editingField !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />

            <Text style={styles.modalTitle}>
              {editingField === 'name' && 'Edit Name'}
              {editingField === 'birthday' && 'Edit Birthday'}
              {editingField === 'sex' && 'Edit Sex'}
              {editingField === 'height' && 'Edit Height'}
            </Text>

            {editingField === 'name' && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={tempValue}
                  onChangeText={setTempValue}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  autoFocus
                />
              </View>
            )}

            {editingField === 'birthday' && (
              <View style={styles.pickerRow}>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Year</Text>
                  <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
                    {years.map(year => renderPickerItem(year, tempYear, setTempYear))}
                  </ScrollView>
                </View>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Month</Text>
                  <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
                    {months.map(month => renderPickerItem(month, tempMonth, setTempMonth))}
                  </ScrollView>
                </View>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Day</Text>
                  <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
                    {days.map(day => renderPickerItem(day, tempDay, setTempDay))}
                  </ScrollView>
                </View>
              </View>
            )}

            {editingField === 'sex' && (
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[styles.optionButton, tempValue === 'Male' && styles.optionButtonSelected]}
                  onPress={() => setTempValue('Male')}
                >
                  <Text style={[styles.optionText, tempValue === 'Male' && styles.optionTextSelected]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, tempValue === 'Female' && styles.optionButtonSelected]}
                  onPress={() => setTempValue('Female')}
                >
                  <Text style={[styles.optionText, tempValue === 'Female' && styles.optionTextSelected]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {editingField === 'height' && (
              <View style={styles.singlePickerContainer}>
                <Text style={styles.pickerLabel}>Height (cm)</Text>
                <ScrollView style={styles.singlePickerScrollView} showsVerticalScrollIndicator={false}>
                  {heights.map(h => renderPickerItem(h, tempHeight, setTempHeight))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: '#000000',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    paddingLeft: 4,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 56,
  },
  menuItemLeft: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  menuItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  editButton: {
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginLeft: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    height: 200,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerScrollView: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    maxHeight: 160,
  },
  singlePickerContainer: {
    marginBottom: 24,
  },
  singlePickerScrollView: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#000000',
  },
  pickerItemTextSelected: {
    fontWeight: '700',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#000000',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
