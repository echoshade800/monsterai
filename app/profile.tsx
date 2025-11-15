import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, User } from 'lucide-react-native';
import { useState } from 'react';

export default function ProfileScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleBack = () => {
    router.back();
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent. All your data will be deleted and cannot be recovered.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: () => {
                    console.log('Account deleted');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleNavigation = (screen: string) => {
    if (screen === 'account') {
      router.push('/account-settings');
    } else {
      console.log(`Opening ${screen}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <User size={32} color="#666666" strokeWidth={2} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>USER6VPTIXFW8</Text>
            <Text style={styles.memberSince}>Member since January 15, 2024</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.groupedList}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigation('account')}
            >
              <Text style={styles.rowText}>Account</Text>
              <ChevronRight size={20} color="#C7C7CC" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.groupedList}>
            <View style={styles.row}>
              <Text style={styles.rowText}>Notification Preferences</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigation('language')}
            >
              <Text style={styles.rowText}>Language / Region</Text>
              <ChevronRight size={20} color="#C7C7CC" strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigation('units')}
            >
              <Text style={styles.rowText}>Units</Text>
              <ChevronRight size={20} color="#C7C7CC" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Permissions</Text>
          <View style={styles.groupedList}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigation('permissions')}
            >
              <Text style={styles.rowText}>App Permissions</Text>
              <ChevronRight size={20} color="#C7C7CC" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.groupedList}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigation('terms')}
            >
              <Text style={styles.rowText}>Terms of Service</Text>
              <ChevronRight size={20} color="#C7C7CC" strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => handleNavigation('privacy')}
            >
              <Text style={styles.rowText}>Privacy Policy</Text>
              <ChevronRight size={20} color="#C7C7CC" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <View style={styles.groupedList}>
            <TouchableOpacity
              style={styles.row}
              onPress={handleLogout}
            >
              <Text style={styles.dangerText}>Log Out</Text>
              <ChevronRight size={20} color="#FF3B30" strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.row}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.dangerText}>Delete Account</Text>
              <ChevronRight size={20} color="#FF3B30" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>MonsterAI v1.0.0 (Beta)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 35,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 15,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6D6D72',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  dangerTitle: {
    color: '#FF3B30',
  },
  groupedList: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    backgroundColor: '#FFFFFF',
  },
  rowText: {
    fontSize: 17,
    color: '#000000',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 16,
  },
  dangerText: {
    fontSize: 17,
    color: '#FF3B30',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
