import React, { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import CameraSettingsScreen from '../screens/CameraSettingsScreen';
import { AppSettings, FILM_FORMATS } from '../types';

export default function Camera() {
  const [settings, setSettings] = useState<AppSettings>({
    focalLength: 50,
    pinholeSize: 0.3,
    filmFormat: FILM_FORMATS[2],
    filmOrientation: 'landscape',
    iso: 100,
    selectedCondition: null,
    useRedFilter: false,
    useReciprocityFailure: true,
    bracketStops: 0,
  });

  // Reload settings every time the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  // Also load on initial mount for web compatibility
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('app_settings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings(prev => ({
          ...prev,
          ...parsedSettings,
          filmFormat: parsedSettings.filmFormat || prev.filmFormat,
          filmOrientation: parsedSettings.filmOrientation || 'landscape',
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      setSettings(newSettings);
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return <CameraSettingsScreen settings={settings} updateSettings={saveSettings} />;
}
