import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, Switch, Alert, ImageBackground, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ChevronRight, User } from 'lucide-react-native';
import { useState } from 'react';

export default function ProfileScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [cameraAccess, setCameraAccess] = useState(true);
  const [healthAccess, setHealthAccess] = useState(true);
  const [motionAccess, setMotionAccess] = useState(false);

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

  const handleOpenLink = (title: string) => {
    console.log(`Opening ${title}`);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/chatbackground.png' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
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
          <View style={styles.profileCard}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>🦑</Text>
              </View>
            </View>
            <Text style={styles.username}>USER6VPTIXFW8</Text>
            <Text style={styles.email}>hello6@hello.com</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <View style={styles.card}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

              <TouchableOpacity style={styles.menuItem} onPress={() => handleOpenLink('Edit Profile')}>
                <Text style={styles.menuItemText}>Edit Profile</Text>
                <ChevronRight size={20} color="#666" strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.menuItem}>
                <Text style={styles.menuItemText}>Notification Preferences</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => handleOpenLink('Language')}>
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuItemText}>Language / Region</Text>
                  <Text style={styles.menuItemSubtext}>System Default</Text>
                </View>
                <ChevronRight size={20} color="#666" strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => handleOpenLink('Connected Accounts')}>
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuItemText}>Connected Accounts</Text>
                  <View style={styles.accountBadges}>
                    <Text style={styles.accountBadge}>Apple</Text>
                    <Text style={styles.accountBadge}>Google</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#666" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Permissions</Text>

            <View style={styles.card}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

              <View style={styles.menuItem}>
                <Text style={styles.menuItemText}>Camera Access</Text>
                <Switch
                  value={cameraAccess}
                  onValueChange={setCameraAccess}
                  trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.menuItem}>
                <Text style={styles.menuItemText}>Health API Access</Text>
                <Switch
                  value={healthAccess}
                  onValueChange={setHealthAccess}
                  trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.menuItem}>
                <Text style={styles.menuItemText}>Motion / Posture Sensor</Text>
                <Switch
                  value={motionAccess}
                  onValueChange={setMotionAccess}
                  trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuItemText}>Data Sync Status</Text>
                  <Text style={styles.syncedText}>Synced 2 min ago</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>

            <View style={styles.card}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

              <TouchableOpacity style={styles.menuItem} onPress={() => handleOpenLink('Terms of Service')}>
                <Text style={styles.menuItemText}>Terms of Service</Text>
                <ChevronRight size={20} color="#666" strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => handleOpenLink('Privacy Policy')}>
                <Text style={styles.menuItemText}>Privacy Policy</Text>
                <ChevronRight size={20} color="#666" strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => handleOpenLink('Data Usage')}>
                <Text style={styles.menuItemText}>Data Usage Explanation</Text>
                <ChevronRight size={20} color="#666" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>

            <View style={styles.card}>
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={styles.dangerText}>Log Out</Text>
                <ChevronRight size={20} color="#FF3B30" strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
                <Text style={styles.dangerText}>Delete Account</Text>
                <ChevronRight size={20} color="#FF3B30" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.versionText}>MonsterAI v1.0.0 (Beta)</Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D4B8',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  },
  profileCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#666666',
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
  dangerTitle: {
    color: '#FF3B30',
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
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  menuItemSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  accountBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  accountBadge: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  syncedText: {
    fontSize: 13,
    color: '#34C759',
    marginTop: 2,
    fontWeight: '500',
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginLeft: 18,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
  },
});
