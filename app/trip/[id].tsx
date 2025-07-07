import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useApi } from '../../contexts/ApiContext';
import { useAuth } from '../../contexts/AuthContext';
import { Expense, Following, ParticipantWithStatus, Trip } from '../../types';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [participants, setParticipants] = useState<ParticipantWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [followings, setFollowings] = useState<Following[]>([]);
  const [inviteLink, setInviteLink] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  
  const { apiCall } = useApi();
  const { user } = useAuth();

  const fetchTrip = async () => {
    setTripLoading(true);
    try {
      const response = await apiCall(`/trips/${id}`, { method: 'GET' });
      if (response.data?.isComplete === true) {
        router.replace(`./complete?id=${id}`);
        return;
      }
      setTrip(response.data);
    } finally {
      setTripLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      if (!trip) return;
      
      const response = await apiCall(`/trips/participant/${id}`, { method: 'GET' });
      if (response.data) {
        setParticipants(response.data);
      } else {
        let participantNames: string[] = [];
        if (Array.isArray(trip.participant)) {
          participantNames = trip.participant;
        } else if (typeof trip.participant === 'string') {
          try {
            participantNames = JSON.parse(trip.participant);
          } catch {
            participantNames = [];
          }
        }
        setParticipants(participantNames.map(name => ({ id: 0, name, username: name })));
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const fetchFollowings = async () => {
    try {
      const response = await apiCall('/users/profile/following', { method: 'GET' });
      setFollowings(response.data || []);
    } catch (error) {
      console.error('Error fetching followings:', error);
    }
  };

  const generateInviteLink = async () => {
    try {
      setLoadingInvite(true);
      const response = await apiCall(`/trips/${id}/invite-link`, { method: 'POST' });
      setInviteLink(response.data.inviteLink);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invite link');
    } finally {
      setLoadingInvite(false);
    }
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

  useEffect(() => {
    if (id) {
      fetchTrip();
      fetchExpenses();
    }
  }, [id]);

  useEffect(() => {
    if (trip) {
      fetchParticipants();
    }
  }, [trip]);

  const handleInviteFollowing = async (following: Following) => {
    try {
      await apiCall(`/trips/${id}/add-participant`, {
        method: 'POST',
        body: JSON.stringify({
          userId: [following.id]
        })
      });
      Alert.alert('Success', `Invitation sent to ${following.name}`);
      fetchParticipants(); // Refresh participants list
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
    }
  };

  const handleShareInviteLink = async () => {
    if (!inviteLink) {
      await generateInviteLink();
      return;
    }

    try {
      await Share.share({
        message: `Join my trip "${trip?.title}" on our expense sharing app! Use this link: ${inviteLink}`,
        url: inviteLink,
        title: `Join ${trip?.title}`,
      });
    } catch (error) {
      console.error('Error sharing invite link:', error);
    }
  };

  const handleRemoveParticipant = async (participantId: number) => {
    if (user?.id !== trip?.createdBy) {
      Alert.alert('Error', 'Only trip creator can remove participants');
      return;
    }

    Alert.alert(
      'Remove Participant',
      'Are you sure you want to remove this participant from the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiCall(`/trips/${id}/remove-participant`, { 
                method: 'POST',
        body: JSON.stringify({
          userId: [participantId]
        })               
              });
              fetchParticipants();
              Alert.alert('Success', 'Participant removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove participant');
            }
          }
        }
      ]
    );
  };

  if (tripLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading trip...</Text>
      </View>
    );
  }

  const handleCompleteTrip = async () => {
    Alert.alert(
      'Complete Trip',
      'Are you sure you want to complete this trip? This action cannot be undone and will calculate final settlements.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              await apiCall(`/trips/complete/${id}`, { method: 'PUT' });
              Alert.alert('Success', 'Trip completed successfully!', [
                {
                  text: 'OK',
                  onPress: () => router.push(`./complete?id=${id}`)
                }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to complete trip');
            }
          }
        }
      ]
    );
  };

  const handleExpensePress = (expenseId: number) => {
    router.push(`./expense-detail?tripId=${id}&expenseId=${expenseId}`);
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
      <TouchableOpacity 
        style={styles.expenseCard}
        onPress={() => handleExpensePress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseName}>{item.name}</Text>
          <Text style={styles.expenseAmount}>Rp {item.amount.toFixed()}</Text>
        </View>
        {item.desc && (
          <Text style={styles.expenseDescription}>{item.desc}</Text>
        )}
        <Text style={styles.expensePaidBy}>Paid by: {item.paidBy}</Text>
        <View style={styles.expenseParticipantsRow}>
          <Text style={styles.expenseParticipants}>
            Total Participants: {item.countParticipant}
          </Text>
          <View style={styles.expenseFooter}>
            <Text style={styles.tapToViewText}>more details</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderParticipant = ({ item }: { item: ParticipantWithStatus }) => (
    <View style={styles.participantCard}>
      <View style={styles.participantInfo}>
        <View style={styles.participantAvatar}>
          <Text style={styles.participantAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.participantDetails}>
          <Text style={styles.participantName}>{item.name}</Text>
          <Text style={styles.participantUsername}>@{item.username}</Text>
          {item.isInvited && !item.joinedAt && (
            <Text style={styles.participantStatus}>Invited</Text>
          )}
        </View>
      </View>
      {user?.id === trip?.createdBy && item.id !== user?.id && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveParticipant(item.id)}
        >
          <Ionicons name="close" size={16} color="#ff4444" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFollowing = ({ item }: { item: Following }) => {
    const isAlreadyParticipant = participants.some(p => p.id === item.id);
    
    return (
      <View style={styles.followingCard}>
        <View style={styles.participantInfo}>
          <View style={styles.participantAvatar}>
            <Text style={styles.participantAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.participantDetails}>
            <Text style={styles.participantName}>{item.name}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.inviteButton, isAlreadyParticipant && styles.inviteButtonDisabled]}
          onPress={() => handleInviteFollowing(item)}
          disabled={isAlreadyParticipant}
        >
          <Text style={[styles.inviteButtonText, isAlreadyParticipant && styles.inviteButtonTextDisabled]}>
            {isAlreadyParticipant ? 'Added' : 'Invite'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: trip ? trip.title + ' Details' : 'Trip Details',
          headerRight: () => (
            trip && user?.id === trip.createdBy ? (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleCompleteTrip}
              >
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
            ) : null
          ),
        }}
      />
      
      <View style={styles.container}>
        {/* Participants Section */}
        <View style={styles.participantsSection}>
          <TouchableOpacity
            style={styles.participantsHeader}
            onPress={() => setShowParticipantsModal(true)}
          >
            <View style={styles.participantsHeaderLeft}>
              <Ionicons name="people" size={20} color="#007AFF" />
              <Text style={styles.participantsTitle}>
                Participants ({participants.length})
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.participantsPreview}>
            {participants.slice(0, 5).map((participant, index) => (
              <View key={participant.id.toString()} style={styles.participantPreview}>
                <View style={styles.participantPreviewAvatar}>
                  <Text style={styles.participantPreviewText}>
                    {participant.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.participantPreviewName} numberOfLines={1}>
                  {participant.name}
                </Text>
              </View>
            ))}
            {participants.length > 5 && (
              <View style={styles.participantPreview}>
                <View style={styles.participantPreviewAvatar}>
                  <Text style={styles.participantPreviewText}>+{participants.length - 5}</Text>
                </View>
              </View>
            )}
          </ScrollView>
          
          {user?.id === trip?.createdBy && (
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => {
                setShowInviteModal(true);
                fetchFollowings();
              }}
            >
              <Ionicons name="person-add" size={16} color="white" />
              <Text style={styles.inviteButtonText}>Invite Participants</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Expenses List */}
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

        {/* Participants Modal */}
        <Modal
          visible={showParticipantsModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Participants</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowParticipantsModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={participants}
              renderItem={renderParticipant}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Modal>

        {/* Invite Modal */}
        <Modal
          visible={showInviteModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Participants</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowInviteModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Invite Link Section */}
            <View style={styles.inviteLinkSection}>
              <Text style={styles.sectionTitle}>Invite by Link</Text>
              <TouchableOpacity
                style={styles.shareLinkButton}
                onPress={handleShareInviteLink}
                disabled={loadingInvite}
              >
                {loadingInvite ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="share" size={16} color="white" />
                    <Text style={styles.shareLinkText}>Share Invite Link</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Followings Section */}
            <View style={styles.followingsSection}>
              <Text style={styles.sectionTitle}>Invite from Followings</Text>
              <FlatList
                data={followings}
                renderItem={renderFollowing}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyFollowings}>
                    <Text style={styles.emptyText}>No followings found</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
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
  
  participantsSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  participantsPreview: {
    marginBottom: 16,
  },
  participantPreview: {
    alignItems: 'center',
    marginRight: 12,
    width: 60,
  },
  participantPreviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantPreviewText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  participantPreviewName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // Expense styles (existing)
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
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tapToViewText: {
    fontSize: 11,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  expenseParticipantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  
  // Participant card styles
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  participantUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  participantStatus: {
    fontSize: 12,
    color: '#ff9500',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  
  // Invite section styles
  inviteLinkSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  shareLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  shareLinkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  
  // Followings section
  followingsSection: {
    flex: 1,
    padding: 16,
  },
  followingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  inviteButtonDisabled: {
    backgroundColor: '#ccc',
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  inviteButtonTextDisabled: {
    color: '#999',
  },
  
  // Empty states
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
  emptyFollowings: {
    padding: 20,
    alignItems: 'center',
  },
  
  // Other styles
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