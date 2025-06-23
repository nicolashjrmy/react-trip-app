import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useApi } from '../../contexts/ApiContext';
import { Trip } from '../../types';

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const { apiCall } = useApi();

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/trips', { method: 'GET' });
      setTrips(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTrips();
    }, [])
  );

  const renderTrip = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => router.push(`/trip/${item.id}`)}
    >
      <View style={styles.tripHeader}>
        <Text style={styles.tripTitle}>{item.title}</Text>
        <Text style={styles.tripDestination}>{item.destination}</Text>
      </View>
      <Text style={styles.tripDescription}>{item.desc}</Text>
      <Text style={styles.tripDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTrips} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="earth-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySubtext}>Create your first trip to get started</Text>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push(`/trip/create`)}
            >
            <Text style={styles.addButtonText}>Add Trip</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      {trips.length > 0 && (
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/trip/create')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tripCard: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
tripDestination: {
  fontSize: 16,
  fontWeight: '500',
  color: '#28a745', // green for destination
  fontStyle: 'italic',
  maxWidth: 120,
  textAlign: 'right',
},
  tripDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tripDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },  
});