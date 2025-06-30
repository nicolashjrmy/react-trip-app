import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApi } from '../../contexts/ApiContext';
import { Expense, Trip } from '../../types';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const { apiCall } = useApi();

  useEffect(() => {
    if (id) {
      fetchTrip();
      fetchExpenses();
    }
  }, [id]);

  const fetchTrip = async () => {
    const response = await apiCall(`/trips/${id}`, { method: 'GET' });
    setTrip(response.data);
  };


  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/trip-details/${id}`, { method: 'GET' });
      setExpenses(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

const renderExpense = ({ item }: { item: Expense }) => {
  let participants: number[] = [];
  if (typeof item.participants === 'string') {
    try {
      participants = JSON.parse(item.participants);
    } catch {
      participants = [];
    }
  } else {
    participants = item.participants;
  }

  return (
    
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseName}>{item.name}</Text>
        <Text style={styles.expenseAmount}>Rp {item.amount.toFixed()}</Text>
      </View>
      {item.desc && (
        <Text style={styles.expenseDescription}>{item.desc}</Text>
      )}
      <Text style={styles.expensePaidBy}>Paid by: User {item.paidBy}</Text>
      <Text style={styles.expenseParticipants}>
        Participants: {participants.join(', ')}
      </Text>
    </View>
  );
};

  return (
    <>
        <Stack.Screen
        options={{
          title: trip ? trip.title + ' Details' : 'Trip Details'
        }}
      />
      <View style={styles.container}>
        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={(item) => item.id.toString()}
          refreshing={loading}
          onRefresh={fetchExpenses}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push(`./add-expense?tripId=${id}`)}
              >
                <Text style={styles.addButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {expenses.length > 0 && (
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push(`./add-expense?tripId=${id}`)}
            >
            <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  expenseCard: {
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
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#28a745',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  expensePaidBy: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  expenseParticipants: {
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
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
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
  headerButton: {
    padding: 8,
  },
});