import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import MedicationService from '../../services/MedicationService';

const MedicationsScreen = () => {
  const navigation = useNavigation();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const data = await MedicationService.getMedications();
      setMedications(data);
    } catch (error) {
      console.error('Error loading medications:', error);
      Toast.show({
        type: 'error',
        text1: 'Error Loading Medications',
        text2: 'Please try again later',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMedications();
  };

  const handleAddMedication = () => {
    navigation.navigate('AddMedication');
  };

  const handleMedicationPress = (medication) => {
    navigation.navigate('MedicationDetails', { medication });
  };

  const handleMarkTaken = async (medication) => {
    try {
      await MedicationService.markMedicationTaken(medication.id);
      
      // Update local state
      setMedications(prev => 
        prev.map(med => 
          med.id === medication.id 
            ? { ...med, lastTaken: new Date().toISOString() }
            : med
        )
      );

      Toast.show({
        type: 'success',
        text1: 'Great!',
        text2: `${medication.name} marked as taken`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not mark medication as taken',
      });
    }
  };

  const renderMedicationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.medicationCard}
      onPress={() => handleMedicationPress(item)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Medication: ${item.name}`}
    >
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationName}>{item.name}</Text>
        <Text style={styles.medicationDosage}>{item.dosage}</Text>
        <Text style={styles.medicationFrequency}>{item.frequency}</Text>
        {item.instructions && (
          <Text style={styles.medicationInstructions}>{item.instructions}</Text>
        )}
      </View>
      
      <View style={styles.medicationActions}>
        <TouchableOpacity
          style={styles.takeButton}
          onPress={() => handleMarkTaken(item)}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${item.name} as taken`}
        >
          <Text style={styles.takeButtonText}>Take</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.snoozeButton}
          accessibilityRole="button"
          accessibilityLabel={`Snooze ${item.name} reminder`}
        >
          <Text style={styles.snoozeButtonText}>Snooze</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>💊</Text>
      <Text style={styles.emptyStateTitle}>No Medications</Text>
      <Text style={styles.emptyStateText}>
        You haven't added any medications yet. Start by adding your first medication.
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddMedication}
        accessibilityRole="button"
        accessibilityLabel="Add your first medication"
      >
        <Text style={styles.addButtonText}>Add Medication</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medications</Text>
        <TouchableOpacity
          style={styles.addIconButton}
          onPress={handleAddMedication}
          accessibilityRole="button"
          accessibilityLabel="Add medication"
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Medications List */}
      <FlatList
        data={medications}
        renderItem={renderMedicationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
          />
        }
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
      />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  addIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  medicationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  medicationFrequency: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  medicationInstructions: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  medicationActions: {
    flexDirection: 'row',
    gap: 8,
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
  snoozeButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  snoozeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MedicationsScreen;