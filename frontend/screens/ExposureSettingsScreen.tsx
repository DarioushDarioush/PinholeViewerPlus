import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppSettings, LIGHTING_CONDITIONS } from '../types';

const AMBER = '#F59E0B';
const DARK_BG = '#0a0a0a';
const CHARCOAL = '#1a1a1a';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#B3B3B3';
const TEXT_MUTED = '#808080';

interface Props {
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => void;
}

export default function ExposureSettingsScreen({ settings, updateSettings }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const isLandscape = dimensions.width > dimensions.height;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const calculateFStop = () => {
    return (settings.focalLength / settings.pinholeSize).toFixed(1);
  };

  const calculateExposure = () => {
    if (!settings.selectedCondition) return null;
    
    const condition = LIGHTING_CONDITIONS.find(c => c.name === settings.selectedCondition);
    if (!condition) return null;
    
    const actualFStop = parseFloat(calculateFStop());
    const referenceFStop = condition.fStop;
    
    const baseExposure = 1 / settings.iso;
    let exposureTime = baseExposure * Math.pow(actualFStop / referenceFStop, 2);
    
    if (settings.useReciprocityFailure && exposureTime > 1) {
      exposureTime = Math.pow(exposureTime, 1.3);
    }
    
    if (settings.useRedFilter) {
      exposureTime *= 8;
    }
    
    const bracketMultiplier = Math.pow(2, settings.bracketStops);
    exposureTime *= bracketMultiplier;
    
    return formatExposure(exposureTime);
  };

  const formatExposure = (seconds: number) => {
    if (seconds < 1) {
      return `1/${Math.round(1 / seconds)}s`;
    } else if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
  };

  const handleConditionSelect = (conditionName: string) => {
    updateSettings({ ...settings, selectedCondition: conditionName, bracketStops: 0 });
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const calculatedExposure = calculateExposure();

  // Render the exposure content (used in both layouts)
  const renderExposureContent = () => (
    <>
      <Text style={[styles.title, isLandscape && styles.titleLandscape]}>Exposure Settings</Text>
      <Text style={[styles.subtitle, isLandscape && styles.subtitleLandscape]}>Sunny 16 Rule Calculator</Text>

      {/* Calculated Exposure Result Display */}
      {calculatedExposure && (
        <View style={[styles.exposureResultBox, isLandscape && styles.exposureResultBoxLandscape]}>
          <Text style={[styles.exposureResultLabel, isLandscape && styles.exposureResultLabelLandscape]}>
            Calculated Exposure
          </Text>
          <Text style={[styles.exposureResultValue, isLandscape && styles.exposureResultValueLandscape]}>
            {calculatedExposure}
          </Text>
          <Text style={[styles.exposureResultCondition, isLandscape && styles.exposureResultConditionLandscape]}>
            {settings.selectedCondition}
            {settings.bracketStops !== 0 && ` (${settings.bracketStops > 0 ? '+' : ''}${settings.bracketStops} stops)`}
            {settings.useRedFilter && ' • Red Filter'}
            {settings.useReciprocityFailure && ' • Reciprocity'}
          </Text>
        </View>
      )}

      {/* Camera Info */}
      <View style={[styles.infoBox, isLandscape && styles.infoBoxLandscape]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, isLandscape && styles.infoLabelLandscape]}>ISO:</Text>
          <Text style={[styles.infoValue, isLandscape && styles.infoValueLandscape]}>{settings.iso}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, isLandscape && styles.infoLabelLandscape]}>F-Stop:</Text>
          <Text style={[styles.infoValue, isLandscape && styles.infoValueLandscape]}>f/{calculateFStop()}</Text>
        </View>
      </View>

      {/* Red Filter Toggle */}
      <TouchableOpacity
        style={[styles.toggleRow, isLandscape && styles.toggleRowLandscape]}
        onPress={() => updateSettings({ ...settings, useRedFilter: !settings.useRedFilter })}
      >
        <View style={[styles.checkbox, isLandscape && styles.checkboxLandscape]}>
          {settings.useRedFilter && <Ionicons name="checkmark" size={isLandscape ? 14 : 18} color={AMBER} />}
        </View>
        <View style={styles.toggleText}>
          <Text style={[styles.toggleLabel, isLandscape && styles.toggleLabelLandscape]}>Red Filter Compensation</Text>
          <Text style={[styles.toggleNote, isLandscape && styles.toggleNoteLandscape]}>Adds +3 stops to exposure time</Text>
        </View>
      </TouchableOpacity>

      {/* Reciprocity Failure Toggle */}
      <TouchableOpacity
        style={[styles.toggleRow, isLandscape && styles.toggleRowLandscape]}
        onPress={() =>
          updateSettings({
            ...settings,
            useReciprocityFailure: !settings.useReciprocityFailure,
          })
        }
      >
        <View style={[styles.checkbox, isLandscape && styles.checkboxLandscape]}>
          {settings.useReciprocityFailure && <Ionicons name="checkmark" size={isLandscape ? 14 : 18} color={AMBER} />}
        </View>
        <View style={styles.toggleText}>
          <Text style={[styles.toggleLabel, isLandscape && styles.toggleLabelLandscape]}>Reciprocity Failure</Text>
          <Text style={[styles.toggleNote, isLandscape && styles.toggleNoteLandscape]}>Adjusts for long exposures (>1s)</Text>
        </View>
      </TouchableOpacity>

      {/* Lighting Conditions */}
      <Text style={[styles.sectionTitle, isLandscape && styles.sectionTitleLandscape]}>
        Select Lighting Conditions
      </Text>
      <View style={[styles.conditionsGrid, isLandscape && styles.conditionsGridLandscape]}>
        {LIGHTING_CONDITIONS.map((condition, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.conditionCard,
              isLandscape && styles.conditionCardLandscape,
              settings.selectedCondition === condition.name && styles.conditionCardSelected,
            ]}
            onPress={() => handleConditionSelect(condition.name)}
          >
            <Text style={[styles.conditionIcon, isLandscape && styles.conditionIconLandscape]}>
              {condition.icon}
            </Text>
            <View style={styles.conditionTextContainer}>
              <Text style={[styles.conditionName, isLandscape && styles.conditionNameLandscape]}>
                {condition.name}
              </Text>
              {!isLandscape && (
                <Text style={styles.conditionDesc}>{condition.description}</Text>
              )}
              <Text style={[styles.conditionFStop, isLandscape && styles.conditionFStopLandscape]}>
                f/{condition.fStop}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  // LANDSCAPE LAYOUT
  if (isLandscape) {
    return (
      <View style={styles.landscapeContainer}>
        {/* Left side - branding/icon area */}
        <View style={styles.landscapeLeftPanel}>
          <Ionicons name="sunny-outline" size={48} color={TEXT_MUTED} />
          <Text style={styles.landscapeBrandText}>Exposure</Text>
          <Text style={styles.landscapeBrandSubtext}>Calculator</Text>
        </View>

        {/* Right side - settings panel */}
        <View style={styles.landscapeRightPanel}>
          <ScrollView 
            style={styles.landscapeScrollView}
            contentContainerStyle={styles.landscapeScrollContent}
            showsVerticalScrollIndicator={false}
            ref={scrollRef}
          >
            {renderExposureContent()}
          </ScrollView>
        </View>
      </View>
    );
  }

  // PORTRAIT LAYOUT
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} ref={scrollRef}>
        <View style={styles.content}>
          {renderExposureContent()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // SHARED / PORTRAIT STYLES
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: AMBER,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 24,
  },
  exposureResultBox: {
    backgroundColor: AMBER,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  exposureResultLabel: {
    color: DARK_BG,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  exposureResultValue: {
    color: DARK_BG,
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  exposureResultCondition: {
    color: DARK_BG,
    fontSize: 12,
    marginTop: 6,
    opacity: 0.8,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: CHARCOAL,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#999',
    fontSize: 14,
  },
  infoValue: {
    color: AMBER,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CHARCOAL,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 56,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: AMBER,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    color: '#ccc',
    fontSize: 16,
  },
  toggleNote: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  conditionsGrid: {
    gap: 12,
  },
  conditionCard: {
    backgroundColor: CHARCOAL,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  conditionCardSelected: {
    borderColor: AMBER,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  conditionIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  conditionTextContainer: {
    alignItems: 'center',
  },
  conditionName: {
    color: AMBER,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  conditionDesc: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  conditionFStop: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // LANDSCAPE STYLES
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: DARK_BG,
  },
  landscapeLeftPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 2,
    borderRightColor: AMBER,
    paddingHorizontal: 20,
  },
  landscapeBrandText: {
    color: AMBER,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  landscapeBrandSubtext: {
    color: TEXT_MUTED,
    fontSize: 14,
    marginTop: 4,
  },
  landscapeRightPanel: {
    width: '42%',
    backgroundColor: CHARCOAL,
  },
  landscapeScrollView: {
    flex: 1,
  },
  landscapeScrollContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  titleLandscape: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitleLandscape: {
    fontSize: 12,
    marginBottom: 16,
  },
  exposureResultBoxLandscape: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  exposureResultLabelLandscape: {
    fontSize: 10,
  },
  exposureResultValueLandscape: {
    fontSize: 28,
  },
  exposureResultConditionLandscape: {
    fontSize: 10,
    marginTop: 4,
  },
  infoBoxLandscape: {
    padding: 12,
    marginBottom: 14,
  },
  infoLabelLandscape: {
    fontSize: 12,
  },
  infoValueLandscape: {
    fontSize: 14,
  },
  toggleRowLandscape: {
    padding: 12,
    marginBottom: 8,
    minHeight: 48,
  },
  checkboxLandscape: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  toggleLabelLandscape: {
    fontSize: 13,
  },
  toggleNoteLandscape: {
    fontSize: 10,
  },
  sectionTitleLandscape: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  conditionsGridLandscape: {
    gap: 8,
  },
  conditionCardLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 56,
  },
  conditionIconLandscape: {
    fontSize: 24,
    marginRight: 12,
    marginBottom: 0,
  },
  conditionNameLandscape: {
    fontSize: 13,
    marginBottom: 0,
    textAlign: 'left',
  },
  conditionFStopLandscape: {
    fontSize: 12,
    marginTop: 2,
  },
});
