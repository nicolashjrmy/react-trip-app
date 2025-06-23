import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useApi } from '../../contexts/ApiContext';

export default function CreateTripScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const { apiCall } = useApi();

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a trip name');
      return;
    }

    try {
      setLoading(true);
        const response = await apiCall('/trips/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            title: name.trim(),
            desc: description.trim(),
            destination: destination.trim(),
        }),
    });
      
      Alert.alert('Success', 'Trip created successfully', [
        { 
          text: 'OK', 
          onPress: () => {
            if (response.data?.id) {
              router.dismissAll();
              router.push(`/trip/${response.data.id}`);
            } else {
              router.dismissAll();
              router.push('/(tabs)/');
            }
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.dismissAll()
    router.replace('/(tabs)/');
  };

  return (
    <>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.form}>
            <Text style={styles.label}>Trip Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Weekend Getaway"
              maxLength={100}
            />

            <Text style={styles.label}>Destination</Text>
            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={setDestination}
              placeholder="e.g., Rumah Bapaklu"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's this trip about?"
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating...' : 'Create Trip'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
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
  }
});