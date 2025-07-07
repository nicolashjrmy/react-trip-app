import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useApi } from '../../contexts/ApiContext';
import { useAuth } from '../../contexts/AuthContext';

interface Balance {
  id: number;
  name: string;
  paid: number;
  owed: number;
  net: number;
}

interface Transaction {
  id?: number;
  fromId: number;
  from: string;
  toId: number;
  to: string;
  amount: number;
  isPaid?: boolean;
}

interface SettlementData {
  balances: Balance[];
  transactions: Transaction[];
}

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

export default function TripSettlementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [expenseReport, setExpenseReport] = useState<ExpenseReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalancesModal, setShowBalancesModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const { apiCall } = useApi();
  const { user } = useAuth();
  const reportRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchSettlement();
      fetchExpenseReport()
    }
  }, [id]);

  const fetchExpenseReport = async () => {
    try {
      setReportLoading(true);
      const response = await apiCall(`/trips/${id}/report`, { method: 'GET' });
      setExpenseReport(response.data || []);
    } catch (error) {
      console.error('Error fetching expense report:', error);
      Alert.alert('Error', 'Failed to load expense report');
    } finally {
      setReportLoading(false);
    }
  };

  const fetchSettlement = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/trips/${id}/settlement`, { method: 'GET' });
      setSettlementData({
        balances: response.balances || [],
        transactions: response.transactions || []
      });
    } catch (error) {
      console.error('Error fetching settlement:', error);
      Alert.alert('Error', 'Failed to load settlement data');
    } finally {
      setLoading(false);
    }
  };

  const markPaymentAsPaid = async (transaction: Transaction, index: number) => {
    Alert.alert(
      'Mark Payment as Paid',
      `Are you sure you want to mark the payment from ${transaction.from} to ${transaction.to} (Rp ${transaction.amount.toLocaleString()}) as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              await apiCall(`/trips/${id}/settlement/pay`, {
                method: 'PUT',
                body: JSON.stringify({
                  from: transaction.from,
                  to: transaction.to,
                  amount: transaction.amount
                })
              });
              
              if (settlementData) {
                const updatedTransactions = [...settlementData.transactions];
                updatedTransactions[index] = { ...transaction, isPaid: true };
                setSettlementData({
                  ...settlementData,
                  transactions: updatedTransactions
                });
              }
              
              Alert.alert('Success', 'Payment marked as paid!');
            } catch (error) {
              console.error('Error marking payment as paid:', error);
              Alert.alert('Error', 'Failed to mark payment as paid');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSettlement();
    setRefreshing(false);
  };

  const shareReport = async () => {
    try {
      if (!reportRef.current) return;

  const uri = await captureRef(reportRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: Dimensions.get('window').width * 2,
  });

    await Sharing.shareAsync(uri, {
      dialogTitle: 'Share Expense Report',
    });
  } catch (error) {
    console.error('Share error:', error);
    Alert.alert('Error', 'Failed to share the report.');
  }
};


  const renderBalance = ({ item }: { item: Balance }) => (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <Text style={styles.userName}>{item.name}</Text>
        <View style={[
          styles.netBadge,
          item.net > 0 ? styles.positiveNet : item.net < 0 ? styles.negativeNet : styles.evenNet
        ]}>
          <Text style={[
            styles.netText,
            item.net > 0 ? styles.positiveText : item.net < 0 ? styles.negativeText : styles.evenText
          ]}>
            {item.net > 0 ? '+' : ''}Rp {item.net.toLocaleString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.balanceDetails}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Paid</Text>
          <Text style={styles.paidAmount}>Rp {item.paid.toLocaleString()}</Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Owed</Text>
          <Text style={styles.owedAmount}>Rp {item.owed.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  const renderTransaction = ({ item, index }: { item: Transaction; index: number }) => {
    const canMarkPaid = user && user.id == item.fromId
    const isPaid = item.isPaid || false;
    
    return (
      <View style={[styles.transactionCard, isPaid && styles.paidTransactionCard]}>
        <View style={styles.transactionContent}>
          <View style={styles.transactionFlow}>
            <Text style={styles.fromUser}>{item.from}</Text>
            <Ionicons name="arrow-forward" size={20} color="#666" style={styles.arrowIcon} />
            <Text style={styles.toUser}>{item.to}</Text>
          </View>
          <Text style={styles.transactionAmount}>Rp {item.amount.toLocaleString()}</Text>
        </View>
        
        {isPaid ? (
          <View style={styles.paidIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.paidText}>Paid</Text>
          </View>
        ) : (
          canMarkPaid && (
            <TouchableOpacity 
              style={styles.markPaidButton}
              onPress={() => markPaymentAsPaid(item, index)}
            >
              <Text style={styles.markPaidText}>Mark as Paid</Text>
            </TouchableOpacity>
          )
        )}
        
        {!canMarkPaid && !isPaid && (
          <Text style={styles.waitingText}>Waiting for payment confirmation</Text>
        )}
      </View>
    );
  };

  const getTotalOwed = () => {
    if (!settlementData) return 0;
    return settlementData.transactions.reduce((total, transaction) => total + transaction.amount, 0);
  };

  const BalancesModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={showBalancesModal}
      onRequestClose={() => setShowBalancesModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Individual Balances</Text>
          <TouchableOpacity onPress={() => setShowBalancesModal(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.modalSubtitle}>
            Net amount each person owes or is owed
          </Text>
          
          <FlatList
            data={settlementData?.balances || []}
            renderItem={renderBalance}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            style={styles.balancesList}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const ReportModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={showReportModal}
      onRequestClose={() => setShowReportModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Detailed Report</Text>
          <View style={styles.modalHeaderButtons}>
            <TouchableOpacity 
              style={styles.shareButton} 
              onPress={shareReport}
              disabled={reportLoading || expenseReport.length === 0}
            >
              <Ionicons name="share-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.modalContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
        <ViewShot ref={reportRef} options={{ format: 'jpg', quality: 1}} style={{ backgroundColor: '#fcfcfc' }}>
          {reportLoading ? (
            <View style={styles.reportLoadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading detailed report...</Text>
            </View>
          ) : (
            
            <View style={styles.reportSection}>
              <Text style={styles.reportSectionTitle}>💰 Expense Breakdown</Text>
              {expenseReport.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No expense data available</Text>
                </View>
              ) : (
                expenseReport.map((expense) => (
                  <View key={expense.id} style={styles.expenseCard}>
                    <View style={styles.expenseHeader}>
                      <Text style={styles.expenseName} numberOfLines={2}>{expense.name}</Text>
                      <Text style={styles.expenseAmount}>Rp {expense.amount.toLocaleString()}</Text>
                    </View>
                    
                    {expense.desc && (
                      <Text style={styles.expenseDescription} numberOfLines={3}>{expense.desc}</Text>
                    )}
                    
                    <Text style={styles.expenseDate}>
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </Text>
                    
                    <Text style={styles.expensePaidBy}>
                      Paid by: {expense.details.find(d => d.userId === expense.paidBy)?.user?.name || 'Unknown'}
                    </Text>
                    
                    <View style={styles.participantsList}>
                      <Text style={styles.participantsTitle}>Participants:</Text>
                      {expense.details.map(detail => (
                        <View key={`${detail.id}-${detail.userId}`} style={styles.participantItem}>
                          <View style={styles.participantInfo}>
                            <Text style={styles.participantName} numberOfLines={1}>{detail.user?.name || 'Unknown'}</Text>
                            <Text style={styles.participantItemText} numberOfLines={1}>{detail.item}</Text>
                          </View>
                          <View style={styles.participantAmount}>
                            <Text style={styles.participantOwed}>Rp {detail.owed.toLocaleString()}</Text>
                            <View style={[styles.statusBadge, detail.isPaid ? styles.paidBadge : styles.pendingBadge]}>
                              <Text style={[styles.statusText, detail.isPaid ? styles.paidStatusText : styles.pendingStatusText]}>
                                {detail.isPaid ? '✓ Paid' : '⏳ Pending'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ViewShot>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading settlement...</Text>
      </View>
    );
  }

  if (!settlementData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>No settlement data available</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Trip Settlement',
          headerRight: () => (
            <TouchableOpacity onPress={() => {
              setShowReportModal(true);
              if (expenseReport.length === 0) {
                fetchExpenseReport();
              }
            }}>
              <Ionicons name="receipt-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Settlement Summary</Text>
                <Text style={styles.summarySubtitle}>
                  Total to be settled: Rp {getTotalOwed().toLocaleString()}
                </Text>
                <Text style={styles.summaryDescription}>
                  {settlementData.transactions.length} payment(s) needed to settle all debts
                </Text>
              </View>

              {/* View Balances Button */}
              <TouchableOpacity 
                style={styles.viewBalancesButton}
                onPressOut={() => setShowBalancesModal(true)}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="people-outline" size={20} color="#007AFF" />
                  <Text style={styles.viewBalancesText}>View Individual Balances</Text>
                  <Ionicons name="chevron-forward" size={20} color="#007AFF" />
                </View>
              </TouchableOpacity>

              {/* Transactions Section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Required Payments</Text>
                <Text style={styles.sectionSubtitle}>
                  Optimized payments to settle all debts
                </Text>
              </View>
            </View>
          }
          data={settlementData.transactions}
          renderItem={renderTransaction}
          keyExtractor={(item, index) => `${item.from}-${item.to}-${index}`}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.noTransactionsContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#28a745" />
              <Text style={styles.noTransactionsText}>All settled!</Text>
              <Text style={styles.noTransactionsSubtext}>
                No payments needed - everyone is even
              </Text>
            </View>
          }
        />
      </View>

      <BalancesModal />
      <ReportModal />
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
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  summarySubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 14,
    color: '#666',
  },
  viewBalancesButton: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewBalancesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    flex: 1,
    marginLeft: 12,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  balanceCard: {
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
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  netBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  positiveNet: {
    backgroundColor: '#d4edda',
  },
  negativeNet: {
    backgroundColor: '#f8d7da',
  },
  evenNet: {
    backgroundColor: '#e2e3e5',
  },
  netText: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveText: {
    color: '#155724',
  },
  negativeText: {
    color: '#721c24',
  },
  evenText: {
    color: '#383d41',
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  paidAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#28a745',
  },
  owedAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc3545',
  },
  transactionCard: {
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
  paidTransactionCard: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  transactionContent: {
    marginBottom: 12,
  },
  transactionFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fromUser: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc3545',
    flex: 1,
  },
  arrowIcon: {
    marginHorizontal: 12,
  },
  toUser: {
    fontSize: 14,
    fontWeight: '500',
    color: '#28a745',
    flex: 1,
    textAlign: 'right',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  markPaidButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  markPaidText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  paidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  paidText: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  waitingText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  noTransactionsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTransactionsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#28a745',
    marginTop: 16,
  },
  noTransactionsSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    marginRight: 16,
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  balancesList: {
    flex: 1,
  },
  // Report Modal Styles
  reportLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  reportSection: {
    marginBottom: 24,
  },
  reportSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
  expenseCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  expensePaidBy: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    marginBottom: 12,
  },
  participantsList: {
    marginTop: 8,
  },
  participantsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 44,
  },
  participantInfo: {
    flex: 1,
    marginRight: 8,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  participantItemText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  participantAmount: {
    alignItems: 'flex-end',
  },
  participantOwed: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  paidBadge: {
    backgroundColor: '#d4edda',
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paidStatusText: {
    color: '#155724',
  },
  pendingStatusText: {
    color: '#856404',
  },
});