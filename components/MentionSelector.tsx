import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface Agent {
  id: string;
  name: string;
  avatarUrl: string;
}

const AGENTS: Agent[] = [
  { id: 'feces', name: 'Feces', avatarUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profilefeces.png' },
  { id: 'stress', name: 'Stress', avatarUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profilestress.png' },
  { id: 'sleep', name: 'Sleep', avatarUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profilesleep.png' },
  { id: 'posture', name: 'Posture', avatarUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profileposture.png' },
  { id: 'face', name: 'Face', avatarUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profileface.png' },
  { id: 'energy', name: 'Energy', avatarUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profileenergy.png' },
];

interface MentionSelectorProps {
  visible: boolean;
  onSelect: (agentName: string) => void;
  onDismiss: () => void;
  inputBarBottom: number;
}

export function MentionSelector({ visible, onSelect, onDismiss, inputBarBottom }: MentionSelectorProps) {
  if (!visible) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      />
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={[styles.container, { bottom: inputBarBottom + 60 }]}
      >
        {AGENTS.map((agent, index) => (
          <Animated.View
            key={agent.id}
            entering={FadeIn.delay(index * 40).duration(200)}
            exiting={FadeOut.duration(150)}
          >
            <TouchableOpacity
              style={styles.agentChip}
              onPress={() => onSelect(agent.name)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: agent.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
              <Text style={styles.agentName}>{agent.name}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9998,
    elevation: 998,
  },
  container: {
    position: 'absolute',
    left: 20,
    flexDirection: 'column-reverse',
    gap: 10,
    zIndex: 9999,
    elevation: 999,
  },
  agentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 100,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  agentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
