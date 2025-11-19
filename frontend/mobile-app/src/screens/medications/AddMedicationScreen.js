import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import MedicationService from '../../services/MedicationService';

const AddMedicationScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    dosageUnit: 'mg',
    instructions: '',
    totalQuantity: '',
    frequency: {
      timesPerDay: 1,
      times: ['08:00'],
      withMeals: false,
      beforeOrAfterMeals: 'with'
    }
  });

  const dosageUnits = [
    { value: 'mg', label: 'Milligrams (mg)' },
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'tablets', label: 'Tablets' },
    { value: 'capsules', label: 'Capsules' },
    { value: 'drops', label: 'Drops' },
    { value: 'units', label: 'Units' },
    { value: 'puffs', label: 'Puffs' }
  ];

  const timeSlots = ['06:00', '08:00', '12:00', '14:00', '18:00', '20:00', '22:00'];
  
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(0);

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Medication name is required');
      return false;
    }
    if (!formData.dosage.trim()) {
      Alert.alert('Error', 'Dosage is required');
      return false;
    }
    if (!formData.totalQuantity || parseInt(formData.totalQuantity) <= 0) {
      Alert.alert('Error', 'Total quantity must be greater than 0');
      return false;
    }
    return true;
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('frequency.')) {
      const frequencyField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        frequency: {
          ...prev.frequency,
          [frequencyField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addTimeSlot = () => {
    if (formData.frequency.times.length < 6) {
      setFormData(prev => ({
        ...prev,
        frequency: {
          ...prev.frequency,
          times: [...prev.frequency.times, '08:00']
        }
      }));
    }
  };

  const updateTimeSlot = (index, time) => {
    const newTimes = [...formData.frequency.times];
    newTimes[index] = time;
    setFormData(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        times: newTimes
      }
    }));
  };

  const removeTimeSlot = (index) => {
    if (formData.frequency.times.length > 1) {
      const newTimes = formData.frequency.times.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        frequency: {
          ...prev.frequency,
          times: newTimes
        }
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const medicationData = {
        ...formData,
        totalQuantity: parseInt(formData.totalQuantity),
        remainingQuantity: parseInt(formData.totalQuantity),
        startDate: new Date().toISOString(),
        route: 'oral',
        isActive: true,
        prescriptionRequired: false
      };

      await MedicationService.createMedication(medicationData);

      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: `${formData.name} has been added`,
      });

      navigation.goBack();

    } catch (error) {
      console.error('Add medication error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add medication. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTimeSlotSelector = () => (
    <View style={styles.timeSlotContainer}>
      <Text style={styles.label}>Medication Times</Text>
      {formData.frequency.times.map((time, index) => (
        <View key={index} style={styles.timeSlotItem}>
          <Text style={styles.timeSlotText}>Time {index + 1}</Text>
          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => {
              setSelectedTimeSlot(index);
              setShowTimeModal(true);
            }}
          >
            <Text style={styles.timeSelectorText}>{time}</Text>
          </TouchableOpacity>
          {formData.frequency.times.length > 1 && (
            <TouchableOpacity
              style={styles.removeTimeButton}
              onPress={() => removeTimeSlot(index)}
            >
              <Text style={styles.removeTimeText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      
      {formData.frequency.times.length < 6 && (
        <TouchableOpacity style={styles.addTimeButton} onPress={addTimeSlot}>
          <Text style={styles.addTimeText}>+ Add Another Time</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Medication</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Medication Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Medication Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="e.g., Aspirin, Metformin, etc."
              accessibilityLabel="Medication name"
            />
          </View>

          {/* Dosage */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={styles.label}>Dosage *</Text>
              <TextInput
                style={styles.input}
                value={formData.dosage}
                onChangeText={(value) => handleInputChange('dosage', value)}
                placeholder="e.g., 500"
                keyboardType="numeric"
                accessibilityLabel="Dosage amount"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={styles.label}>Unit *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowFrequencyModal(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {dosageUnits.find(unit => unit.value === formData.dosageUnit)?.label}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Frequency */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>How many times per day?</Text>
            <View style={styles.frequencyContainer}>
              {[1, 2, 3, 4, 6].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.frequencyButton,
                    formData.frequency.timesPerDay === num && styles.frequencyButtonActive
                  ]}
                  onPress={() => handleInputChange('frequency.timesPerDay', num)}
                >
                  <Text
                    style={[
                      styles.frequencyButtonText,
                      formData.frequency.timesPerDay === num && styles.frequencyButtonTextActive
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Slots */}
          {renderTimeSlotSelector()}

          {/* With Meals */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Take with meals?</Text>
            <View style={styles.mealOptions}>
              <TouchableOpacity
                style={[
                  styles.mealButton,
                  !formData.frequency.withMeals && styles.mealButtonActive
                ]}
                onPress={() => handleInputChange('frequency.withMeals', false)}
              >
                <Text style={[
                  styles.mealButtonText,
                  !formData.frequency.withMeals && styles.mealButtonTextActive
                ]}>
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mealButton,
                  formData.frequency.withMeals && styles.mealButtonActive
                ]}
                onPress={() => handleInputChange('frequency.withMeals', true)}
              >
                <Text style={[
                  styles.mealButtonText,
                  formData.frequency.withMeals && styles.mealButtonTextActive
                ]}>
                  Yes
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.instructions}
              onChangeText={(value) => handleInputChange('instructions', value)}
              placeholder="e.g., Take with food, Avoid alcohol, etc."
              multiline
              numberOfLines={3}
              accessibilityLabel="Medication instructions"
            />
          </View>

          {/* Total Quantity */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Total Quantity *</Text>
            <TextInput
              style={styles.input}
              value={formData.totalQuantity}
              onChangeText={(value) => handleInputChange('totalQuantity', value)}
              placeholder="e.g., 30"
              keyboardType="numeric"
              accessibilityLabel="Total quantity"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Add medication"
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Add Medication</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Dosage Unit Picker Modal */}
      <Modal
        visible={showFrequencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFrequencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Dosage Unit</Text>
            {dosageUnits.map(unit => (
              <TouchableOpacity
                key={unit.value}
                style={styles.modalItem}
                onPress={() => {
                  handleInputChange('dosageUnit', unit.value);
                  setShowFrequencyModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{unit.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowFrequencyModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time</Text>
            <ScrollView style={styles.timeScrollView}>
              {timeSlots.map(time => (
                <TouchableOpacity
                  key={time}
                  style={styles.modalItem}
                  onPress={() => {
                    updateTimeSlot(selectedTimeSlot, time);
                    setShowTimeModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowTimeModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#2196F3',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  frequencyButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },
  frequencyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
  },
  frequencyButtonTextActive: {
    color: 'white',
  },
  timeSlotContainer: {
    marginBottom: 20,
  },
  timeSlotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeSlotText: {
    fontSize: 16,
    color: '#333333',
    width: 80,
  },
  timeSelector: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    marginRight: 8,
  },
  timeSelectorText: {
    fontSize: 16,
    color: '#333333',
  },
  removeTimeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeTimeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addTimeButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    marginTop: 8,
  },
  addTimeText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  mealOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  mealButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },
  mealButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  mealButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeScrollView: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  modalCancelButton: {
    paddingVertical: 16,
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#2196F3',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default AddMedicationScreen;