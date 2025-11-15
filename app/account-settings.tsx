import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

export default function AccountSettingsScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleEdit = (field: string) => {
    Alert.alert('Edit', `Edit ${field} functionality coming soon`);
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
                  <Text style={styles.menuItemValue}>USER6VPTIXFW8</Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('Name')}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuItemLabel}>Birthday</Text>
                  <Text style={styles.menuItemValue}>2003/10/17</Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('Birthday')}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuItemLabel}>Sex</Text>
                  <Text style={styles.menuItemValue}>Female</Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('Sex')}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuItemLabel}>Height</Text>
                  <Text style={styles.menuItemValue}>171 cm</Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('Height')}>
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
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('Email')}>
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
});
