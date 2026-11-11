import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { UnreachableScreen } from '@/components/unreachable';
import { Colors } from '@/constants/theme';
import { SessionProvider, useSession } from '@/state/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </SessionProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { status, role } = useSession();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const signedIn = status === 'signed-in';

  if (status === 'loading') return null;
  if (status === 'unreachable') return <UnreachableScreen />;

  const modal = (title: string) => ({
    presentation: 'modal' as const,
    headerShown: true,
    title,
    headerTintColor: colors.accent,
    headerStyle: { backgroundColor: colors.background },
    headerTitleStyle: { color: colors.text },
  });

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {/* Parents: plan, family, reports. */}
      <Stack.Protected guard={signedIn && role === 'parent'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="goal" options={modal('Goal')} />
        <Stack.Screen name="activity" options={modal('Activity')} />
        <Stack.Screen name="library" options={modal('Activity library')} />
        <Stack.Screen name="assign" options={modal('Assign activity')} />
        <Stack.Screen name="caregiver-edit" options={modal('Caregiver')} />
        <Stack.Screen name="caregiver/[id]" options={{ ...modal('Messages'), presentation: 'card' }} />
      </Stack.Protected>
      {/* Caregivers: their activities, chat with the parent, profile. */}
      <Stack.Protected guard={signedIn && role === 'caregiver'}>
        <Stack.Screen name="(caregiver)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="join" />
      </Stack.Protected>
    </Stack>
  );
}
