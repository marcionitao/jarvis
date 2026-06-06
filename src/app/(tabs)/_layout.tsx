// src/app/(tabs)/_layout.tsx
// Bottom tab navigator: Hoje, Agenda, +, Pesquisar, Projetos
// Tab central "+" é um tab fantasma (raised) que abre Quick Add modal.
// Padrão barmittel: tabBarIcon: () => null + tabBarButton: () => <CentralFab />.

import { Tabs, useRouter } from 'expo-router';
import { View, Pressable, ToastAndroid, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';

function CentralFab() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ top: -6, justifyContent: 'center', alignItems: 'center' }}>
      <Pressable
        onPress={() => void router.push('/quick-add' as never)}
        onLongPress={() => {
          if (Platform.OS === 'android') ToastAndroid.show('Em breve', ToastAndroid.SHORT);
        }}
        delayLongPress={400}
        onPressIn={() => { scale.value = withTiming(0.94, { duration: 100 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 200 }); }}
        accessibilityRole="button"
        accessibilityLabel={t('task.create')}
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 6,
        }}
      >
        <Animated.View style={animatedStyle}>
          <Icon name="add" size={32} color="#ffffff" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useI18n();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
          elevation: 8,
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.today'),
          tabBarIcon: ({ color, size }) => <Icon name="today-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: t('tab.agenda'),
          tabBarIcon: ({ color, size }) => <Icon name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: () => <CentralFab />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tab.search'),
          tabBarIcon: ({ color, size }) => <Icon name="search-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: t('tab.projects'),
          tabBarIcon: ({ color, size }) => <Icon name="folder-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
