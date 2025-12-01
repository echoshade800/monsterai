import Clipboard from '@react-native-clipboard/clipboard';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import storageManager from '../src/utils/storage';

export default function ProfileInfoScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 加载用户数据
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await storageManager.getUserData();
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // 复制文本到剪贴板
  const handleCopy = useCallback((text: string, label: string) => {
    if (!text || text === 'N/A') {
      return;
    }
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Info</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : userData ? (
          <View style={styles.contentContainer}>
            {/* UID Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>User ID</Text>
              <Pressable
                style={styles.infoCard}
                onLongPress={() => handleCopy(userData.uid, 'UID')}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <Text style={styles.infoLabel}>UID</Text>
                <Text style={styles.infoValue}>{userData.uid || 'N/A'}</Text>
              </Pressable>
            </View>

            {/* Basic Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <Pressable
                style={styles.infoCard}
                onLongPress={() => handleCopy(userData.id, 'ID')}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <Text style={styles.infoLabel}>ID</Text>
                <Text style={styles.infoValue}>{userData.id || 'N/A'}</Text>
              </Pressable>
              <Pressable
                style={styles.infoCard}
                onLongPress={() => handleCopy(userData.userName, 'Username')}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{userData.userName || 'N/A'}</Text>
              </Pressable>
              <Pressable
                style={styles.infoCard}
                onLongPress={() => handleCopy(userData.email, 'Email')}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userData.email || 'N/A'}</Text>
              </Pressable>
              <Pressable
                style={styles.infoCard}
                onLongPress={() => handleCopy(userData.passId, 'Pass ID')}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <Text style={styles.infoLabel}>Pass ID</Text>
                <Text style={styles.infoValue}>{userData.passId || 'N/A'}</Text>
              </Pressable>
            </View>

            {/* Account Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              <Pressable
                style={styles.infoCard}
                onLongPress={() => handleCopy(String(userData.vipLevel), 'VIP Level')}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <Text style={styles.infoLabel}>VIP Level</Text>
                <Text style={styles.infoValue}>{userData.vipLevel || 'N/A'}</Text>
              </Pressable>
              <Pressable
                style={styles.infoCard}
                onLongPress={() => handleCopy(String(userData.availableAmount), 'Available Amount')}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <Text style={styles.infoLabel}>Available Amount</Text>
                <Text style={styles.infoValue}>{userData.availableAmount || 'N/A'}</Text>
              </Pressable>
              <Pressable
                style={styles.infoCard}
                onLongPress={() => handleCopy(userData.country, 'Country')}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <Text style={styles.infoLabel}>Country</Text>
                <Text style={styles.infoValue}>{userData.country || 'N/A'}</Text>
              </Pressable>
              <Pressable
                style={styles.infoCard}
                onLongPress={() => handleCopy(userData.city, 'City')}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <Text style={styles.infoLabel}>City</Text>
                <Text style={styles.infoValue}>{userData.city || 'N/A'}</Text>
              </Pressable>
              {userData.createTime && (
                <Pressable
                  style={styles.infoCard}
                  onLongPress={() => handleCopy(new Date(userData.createTime).toLocaleString(), 'Create Time')}
                  android_ripple={{ color: '#E0E0E0' }}
                >
                  <Text style={styles.infoLabel}>Create Time</Text>
                  <Text style={styles.infoValue}>
                    {new Date(userData.createTime).toLocaleString()}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Health Info Section (if available) */}
            {(userData.age || userData.gender || userData.height || userData.weight) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Health Information</Text>
                {userData.age && (
                  <Pressable
                    style={styles.infoCard}
                    onLongPress={() => handleCopy(String(userData.age), 'Age')}
                    android_ripple={{ color: '#E0E0E0' }}
                  >
                    <Text style={styles.infoLabel}>Age</Text>
                    <Text style={styles.infoValue}>{userData.age}</Text>
                  </Pressable>
                )}
                {userData.gender && (
                  <Pressable
                    style={styles.infoCard}
                    onLongPress={() => handleCopy(userData.gender, 'Gender')}
                    android_ripple={{ color: '#E0E0E0' }}
                  >
                    <Text style={styles.infoLabel}>Gender</Text>
                    <Text style={styles.infoValue}>{userData.gender}</Text>
                  </Pressable>
                )}
                {userData.height && (
                  <Pressable
                    style={styles.infoCard}
                    onLongPress={() => handleCopy(String(userData.height), 'Height')}
                    android_ripple={{ color: '#E0E0E0' }}
                  >
                    <Text style={styles.infoLabel}>Height</Text>
                    <Text style={styles.infoValue}>{userData.height}</Text>
                  </Pressable>
                )}
                {userData.weight && (
                  <Pressable
                    style={styles.infoCard}
                    onLongPress={() => handleCopy(String(userData.weight), 'Weight')}
                    android_ripple={{ color: '#E0E0E0' }}
                  >
                    <Text style={styles.infoLabel}>Weight</Text>
                    <Text style={styles.infoValue}>{userData.weight}</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Raw Data Section (for debugging) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Raw Data</Text>
              <Pressable
                style={styles.rawDataCard}
                onLongPress={() => handleCopy(JSON.stringify(userData, null, 2), 'Raw Data')}
                android_ripple={{ color: '#E0E0E0' }}
              >
                <Text style={styles.rawDataText}>
                  {JSON.stringify(userData, null, 2)}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No user data available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Nunito',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Nunito',
  },
  contentContainer: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    fontFamily: 'Nunito',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Nunito',
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    fontFamily: 'Nunito',
  },
  rawDataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rawDataText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Nunito',
  },
});

