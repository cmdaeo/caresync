import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import MedicationService from '../../services/MedicationService';
import AuthService from '../../services/AuthService';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [todaysMedications, setTodaysMedications] = useState([]);
  const [upcomingMedications, setUpcomingMedications] = useState([]);
  const [medicationStats, setMedicationStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const currentUser = await AuthService.getStoredUser();
      setUser(currentUser);

      // Load medication data
      const [todayData, upcomingData, statsData] = await Promise.allSettled([
        MedicationService.getTodaysMedications(),
        MedicationService.getUpcomingMedications(),
        MedicationService.getMedicationStatistics()
      ]);

      if (todayData.status === 'fulfilled') {
        setTodaysMedications(todayData.value);
      }

      if (upcomingData.status === 'fulfilled') {
        setUpcomingMedications(upcomingData.value);
      }

      if (statsData.status === 'fulfilled') {
        setMedicationStats(statsData.value);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error Loading Data',
        text2: 'Please check your connection and try again',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const markMedicationTaken = async (medicationId, medicationName) => {
    try {
      await MedicationService.markMedicationTaken(medicationId);
      
      // Update local state
      setTodaysMedications(prev => 
        prev.map(med => 
          med.id === medicationId 
            ? { ...med, status: 'taken', takenAt: new Date().toISOString() }
            : med
        )
      );

      Toast.show({
        type: 'success',
        text1: 'Great!',
        text2: `${medicationName} marked as taken`,
      });

    } catch (error) {
      console.error('Error marking medication as taken:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not mark medication as taken',
      });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading your medications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileButtonText}>
              {user?.firstName?.charAt(0) || 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{medicationStats.totalMedications || 0}</Text>
            <Text style={styles.statLabel}>Medications</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{medicationStats.takenToday || 0}</Text>
            <Text style={styles.statLabel}>Taken Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{medicationStats.adherenceRate || 0}%</Text>
            <Text style={styles.statLabel}>Adherence</Text>
          </View>
        </View>

        {/* Today's Medications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Medications</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Medications')}
              accessibilityRole="button"
              accessibilityLabel="View all medications"
            >
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>

          {todaysMedications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No medications scheduled for today
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddMedication')}
                accessibilityRole="button"
                accessibilityLabel="Add medication"
              >
                <Text style={styles.addButtonText}>Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.medicationList}>
              {todaysMedications.slice(0, 3).map((medication) => (
                <View key={medication.id} style={styles.medicationCard}>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                    <Text style={styles.medicationTime}>
                      Due at {formatTime(medication.scheduledTime)}
                    </Text>
                  </View>
                  <View style={styles.medicationActions}>
                    {medication.status === 'pending' && (
                      <TouchableOpacity
                        style={styles.takeButton}
                        onPress={() => markMedicationTaken(medication.id, medication.name)}
                        accessibilityRole="button"
                        accessibilityLabel={`Mark ${medication.name} as taken`}
                      >
                        <Text style={styles.takeButtonText}>Take</Text>
                      </TouchableOpacity>
                    )}
                    {medication.status === 'taken' && (
                      <View style={styles.takenBadge}>
                        <Text style={styles.takenBadgeText}>✓ Taken</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('AddMedication')}
              accessibilityRole="button"
              accessibilityLabel="Add new medication"
            >
              <Text style={styles.quickActionIcon}>💊</Text>
              <Text style={styles.quickActionText}>Add Medication</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Prescription')}
              accessibilityRole="button"
              accessibilityLabel="Upload prescription"
            >
              <Text style={styles.quickActionIcon}>📄</Text>
              <Text style={styles.quickActionText}>Upload Prescription</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Devices')}
              accessibilityRole="button"
              accessibilityLabel="Connect devices"
            >
              <Text style={styles.quickActionIcon}>📱</Text>
              <Text style={styles.quickActionText}>Connect Devices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Caregivers')}
              accessibilityRole="button"
              accessibilityLabel="Manage caregivers"
            >
              <Text style={styles.quickActionIcon}>👥</Text>
              <Text style={styles.quickActionText}>Caregivers</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#666666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  seeAllButton: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  medicationList: {
    gap: 12,
  },
  medicationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  medicationTime: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  medicationActions: {
    marginLeft: 12,
  },
  takeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  takeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  takenBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  takenBadgeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
});

export default HomeScreen;