import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import CaptureScreen from '../screens/CaptureScreen';
import TranslateScreen from '../screens/TranslateScreen';
import StatsScreen from '../screens/StatsScreen';
import NarrativesScreen from '../screens/NarrativesScreen';
import BrandHeader from '../components/BrandHeader';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.foreground,
    border: colors.border,
    primary: colors.primary,
  },
};

function icon(label: string, focused: boolean) {
  const map: Record<string, string> = { Home: '⌂', Capture: '✎', Translate: '⇄', Narratives: '☰', Stats: '◔' };
  return (
    <View style={{
      minWidth: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      backgroundColor: focused ? colors.primary : 'transparent'
    }}>
      <Text style={{ color: focused ? colors.primaryForeground : colors.mutedForeground, fontSize: 14, fontWeight: '700' }}>
        {map[label] || '•'}
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          header: () => <BrandHeader subtitle={route.name === 'Home' ? 'Narok & Kajiado, Kenya' : 'Community Narrative Monitor'} />,
          headerStyle: { backgroundColor: colors.card },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 62, paddingBottom: 8, paddingTop: 6 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ focused }) => icon(route.name, focused),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Capture" component={CaptureScreen} options={{ title: 'Capture' }} />
        <Tab.Screen name="Translate" component={TranslateScreen} options={{ title: 'Translate' }} />
        <Tab.Screen name="Narratives" component={NarrativesScreen} options={{ title: 'Archive' }} />
        <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
