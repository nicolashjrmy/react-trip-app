import { Stack } from 'expo-router';
import { ApiProvider } from '../contexts/ApiContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ApiProvider>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
      <Stack.Screen 
        name="trip/[id]" 
        options={{ 
          headerShown: true,
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="trip/create" 
        options={{ 
          title: 'Create Trip',
          presentation: 'modal',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="trip/add-expense" 
        options={{ 
          title: 'Add Expense',
          presentation: 'modal',
          headerShown: true
        }}   
      />

      <Stack.Screen 
            name="profile/[id]" 
            options={{ 
              headerShown: true,
              headerBackTitle: 'Back'
            }} 
          />

            <Stack.Screen name="not_found" options={{ title: 'Not Found' }} />
        </Stack>
      </ApiProvider>
    </AuthProvider>
  );
}