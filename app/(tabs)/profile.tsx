import { Follower, Following, Profile } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApi } from '../../contexts/ApiContext';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [following, setFollowing] = useState<Following[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const { apiCall } = useApi();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/users/profile', { method: 'GET' });
      setProfile(response.data || null);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/users/profile/followers', { method: 'GET' });
      setFollowers(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/users/profile/following', { method: 'GET' });
      setFollowing(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load following');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  const handleUserItemPress = (user: Following | Follower) => {
    setShowFollowersModal(false)
    setShowFollowingModal(false)
    router.push(`/profile/${user.id}`);
  };

  useFocusEffect(
    React.useCallback(() => {
    fetchProfile();
    }, [])
  );

  const renderUserItem = ({ item }: { item: Following | Follower }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => handleUserItemPress(item)}
    >
      <View style={styles.userAvatar}>
        <Ionicons name="person" size={24} color="#007AFF" />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const renderModal = (visible: boolean, onClose: () => void, title: string, data: any[]) => (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        {data.length > 0 ? (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderUserItem}
            contentContainerStyle={styles.modalList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No {title.toLowerCase()} yet</Text>
          </View>
        )}
      </View>
    </Modal>
  );

  if (loading && !profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={50} color="#007AFF" />
        </View>
        <Text style={styles.name}>{profile?.username || 'User'}</Text>
        <Text style={styles.email}>{profile?.email || 'email@example.com'}</Text>
        
        {/* Followers/Following Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statItem} 
            onPress={() => {
              fetchFollowers();
              setShowFollowersModal(true);
            }}
          >
            <Text style={styles.statNumber}>{profile?.followers || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          
          <View style={styles.statDivider} />
          
          <TouchableOpacity 
            style={styles.statItem} 
            onPress={() => {
              fetchFollowing();
              setShowFollowingModal(true);
            }}
          >
            <Text style={styles.statNumber}>{profile?.following || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
        
        {loading && (
          <ActivityIndicator 
            size="small" 
            color="#007AFF" 
            style={styles.loadingIndicator} 
          />
        )}
      </View>

      {/* Menu Section */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={[styles.menuText, { color: '#FF3B30' }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderModal(
        showFollowersModal,
        () => setShowFollowersModal(false),
        'Followers',
        followers
      )}
      
      {renderModal(
        showFollowingModal,
        () => setShowFollowingModal(false),
        'Following',
        following
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  loadingIndicator: {
    marginTop: 10,
  },
  menuSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalList: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});