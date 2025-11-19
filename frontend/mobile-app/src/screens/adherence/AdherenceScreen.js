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
import { LineChart } from 'react-native-chart-kit';
import AdherenceService from '../../services/AdherenceService';
import MedicationService from '../../services/MedicationService';

const AdherenceScreen = () => {
  const navigation = useNavigation();
  const [adherenceRecords, setAdherenceRecords] = useState([]);
  const [adherenceStats, setAdherenceStats] = useState({});
  const [adherenceTrends, setAdherenceTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    loadAdherenceData();
  }, [selectedPeriod]);

  const loadAdherenceData = async () => {
    try {
      setLoading(true);
      
      // Load data in parallel
      const [recordsData, statsData, trendsData] = await Promise.allSettled([
        AdherenceService.getAdherenceRecords({ limit: 50 }),
        AdherenceService.getAdherenceStatistics({ period: selectedPeriod }),
        AdherenceService.getAdherenceTrends({ months: 6 })
      ]);

      if (recordsData.status === 'fulfilled') {
        setAdherenceRecords(recordsData.value);
      }

      if (statsData.status === 'fulfilled') {
        setAdherenceStats(statsData.value);
      }

      if (trendsData.status === 'fulfilled') {
        setAdherenceTrends(trendsData.value);
      }

    } catch (error) {
      console.error('Error loading adherence data:', error);
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
    loadAdherenceData();
  };

  const handleRecordPress = (record) => {
    navigation.navigate('AdherenceDetails', { record });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'taken':
        return '#4CAF50';
      case 'missed':
        return '#F44336';
      case 'delayed':
        return '#FF9800';
      case 'skipped':
        return '#9E9E9E';
      default:
        return '#2196F3';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'taken':
        return 'Taken';
      case 'missed':
        return 'Missed';
      case 'delayed':
        return 'Delayed';
      case 'skipped':
        return 'Skipped';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['week', 'month', 'quarter', 'year'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatsOverview = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Adherence Overview</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{adherenceStats.statistics?.totalScheduled || 0}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {adherenceStats.statistics?.taken || 0}
          </Text>
          <Text style={styles.statLabel}>Taken</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F44336' }]}>
            {adherenceStats.statistics?.missed || 0}
          </Text>
          <Text style={styles.statLabel}>Missed</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {adherenceStats.statistics?.delayed || 0}
          </Text>
          <Text style={styles.statLabel}>Delayed</Text>
        </View>
      </View>

      <View style={styles.adherenceRateContainer}>
        <Text style={styles.adherenceRateLabel}>Adherence Rate</Text>
        <Text style={styles.adherenceRateValue}>
          {adherenceStats.statistics?.adherenceRate || 0}%
        </Text>
      </View>
    </View>
  );

  const renderTrendsChart = () => {
    if (!adherenceTrends || adherenceTrends.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>No trend data available</Text>
        </View>
      );
    }

    const chartData = {
      labels: adherenceTrends.map(trend => {
        const date = new Date(trend.month + '-01');
        return date.toLocaleDateString('en-US', { month: 'short' });
      }),
      datasets: [{
        data: adherenceTrends.map(trend => trend.complianceRate || 0)
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Adherence Trends</Text>
        <LineChart
          data={chartData}
          width={340}
          height={200}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 8
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#2196F3'
            }
          }}
          bezier
          style={{
            borderRadius: 8,
            marginVertical: 8
          }}
        />
      </View>
    );
  };

  const renderAdherenceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.adherenceCard}
      onPress={() => handleRecordPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.adherenceInfo}>
        <View style={styles.medicationHeader}>
          <Text style={styles.medicationName}>{item.medication?.name || 'Medication'}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusBadgeText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.medicationDosage}>
          {item.medication?.dosage} {item.medication?.dosageUnit}
        </Text>
        
        <Text style={styles.timeInfo}>
          Scheduled: {formatDate(item.scheduledTime)}
          {item.takenTime && `\nTaken: ${formatDate(item.takenTime)}`}
        </Text>
        
        {item.notes && (
          <Text style={styles.notes}>{item.notes}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading adherence data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Adherence</Text>
      </View>

      {/* Content */}
      <FlatList
        data={adherenceRecords}
        renderItem={renderAdherenceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Period Selector */}
            {renderPeriodSelector()}

            {/* Stats Overview */}
            {renderStatsOverview()}

            {/* Trends Chart */}
            {renderTrendsChart()}

            {/* Section Title */}
            <Text style={styles.sectionTitle}>Recent Records</Text>
          </View>
        }
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  listContent: {
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2196F3',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  periodButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  adherenceRateContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  adherenceRateLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  adherenceRateValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  chartPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    marginTop: 8,
  },
  adherenceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adherenceInfo: {
    flex: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  timeInfo: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
});

export default AdherenceScreen;