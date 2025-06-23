import { Stack } from 'expo-router';
import { ApiProvider } from '../contexts/ApiContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <ApiProvider>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
          <Stack.Screen name="trip" />
        </Stack>
      </AuthProvider>
    </ApiProvider>
  );
}