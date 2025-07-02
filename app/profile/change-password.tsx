import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const { apiCall } = useApi();

  const validatePasswords = (): string | null => {
    if (!currentPassword.trim()) {
      return 'Current password is required';
    }

    if (!newPassword.trim()) {
      return 'New password is required';
    }

    if (newPassword.length < 8) {
      return 'New password must be at least 8 characters long';
    }

    if (newPassword === currentPassword) {
      return 'New password must be different from current password';
    }

    if (newPassword !== confirmPassword) {
      return 'New password and confirmation do not match';
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validatePasswords();
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    try {
      setSaving(true);
      
      const changePasswordData = {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      };

      await apiCall('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify(changePasswordData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      Alert.alert(
        'Success',
        'Your password has been changed successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to change password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Check if there are any inputs
    const hasInputs = currentPassword || newPassword || confirmPassword;

    if (hasInputs) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to go back? Your changes will be lost.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            onPress: () => router.back(),
            style: 'destructive' 
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: '', color: '#ccc' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return { strength: score, text: 'Weak', color: '#FF3B30' };
    if (score <= 3) return { strength: score, text: 'Fair', color: '#FF9500' };
    if (score <= 4) return { strength: score, text: 'Good', color: '#FFCC00' };
    return { strength: score, text: 'Strong', color: '#34C759' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.headerButton, saving && styles.disabledButton]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
            <Text style={styles.infoText}>
              Choose a strong password to keep your account secure
            </Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showCurrentPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <View
                      key={bar}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor: bar <= passwordStrength.strength 
                            ? passwordStrength.color 
                            : '#e0e0e0'
                        }
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <View style={styles.matchIndicator}>
                <Ionicons 
                  name={newPassword === confirmPassword ? "checkmark-circle" : "close-circle"} 
                  size={16} 
                  color={newPassword === confirmPassword ? "#34C759" : "#FF3B30"} 
                />
                <Text style={[
                  styles.matchText, 
                  { color: newPassword === confirmPassword ? "#34C759" : "#FF3B30" }
                ]}>
                  {newPassword === confirmPassword ? "Passwords match" : "Passwords don't match"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Password Requirements */}
        <View style={styles.requirementsSection}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          <View style={styles.requirement}>
            <Ionicons 
              name={newPassword.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={newPassword.length >= 8 ? "#34C759" : "#666"} 
            />
            <Text style={[styles.requirementText, newPassword.length >= 8 && styles.requirementMet]}>
              At least 8 characters
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons 
              name={/[A-Z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/[A-Z]/.test(newPassword) ? "#34C759" : "#666"} 
            />
            <Text style={[styles.requirementText, /[A-Z]/.test(newPassword) && styles.requirementMet]}>
              One uppercase letter
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons 
              name={/[a-z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/[a-z]/.test(newPassword) ? "#34C759" : "#666"} 
            />
            <Text style={[styles.requirementText, /[a-z]/.test(newPassword) && styles.requirementMet]}>
              One lowercase letter
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons 
              name={/\d/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/\d/.test(newPassword) ? "#34C759" : "#666"} 
            />
            <Text style={[styles.requirementText, /\d/.test(newPassword) && styles.requirementMet]}>
              One number
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    marginRight: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '500',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  matchText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  requirementsSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 40,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  requirementMet: {
    color: '#34C759',
    fontWeight: '500',
  },
});