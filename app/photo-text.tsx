import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Image, TextInput, KeyboardAvoidingView, ScrollView, Keyboard } from 'react-native';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function PhotoTextScreen() {
  const [description, setDescription] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;

  function handleSubmit() {
    router.push({
      pathname: '/(tabs)',
      params: { photoUri, description, agentId: params.agentId, mode: 'photo-text' }
    });
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F5E6D3', '#E8D4C0', '#D5C4B3']}
        style={styles.gradient}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={28} color="#000" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.modeToggle}>
            <View style={styles.modeButton}>
              <Text style={styles.modeText}>photo</Text>
            </View>
            <View style={[styles.modeButton, styles.modeButtonActive]}>
              <Text style={[styles.modeText, styles.modeTextActive]}>photo+text</Text>
            </View>
          </View>

          <View style={styles.placeholder} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Typing"
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, !description && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!description}
              >
                <Text style={styles.submitButtonText}>Begin AI Analysis</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
              <Image
                source={{ uri: photoUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3',
  },
  gradient: {
    flex: 1,
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeButtonActive: {
    backgroundColor: '#E8D4C0',
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modeTextActive: {
    color: '#000',
  },
  placeholder: {
    width: 44,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  formContainer: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  charCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  inputWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    padding: 20,
    fontSize: 16,
    color: '#000',
    minHeight: 150,
    maxHeight: 200,
  },
  submitButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
});
