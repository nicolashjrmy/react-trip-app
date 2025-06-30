import { Follower, Following, Profile } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
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

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams(); // Get user ID from route params
  const [following, setFollowing] = useState<Following[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { apiCall } = useApi();

  const targetUserId = parseInt(id as string);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/users/${targetUserId}`, { method: 'GET' });
      setProfile(response.data || null);
      setIsFollowing(response.data?.isFollowing || false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/users/${targetUserId}/followers`, { method: 'GET' });
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
      const response = await apiCall(`/users/${targetUserId}/following`, { method: 'GET' });
      setFollowing(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load following');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      setFollowLoading(true);
      await apiCall(`/users/follow/${targetUserId}`, { method: 'POST' });
      setIsFollowing(true);
      if (profile) {
        setProfile({
          ...profile,
          followers: (profile.followers || 0) + 1
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to follow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    try {
      setFollowLoading(true);
      await apiCall(`/users/unfollow/${targetUserId}`, { method: 'POST' });
      setIsFollowing(false);
      if (profile) {
        setProfile({
          ...profile,
          followers: Math.max((profile.followers || 0) - 1, 0)
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unfollow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUserItemPress = (user: Following | Follower) => {
    router.push(`/profile/${user.id}`);
  };

  const handleBackPress = () => {
    router.back();
  };

  React.useEffect(() => {
    if (targetUserId) {
      fetchProfile();
    }
  }, [targetUserId]);

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
    <>
    <Stack.Screen
        options={{
          title: profile ? profile.username + ' Profile' : 'Profile'
        }}
      />
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={50} color="#007AFF" />
        </View>
        <Text style={styles.name}>{profile?.username || 'User'}</Text>
        <Text style={styles.email}>{profile?.email || 'email@example.com'}</Text>
        
        {/* Follow/Unfollow Button */}
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing ? styles.followingButton : styles.followButton
          ]}
          onPress={isFollowing ? handleUnfollow : handleFollow}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? "#007AFF" : "#fff"} />
          ) : (
            <>
              <Ionicons 
                name={isFollowing ? "checkmark" : "add"} 
                size={16} 
                color={isFollowing ? "#007AFF" : "#fff"} 
              />
              <Text style={[
                styles.followButtonText,
                isFollowing ? styles.followingButtonText : styles.followButtonText
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
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
    </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    flex: 1,
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
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
    minWidth: 100,
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  followingButtonText: {
    color: '#007AFF',
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