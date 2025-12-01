import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AvatarCropModal from '../components/AvatarCropModal';
import { GenderPickerModal } from '../components/GenderPickerModal';
import { HeightPickerModal } from '../components/HeightPickerModal';
import api from '../src/services/api-clients/client';
import { API_ENDPOINTS } from '../src/services/api/api';
import userService from '../src/services/userService';
import storageManager from '../src/utils/storage';

export default function ProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [sex, setSex] = useState('');
  const [height, setHeight] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);

  // Load user info from API - use useCallback to make it reusable
  const loadUserInfo = useCallback(async () => {
    try {
      const result: any = await userService.getUserInfo();
      console.log('[Profile] getUserInfo result:', result);
      
      if (result?.success && result?.data) {
        const userData = result.data;
        console.log('[Profile] userData:', userData);
        console.log('[Profile] gender:', userData.gender, 'height:', userData.height);
        
        // 填充用户名
        if (userData.userName && userData.userName.trim() !== '') {
          setName(userData.userName);
        } else {
          setName('Unknown');
        }
        
        // 填充性别 - 确保正确映射 API 数据
        // 处理 null, undefined, 空字符串等情况
        if (userData.gender && String(userData.gender).trim() !== '') {
          // API 返回的 gender 可能是小写，直接使用
          setSex(String(userData.gender).trim());
        } else {
          console.log('[Profile] gender is empty or null, setting to Unknown');
          setSex('Unknown');
        }
        
        // 填充身高（格式化为 "xxx cm"）
        // 处理 null, undefined, 空字符串等情况
        if (userData.height !== null && userData.height !== undefined && String(userData.height).trim() !== '') {
          const heightStr = String(userData.height).trim();
          if (heightStr.includes('cm')) {
            setHeight(heightStr);
          } else {
            // 如果是纯数字，添加 " cm"
            setHeight(`${heightStr} cm`);
          }
        } else {
          console.log('[Profile] height is empty or null, setting to Unknown');
          setHeight('Unknown');
        }
        
        // 填充头像（如果有）
        if (userData.avatar) {
          setAvatarUri(userData.avatar);
        }
      } else {
        console.log('[Profile] getUserInfo failed or no data');
        // 如果获取失败，设置为 Unknown
        setName('Unknown');
        setSex('Unknown');
        setHeight('Unknown');
      }
    } catch (error) {
      console.error('[Profile] Failed to load user info:', error);
      // 如果出错，设置为 Unknown
      setName('Unknown');
      setSex('Unknown');
      setHeight('Unknown');
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadAvatar();
    loadUserInfo();
  }, [loadUserInfo]);

  // Reload data when page gains focus (e.g., returning from edit modal)
  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
    }, [loadUserInfo])
  );

  const loadAvatar = async () => {
    try {
      const savedAvatar = await storageManager.getItem('userAvatar');
      if (savedAvatar) {
        setAvatarUri(savedAvatar);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  const saveAvatar = async (uri: string) => {
    try {
      await storageManager.setItem('userAvatar', uri);
      setAvatarUri(uri);
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEditName = () => {
    // 如果 name 是 "Unknown"，则 tempValue 设置为空字符串
    if (name === 'Unknown') {
      setTempValue('');
    } else {
      setTempValue(name);
    }
    setEditingField('name');
  };

  // Convert gender format: 'male'/'female' -> 'Male'/'Female'/'Non-binary'/'Prefer not to say'
  const convertToGenderPickerFormat = (gender: string): 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say' => {
    if (gender.toLowerCase() === 'male') return 'Male';
    if (gender.toLowerCase() === 'female') return 'Female';
    if (gender.toLowerCase() === 'non-binary' || gender.toLowerCase() === 'nonbinary') return 'Non-binary';
    if (gender.toLowerCase() === 'prefer not to say' || gender.toLowerCase() === 'prefernottosay') return 'Prefer not to say';
    return 'Male'; // default
  };

  // Convert gender format: 'Male'/'Female'/'Non-binary'/'Prefer not to say' -> 'male'/'female'/'non-binary'/'prefer not to say'
  const convertFromGenderPickerFormat = (gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'): string => {
    return gender.toLowerCase();
  };

  // Format gender for display (capitalize first letter of each word)
  const formatGenderForDisplay = (gender: string): string => {
    if (!gender || gender === 'Unknown') return 'Unknown';
    // Handle special cases
    if (gender.toLowerCase() === 'prefer not to say' || gender.toLowerCase() === 'prefernottosay') {
      return 'Prefer not to say';
    }
    if (gender.toLowerCase() === 'non-binary' || gender.toLowerCase() === 'nonbinary') {
      return 'Non-binary';
    }
    // Capitalize first letter
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const handleEditSex = () => {
    setShowGenderPicker(true);
  };

  const handleGenderSave = async (newGender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say') => {
    try {
      // 准备更新数据，将 gender 转换为小写格式
      let updateData: any = {
        gender: convertFromGenderPickerFormat(newGender),
      };
      
      // 更新用户信息
      const updateResult: any = await userService.updateUserInfo(updateData);
      
      if (updateResult?.success) {
        // 重新从 API 加载数据，确保完全同步
        await loadUserInfo();
        Alert.alert('Success', 'Gender updated');
        setShowGenderPicker(false);
      } else {
        Alert.alert('Error', updateResult?.message || 'Failed to update gender');
      }
    } catch (error) {
      console.error('Error saving gender:', error);
      Alert.alert('Error', 'Error occurred while saving gender, please try again later');
    }
  };

  // Extract height in cm from string like "175 cm" or "175"
  const extractHeightInCm = (heightStr: string): number => {
    if (heightStr === 'Unknown' || heightStr === 'Unknown cm') {
      return 175; // default height
    }
    const match = heightStr.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 175; // default
  };

  const handleEditHeight = () => {
    setShowHeightPicker(true);
  };

  const handleHeightSave = async (newHeight: number) => {
    try {
      // 准备更新数据，height 以 cm 为单位，API expects string
      let updateData: any = {
        height: String(newHeight),
      };
      
      // 更新用户信息
      const updateResult: any = await userService.updateUserInfo(updateData);
      
      if (updateResult?.success) {
        // 重新从 API 加载数据，确保完全同步
        await loadUserInfo();
        Alert.alert('Success', 'Height updated');
        setShowHeightPicker(false);
      } else {
        Alert.alert('Error', updateResult?.message || 'Failed to update height');
      }
    } catch (error) {
      console.error('Error saving height:', error);
      Alert.alert('Error', 'Error occurred while saving height, please try again later');
    }
  };

  const handleSave = async () => {
    if (editingField === 'name') {
      // 如果值是 "Unknown"，不发送到服务器
      if (tempValue === 'Unknown' || tempValue.trim() === '') {
        Alert.alert('Tip', 'Please enter a valid name');
        return;
      }
      
      try {
        // 先获取用户信息，确保保留其他字段
        const userInfoResult: any = await userService.getUserInfo();
        
        // 准备更新数据，如果需要可以合并现有数据
        let updateData: any = {
          userName: tempValue,
        };
        
        // 如果成功获取到用户信息，可以合并其他字段（如果需要）
        if (userInfoResult?.success && userInfoResult?.data) {
          const currentUserData = userInfoResult.data;
          // 如果需要保留其他字段，可以在这里合并
          // 目前只更新 userName，所以直接使用上面的 updateData
        }
        
        // 更新用户信息
        const updateResult: any = await userService.updateUserInfo(updateData);
        
        if (updateResult?.success) {
          // 重新从 API 加载数据，确保完全同步
          await loadUserInfo();
          Alert.alert('Success', 'Name updated');
          setEditingField(null);
        } else {
          Alert.alert('Error', updateResult?.message || 'Failed to update name');
        }
      } catch (error) {
        console.error('Error saving name:', error);
        Alert.alert('Error', 'Error occurred while saving name, please try again later');
      }
    }
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  const handleAvatarPress = async () => {
    console.log("handle avatar pressed")
    // const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // if (status !== 'granted') {
    //   Alert.alert(
    //     'Photos Access Needed',
    //     'Photos access is needed to change your profile picture.',
    //     [
    //       { text: 'Cancel', style: 'cancel' },
    //       {
    //         text: 'Go to Settings',
    //         onPress: () => {
    //           if (Platform.OS === 'ios') {
    //             // iOS will show the system settings
    //           }
    //         },
    //       },
    //     ]
    //   );
    //   return;
    // }

    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: false,
    //   quality: 1,
    // });

    // if (!result.canceled && result.assets[0]) {
    //   setSelectedImageUri(result.assets[0].uri);
    //   setShowCropModal(true);
    // }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedImageUri(null);
  };

  const handleCropConfirm = async (croppedUri: string) => {
    await saveAvatar(croppedUri);
    setShowCropModal(false);
    setSelectedImageUri(null);
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
              // await userService.logout().catch(error => {
              //   console.warn('后端登出失败，继续清空本地数据:', error);
              // });
              // 清空本地用户数据和 accessToken
              await storageManager.clearAuthData();
              
              // 重置导航栈并跳转到登录页面
              // 使用 dismissAll 清除所有路由，然后 replace 到登录页面
              router.dismissAll();
              router.replace('/login');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Error occurred during logout, please try again');
            }
          },
        },
      ]
    );
  };

  const handleDeleteMiniApps = () => {
    Alert.alert(
      'Delete MiniApps',
      'This will delete all downloaded MiniApp files. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Profile] Starting to delete MiniApps...');
              
              const documentsDir = FileSystem.documentDirectory;
              const miniAppDir = `${documentsDir}MiniApp/`;
              
              // 检查 MiniApp 目录是否存在
              const dirInfo = await FileSystem.getInfoAsync(miniAppDir);
              
              if (dirInfo.exists && dirInfo.isDirectory) {
                // 删除整个 MiniApp 目录
                await FileSystem.deleteAsync(miniAppDir, { idempotent: true });
                console.log('[Profile] MiniApps deleted successfully');
                Alert.alert('Success', 'All MiniApps have been deleted.');
              } else {
                console.log('[Profile] MiniApp directory does not exist');
                Alert.alert('Info', 'No MiniApps found to delete.');
              }
            } catch (error: unknown) {
              console.error('[Profile] Failed to delete MiniApps:', error);
              Alert.alert(
                'Error',
                `Failed to delete MiniApps: ${error instanceof Error ? error.message : String(error)}`
              );
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
                  onPress: async () => {
                    try {
                      console.log('[Profile] Starting to delete account...');
                      
                      // 调用删除账户API
                      const response = await api.delete(API_ENDPOINTS.USER.DELETE_ACCOUNT);
                      console.log('[Profile] Delete account API response:', response);
                      
                      // 清空本地用户数据和 accessToken
                      await storageManager.clearAuthData();
                      
                      // 重置导航栈并跳转到登录页面
                      router.dismissAll();
                      router.replace('/login');
                    } catch (error: unknown) {
                      console.error('[Profile] Failed to delete account:', error);
                      Alert.alert(
                        'Failed to delete account',
                        error instanceof Error ? error.message : 'Error occurred while deleting account, please try again'
                      );
                    }
                  },
                },
              ]
            );
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
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarEmoji}>🦑</Text>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

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
                <Text style={styles.menuItemLabel}>Gender</Text>
                <Text style={styles.menuItemValue}>
                  {sex ? formatGenderForDisplay(sex) : 'Unknown'}
                </Text>
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
          <Text style={styles.sectionTitle}>Legal</Text>

          <View style={styles.card}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms-of-service')}>
              <Text style={styles.menuItemText}>Terms of Service</Text>
              <ChevronRight size={20} color="#666" strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy-policy')}>
              <Text style={styles.menuItemText}>Privacy Policy</Text>
              <ChevronRight size={20} color="#666" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MiniApp</Text>

          <View style={styles.card}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteMiniApps}>
              <Text style={styles.menuItemText}>Clear MiniApps</Text>
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
          <Text style={styles.versionText}>
            MonsterAI v{Constants.expoConfig?.version || '0.0.1'} (Beta)
          </Text>
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

      {selectedImageUri && (
        <AvatarCropModal
          visible={showCropModal}
          imageUri={selectedImageUri}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}

      {/* Gender Picker Modal */}
      <GenderPickerModal
        visible={showGenderPicker}
        initialGender={sex && sex !== 'Unknown' ? convertToGenderPickerFormat(sex) : 'Male'}
        onClose={() => setShowGenderPicker(false)}
        onSave={handleGenderSave}
      />

      {/* Height Picker Modal */}
      <HeightPickerModal
        visible={showHeightPicker}
        initialHeight={extractHeightInCm(height)}
        onClose={() => setShowHeightPicker(false)}
        onSave={handleHeightSave}
      />
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
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
