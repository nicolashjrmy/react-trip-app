import { Stack } from 'expo-router';
import { ApiProvider } from '../contexts/ApiContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <ApiProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="trip" />
        </Stack>
      </AuthProvider>
    </ApiProvider>
  );
}