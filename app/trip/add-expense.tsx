import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
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

export default function AddExpenseScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [participants, setParticipants] = useState('');
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [customSplits, setCustomSplits] = useState('');
  const [additionalFees, setAdditionalFees] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { apiCall } = useApi();
  const { user } = useAuth();

  // Set default values when component mounts
  React.useEffect(() => {
    if (user?.id) {
      setPaidBy(user.id.toString());
      setParticipants(`[${user.id}]`);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!name.trim() || !amount || !paidBy || !participants) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    let participantsArray;
    try {
      participantsArray = JSON.parse(participants);
      if (!Array.isArray(participantsArray)) {
        throw new Error('Participants must be an array');
      }
    } catch (e) {
      Alert.alert('Error', 'Invalid participants format. Use format: [1, 2, 3]');
      return;
    }

    const body: any = {
      name: name.trim(),
      desc: description.trim(),
      amount: parseFloat(amount),
      paidBy: parseInt(paidBy),
      participants: participantsArray,
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
      await apiCall(`/trips/${tripId}/details`, {
        method: 'POST',
        body,
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Expense',
          presentation: 'modal',
          headerShown: true
        }}
      />
      
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

            <Text style={styles.label}>Paid By (User ID) *</Text>
            <TextInput
              style={styles.input}
              value={paidBy}
              onChangeText={setPaidBy}
              placeholder={user?.id?.toString() || "1"}
              keyboardType="numeric"
              returnKeyType="done"
            />

            <Text style={styles.label}>Participants (JSON Array) *</Text>
            <TextInput
              style={styles.input}
              value={participants}
              onChangeText={setParticipants}
              placeholder='[1, 2, 3]'
              multiline
            />

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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  }
});