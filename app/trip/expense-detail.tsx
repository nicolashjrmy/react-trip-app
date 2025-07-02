import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useApi } from '../../contexts/ApiContext';

interface ExpenseDetail {
  id: number;
  detailId: number;
  userId: number;
  owed: number;
  isPaid: boolean;
  item: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
  };
}

interface ExpenseReport {
  id: number;
  tripId: number;
  name: string;
  desc: string;
  amount: number;
  paidBy: number;
  participants: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  details: ExpenseDetail[];
}

export default function ExpenseDetailScreen() {
  const { tripId, expenseId } = useLocalSearchParams<{ 
    tripId: string; 
    expenseId: string; 
  }>();
  const [expenseReport, setExpenseReport] = useState<ExpenseReport | null>(null);
  const [loading, setLoading] = useState(false);
  const { apiCall } = useApi();

  useEffect(() => {
    if (tripId && expenseId) {
      fetchExpenseReport();
    }
  }, [tripId, expenseId]);

  const fetchExpenseReport = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/trips/${tripId}/report`, { method: 'GET' });
      
      const targetExpense = response.data.find(
        (expense: ExpenseReport) => expense.id.toString() === expenseId
      );
      
      if (targetExpense) {
        setExpenseReport(targetExpense);
      } else {
        Alert.alert('Error', 'Expense not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  const renderParticipantDetail = ({ item }: { item: ExpenseDetail }) => (
    <View style={styles.participantCard}>
      <View style={styles.participantHeader}>
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>{item.user.name}</Text>
          <Text style={styles.participantItem}>{item.item}</Text>
        </View>
        <View style={styles.participantAmount}>
          <Text style={styles.owedAmount}>Rp {item.owed.toLocaleString()}</Text>
          <View style={[
            styles.statusBadge, 
            item.isPaid ? styles.paidBadge : styles.unpaidBadge
          ]}>
            <Text style={[
              styles.statusText,
              item.isPaid ? styles.paidText : styles.unpaidText
            ]}>
              {item.isPaid ? 'Paid' : 'Unpaid'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getTotalOwed = () => {
    if (!expenseReport) return 0;
    return expenseReport.details.reduce((total, detail) => total + detail.owed, 0);
  };

  const getPaidAmount = () => {
    if (!expenseReport) return 0;
    return expenseReport.details
      .filter(detail => detail.isPaid)
      .reduce((total, detail) => total + detail.owed, 0);
  };

  const getUnpaidAmount = () => {
    return getTotalOwed() - getPaidAmount();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading expense details...</Text>
      </View>
    );
  }

  if (!expenseReport) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${expenseReport.name} - Split Details`
        }}
      />
      <View style={styles.container}>
        {/* Expense Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.expenseName}>{expenseReport.name}</Text>
          {expenseReport.desc && (
            <Text style={styles.expenseDescription}>{expenseReport.desc}</Text>
          )}
          <Text style={styles.totalAmount}>Total: Rp {expenseReport.amount.toLocaleString()}</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Paid</Text>
              <Text style={[styles.summaryValue, styles.paidColor]}>
                Rp {getPaidAmount().toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Unpaid</Text>
              <Text style={[styles.summaryValue, styles.unpaidColor]}>
                Rp {getUnpaidAmount().toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Participants List */}
        <View style={styles.participantsHeader}>
          <Text style={styles.participantsTitle}>Split Details</Text>
          <Text style={styles.participantsCount}>
            {expenseReport.details.length} participant(s)
          </Text>
        </View>

        <FlatList
          data={expenseReport.details}
          renderItem={renderParticipantDetail}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  expenseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  paidColor: {
    color: '#28a745',
  },
  unpaidColor: {
    color: '#dc3545',
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  participantsCount: {
    fontSize: 14,
    color: '#666',
  },
  participantCard: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  participantItem: {
    fontSize: 12,
    color: '#666',
  },
  participantAmount: {
    alignItems: 'flex-end',
  },
  owedAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  paidBadge: {
    backgroundColor: '#d4edda',
  },
  unpaidBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  paidText: {
    color: '#155724',
  },
  unpaidText: {
    color: '#721c24',
  },
});