import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom - 2, 10) }]} pointerEvents="box-none">
      <View style={styles.tabBarContainer}>
        <BlurView intensity={100} tint="extraLight" style={StyleSheet.absoluteFill} />

        <View style={styles.borderOverlay} />

        <View style={styles.tabsWrapper}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel ?? options.title ?? route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const icon = options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? '#000000' : '#666666',
              size: 24,
            });

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.tabContent,
                  isFocused && styles.tabContentFocused
                ]}>
                  <View style={[
                    styles.iconContainer,
                    isFocused && styles.iconContainerFocused
                  ]}>
                    {icon}
                  </View>
                  <Text
                    style={[
                      styles.label,
                      isFocused && styles.labelFocused
                    ]}
                    numberOfLines={1}
                  >
                    {typeof label === 'string' ? label : route.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    paddingHorizontal: 8,
    width: '100%',
    maxWidth: 480,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    pointerEvents: 'none',
  },
  tabsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flex: 1,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  tabContentFocused: {
  },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    marginBottom: 2,
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
    opacity: 0.8,
    marginTop: 2,
  },
  labelFocused: {
    fontWeight: '700',
    color: '#000000',
    opacity: 1,
  },
});
