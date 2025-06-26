import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useApi } from '../../contexts/ApiContext';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  name: string;
}

export default function AddExpenseScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<number | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [customSplits, setCustomSplits] = useState('');
  const [additionalFees, setAdditionalFees] = useState('');
  const [loading, setLoading] = useState(false);
  
  // User data and modal states
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showPaidByModal, setShowPaidByModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  
  const { apiCall } = useApi();
  const { user } = useAuth();

  // Fetch users for the trip
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await apiCall(`/trips/participant/${tripId}`);
        setUsers(response.data || []);
        
        // Set default values if current user is in the list
        if (user?.id) {
          const currentUser = response.data?.find((u: User) => u.id === user.id);
          if (currentUser) {
            setSelectedParticipants([user.id]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        Alert.alert('Error', 'Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };

    if (tripId) {
      fetchUsers();
    }
  }, [tripId, user?.id]);

  const getUserName = (userId: number) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : `User ${userId}`;
  };

  const handleParticipantToggle = (userId: number) => {
    setSelectedParticipants(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!name.trim() || !amount || paidBy === null || selectedParticipants.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const body: any = {
      name: name.trim(),
      desc: description.trim(),
      amount: parseFloat(amount),
      paidBy: paidBy,
      participants: JSON.stringify(selectedParticipants),
      splitType: isCustomSplit ? 'custom' : 'equal',
    };

    if (isCustomSplit) {
      if (customSplits) {
        try {
          body.customSplits = JSON.parse(customSplits);
        } catch (e) {
          Alert.alert('Error', 'Invalid custom splits format');
          return;
        }
      }
      
      if (additionalFees) {
        try {
          body.additionalFees = JSON.parse(additionalFees);
        } catch (e) {
          Alert.alert('Error', 'Invalid additional fees format');
          return;
        }
      }
    }

    try {
      setLoading(true);
      
      await apiCall(`/trip-details/create/${tripId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      Alert.alert('Success', 'Expense added successfully', [
        { text: 'OK', onPress: () => router.dismiss() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item, isPaidBy = false }: { item: User; isPaidBy?: boolean }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        isPaidBy 
          ? (paidBy === item.id ? styles.selectedUserItem : {})
          : (selectedParticipants.includes(item.id) ? styles.selectedUserItem : {})
      ]}
      onPress={() => {
        if (isPaidBy) {
          setPaidBy(item.id);
          setShowPaidByModal(false);
        } else {
          handleParticipantToggle(item.id);
        }
      }}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
      {!isPaidBy && (
        <View style={[
          styles.checkbox,
          selectedParticipants.includes(item.id) && styles.checkedBox
        ]}>
          {selectedParticipants.includes(item.id) && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loadingUsers) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.form}>
            <Text style={styles.label}>Expense Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Dinner at Restaurant"
              maxLength={100}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              multiline
              maxLength={500}
            />

            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              returnKeyType="done"
            />

            <Text style={styles.label}>Paid By *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowPaidByModal(true)}
            >
              <Text style={styles.dropdownText}>
                {paidBy ? getUserName(paidBy) : 'Select who paid'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Participants *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowParticipantsModal(true)}
            >
              <Text style={styles.dropdownText}>
                {selectedParticipants.length > 0 
                  ? `${selectedParticipants.length} participant(s) selected`
                  : 'Select participants'
                }
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {selectedParticipants.length > 0 && (
              <View style={styles.selectedParticipants}>
                <Text style={styles.selectedLabel}>Selected participants:</Text>
                {selectedParticipants.map(userId => (
                  <Text key={userId} style={styles.participantChip}>
                    {getUserName(userId)}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Custom Split</Text>
              <Switch
                value={isCustomSplit}
                onValueChange={setIsCustomSplit}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isCustomSplit ? '#007AFF' : '#f4f3f4'}
              />
            </View>

            {isCustomSplit && (
              <>
                <Text style={styles.label}>Custom Splits (JSON)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={customSplits}
                  onChangeText={setCustomSplits}
                  placeholder='[{"userId": 1, "name": "item1", "amount": 20}]'
                  multiline
                />

                <Text style={styles.label}>Additional Fees (JSON)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={additionalFees}
                  onChangeText={setAdditionalFees}
                  placeholder='[{"name": "service", "amount": 5}]'
                  multiline
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Expense'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.dismiss()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Paid By Modal */}
      <Modal
        visible={showPaidByModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaidByModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Who paid?</Text>
              <TouchableOpacity onPress={() => setShowPaidByModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={users}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => renderUserItem({ item, isPaidBy: true })}
              style={styles.userList}
            />
          </View>
        </View>
      </Modal>

      {/* Participants Modal */}
      <Modal
        visible={showParticipantsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowParticipantsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Participants</Text>
              <TouchableOpacity onPress={() => setShowParticipantsModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={users}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => renderUserItem({ item, isPaidBy: false })}
              style={styles.userList}
            />
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowParticipantsModal(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  selectedParticipants: {
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  participantChip: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: 6,
    marginRight: 8,
    marginBottom: 4,
    borderRadius: 12,
    fontSize: 14,
    alignSelf: 'flex-start',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 18,
    color: '#666',
    padding: 4,
  },
  userList: {
    maxHeight: 300,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedUserItem: {
    backgroundColor: '#e3f2fd',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});