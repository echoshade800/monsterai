import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import userService from '../src/services/userService';
import storageManager from '../src/utils/storage';

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
          onPress: async () => {
            try {
              // 调用后端登出API（可选，即使失败也继续清空本地数据）
              await userService.logout().catch(error => {
                console.warn('后端登出失败，继续清空本地数据:', error);
              });
              
              // 清空本地用户数据和 accessToken
              await storageManager.clearAuthData();
              
              // 重置导航栈并跳转到登录页面
              // 使用 dismissAll 清除所有路由，然后 replace 到登录页面
              router.dismissAll();
              router.replace('/login');
            } catch (error) {
              console.error('登出失败:', error);
              Alert.alert('错误', '登出时发生错误，请重试');
            }
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

  const handleAppPermissions = () => {
    router.push('/app-permissions');
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
        <View style={styles.profileCard}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🦑</Text>
            </View>
          </View>
          <Text style={styles.username}>USER6VPTIXFW8</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.card}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/account-settings')}>
              <Text style={styles.menuItemText}>Account</Text>
              <ChevronRight size={20} color="#666" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.card}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

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
              <Text style={styles.menuItemText}>Language / Region</Text>
              <ChevronRight size={20} color="#666" strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => handleOpenLink('Units')}>
              <Text style={styles.menuItemText}>Units</Text>
              <ChevronRight size={20} color="#666" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Permissions</Text>

          <View style={styles.card}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

            <TouchableOpacity style={styles.menuItem} onPress={handleAppPermissions}>
              <Text style={styles.menuItemText}>App Permissions</Text>
              <ChevronRight size={20} color="#666" strokeWidth={2} />
            </TouchableOpacity>
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
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
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
