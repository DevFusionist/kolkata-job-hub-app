import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Modal, Dimensions, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Text, TextInput, Button, IconButton } from 'react-native-paper';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../_contexts/ThemeContext';

const { width } = Dimensions.get('window');

type LocationSelectorProps = {
  value: string;
  onChange: (v: string) => void;
  colors?: { ink?: string; background?: string; surface?: string; muted?: string; cream?: string };
  inputProps?: Record<string, any>;
};

export const LocationSelector = ({ value, onChange, colors: colorsProp, inputProps = {} }: LocationSelectorProps) => {
  const { colors: themeColors } = useTheme();
  const colors = colorsProp ?? themeColors;
  const [modalVisible, setModalVisible] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [displayAddress, setDisplayAddress] = useState(value || '');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [region, setRegion] = useState({
    latitude: 22.5726, longitude: 88.3639,
    latitudeDelta: 0.01, longitudeDelta: 0.01,
  });

  // --- FIXED: GPS BUTTON LOGIC ---
  const moveToCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Enable location permissions to find your current spot.");
        return;
      }

      let current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      const camera = {
        center: { latitude: current.coords.latitude, longitude: current.coords.longitude },
        pitch: 0, heading: 0, altitude: 1000, zoom: 17 // Zoomed in tighter for "Elite" feel
      };

      if (mapRef.current) {
        mapRef.current.animateCamera(camera, { duration: 1000 });
      }
    } catch (e) {
      Alert.alert("GPS Error", "Please ensure your device GPS is turned on.");
    }
  };

  // --- NEW: SEARCH BY TYPING LOGIC ---
  const handleSearch = async () => {
    if (!searchQuery) return;
    setAddressLoading(true);
    try {
      const result = await Location.geocodeAsync(searchQuery + ", Kolkata");
      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        const camera = {
          center: { latitude, longitude },
          pitch: 0, heading: 0, altitude: 1500, zoom: 15
        };
        mapRef.current?.animateCamera(camera, { duration: 1000 });
        setIsTyping(false); // Reset typing lock so map can update address
      } else {
        Alert.alert("Not Found", "Try adding 'Kolkata' or a specific area name.");
      }
    } catch (e) {
      Alert.alert("Search Error", "Could not find that location.");
    } finally {
      setAddressLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    if (isTyping) return;
    setAddressLoading(true);
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (place) {
        const formatted = [place.name, place.district, place.city].filter(Boolean).join(', ');
        setDisplayAddress(formatted);
      }
    } catch {
      // Geocoding can fail on emulators (UNAVAILABLE), without Play Services, or no network
      setDisplayAddress((prev) => prev || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleConfirm = () => {
    onChange(displayAddress);
    setModalVisible(false);
    setIsTyping(false);
  };

  return (
    <View style={styles.container}>
      <View>
        <TextInput
          {...inputProps}
          label="Location / Locality"
          value={value}
          editable={false}
          multiline={true}
          numberOfLines={2}
          right={<TextInput.Icon icon="map-marker-radius" color={colors.ink} />}
          style={[inputProps.style, { minHeight: 65, paddingVertical: 8, backgroundColor: themeColors.surface }]}
          mode="outlined"
          outlineColor={themeColors.border}
          activeOutlineColor={themeColors.terracotta}
        />
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onShow={() => {
          setDisplayAddress(value);
          setTimeout(moveToCurrentLocation, 800);
        }}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* TOP SEARCH BAR */}
          <View style={styles.searchOverlay}>
            <TextInput
              placeholder="Search Area (e.g. Salt Lake)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              mode="flat"
              style={[styles.searchInput, { backgroundColor: colors.surface }]}
              onSubmitEditing={handleSearch}
              right={<TextInput.Icon icon="magnify" onPress={handleSearch} />}
              underlineColor={themeColors.border}
              activeUnderlineColor={themeColors.terracotta}
            />
          </View>

          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onPanDrag={() => setIsTyping(false)}
            onRegionChangeComplete={(r) => {
              setRegion(r);
              reverseGeocode(r.latitude, r.longitude);
            }}
          />

          <View style={styles.markerFixed} pointerEvents="none">
            <Text style={{ fontSize: 40, marginBottom: 40 }}>📍</Text>
          </View>

          {/* FIXED GPS BUTTON CONTAINER */}
          <View style={styles.gpsContainer}>
            <IconButton
              icon="crosshairs-gps"
              mode="contained"
              containerColor={colors.surface}
              iconColor={colors.ink}
              size={30}
              onPress={moveToCurrentLocation}
              style={styles.gpsShadow}
            />
          </View>

          <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
            <Text style={styles.label}>Finalize Your Address</Text>
            <TextInput
              value={displayAddress}
              onChangeText={(t) => { setIsTyping(true); setDisplayAddress(t); }}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={[styles.manualInput, { backgroundColor: colors.surface }]}
              outlineColor={themeColors.border}
              activeOutlineColor={colors.ink}
            />
            {addressLoading && !isTyping && <ActivityIndicator size="small" color={colors.ink} style={{ marginBottom: 10 }} />}
            <Button mode="contained" onPress={handleConfirm} style={[styles.confirmBtn, { backgroundColor: colors.ink }]} labelStyle={{ color: colors.cream, fontWeight: 'bold' }}>
              Confirm Location
            </Button>
            <Button onPress={() => setModalVisible(false)} textColor={colors.muted}>Cancel</Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  map: { flex: 1 },
  markerFixed: { left: '50%', marginLeft: -20, marginTop: -20, position: 'absolute', top: '50%' },
  searchOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchInput: {
    elevation: 4,
    borderRadius: 4,
    height: 50,
  },
  gpsContainer: {
    position: 'absolute',
    right: 20,
    bottom: 300, // Adjusted to be above the bottom sheet
    zIndex: 20, // High zIndex is critical
  },
  gpsShadow: {
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bottomSheet: {
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    elevation: 25,
    paddingBottom: 30
  },
  label: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#888', marginBottom: 8 },
  manualInput: { marginBottom: 15, fontSize: 14, fontFamily: 'serif', minHeight: 80 },
  confirmBtn: { borderRadius: 2, height: 48, justifyContent: 'center' }
});