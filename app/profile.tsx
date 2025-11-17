import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AvatarCropModal from '../components/AvatarCropModal';
import api from '../src/services/api-clients/client';
import { API_ENDPOINTS } from '../src/services/api/api';
import userService from '../src/services/userService';
import storageManager from '../src/utils/storage';

export default function ProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState('USER6VPTIXFW8');
  const [birthday, setBirthday] = useState('2003/10/17');
  const [sex, setSex] = useState('female');
  const [height, setHeight] = useState('171 cm');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempHeight, setTempHeight] = useState('171');

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  useEffect(() => {
    loadAvatar();
  }, []);

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
    setTempValue(name);
    setEditingField('name');
  };

  const handleEditSex = () => {
    setTempValue(sex);
    setEditingField('sex');
  };

  const handleEditHeight = () => {
    setTempHeight(height.replace(' cm', ''));
    setEditingField('height');
  };

  const handleSave = async () => {
    if (editingField === 'name') {
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
          setName(tempValue);
          Alert.alert('成功', '姓名已更新');
          setEditingField(null);
        } else {
          Alert.alert('错误', updateResult?.message || '更新姓名失败');
        }
      } catch (error) {
        console.error('保存姓名时出错:', error);
        Alert.alert('错误', '保存姓名时发生错误，请稍后重试');
      }
    } else if (editingField === 'sex') {
      try {
        // 先获取用户信息，确保保留其他字段
        const userInfoResult: any = await userService.getUserInfo();
        
        // 准备更新数据，将 sex 映射到 API 的 gender 字段
        let updateData: any = {
          gender: tempValue,
        };
        
        // 如果成功获取到用户信息，可以合并其他字段（如果需要）
        if (userInfoResult?.success && userInfoResult?.data) {
          const currentUserData = userInfoResult.data;
          // 如果需要保留其他字段，可以在这里合并
          // 目前只更新 gender，所以直接使用上面的 updateData
        }
        
        // 更新用户信息
        const updateResult: any = await userService.updateUserInfo(updateData);
        
        if (updateResult?.success) {
          setSex(tempValue);
          Alert.alert('成功', '性别已更新');
          setEditingField(null);
        } else {
          Alert.alert('错误', updateResult?.message || '更新性别失败');
        }
      } catch (error) {
        console.error('保存性别时出错:', error);
        Alert.alert('错误', '保存性别时发生错误，请稍后重试');
      }
    } else if (editingField === 'height') {
      try {
        // 先获取用户信息，确保保留其他字段
        const userInfoResult: any = await userService.getUserInfo();
        
        // 准备更新数据，将 tempHeight（纯数字）映射到 API 的 height 字段
        let updateData: any = {
          height: tempHeight,
        };
        
        // 如果成功获取到用户信息，可以合并其他字段（如果需要）
        if (userInfoResult?.success && userInfoResult?.data) {
          const currentUserData = userInfoResult.data;
          // 如果需要保留其他字段，可以在这里合并
          // 目前只更新 height，所以直接使用上面的 updateData
        }
        
        // 更新用户信息
        const updateResult: any = await userService.updateUserInfo(updateData);
        
        if (updateResult?.success) {
          setHeight(`${tempHeight} cm`);
          Alert.alert('成功', '身高已更新');
          setEditingField(null);
        } else {
          Alert.alert('错误', updateResult?.message || '更新身高失败');
        }
      } catch (error) {
        console.error('保存身高时出错:', error);
        Alert.alert('错误', '保存身高时发生错误，请稍后重试');
      }
    }
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Photos Access Needed',
        'Photos access is needed to change your profile picture.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                // iOS will show the system settings
              }
            },
          },
        ]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImageUri(result.assets[0].uri);
      setShowCropModal(true);
    }
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
                  onPress: async () => {
                    try {
                      console.log('[Profile] 开始删除账户...');
                      
                      // 调用删除账户API
                      const response = await api.delete(API_ENDPOINTS.USER.DELETE_ACCOUNT);
                      console.log('[Profile] 删除账户API响应:', response);
                      
                      // 清空本地用户数据和 accessToken
                      await storageManager.clearAuthData();
                      
                      // 重置导航栈并跳转到登录页面
                      router.dismissAll();
                      router.replace('/login');
                    } catch (error) {
                      console.error('[Profile] 删除账户失败:', error);
                      Alert.alert(
                        '删除账户失败',
                        error.message || '删除账户时发生错误，请重试'
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
                <Text style={styles.menuItemLabel}>Sex</Text>
                <Text style={styles.menuItemValue}>{sex.charAt(0).toUpperCase() + sex.slice(1)}</Text>
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

            {editingField === 'sex' && (
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[styles.optionButton, tempValue === 'male' && styles.optionButtonSelected]}
                  onPress={() => setTempValue('male')}
                >
                  <Text style={[styles.optionText, tempValue === 'male' && styles.optionTextSelected]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, tempValue === 'female' && styles.optionButtonSelected]}
                  onPress={() => setTempValue('female')}
                >
                  <Text style={[styles.optionText, tempValue === 'female' && styles.optionTextSelected]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {editingField === 'height' && (
              <View style={styles.singlePickerContainer}>
                <Text style={styles.pickerLabel}>Height (cm)</Text>
                <ScrollView style={styles.singlePickerScrollView} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 121 }, (_, i) => (120 + i).toString()).map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.pickerItem, h === tempHeight && styles.pickerItemSelected]}
                      onPress={() => setTempHeight(h)}
                    >
                      <Text style={[styles.pickerItemText, h === tempHeight && styles.pickerItemTextSelected]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  ))}
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

      {selectedImageUri && (
        <AvatarCropModal
          visible={showCropModal}
          imageUri={selectedImageUri}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
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
