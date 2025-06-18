// src/components/debug/AudioPlayerDebug.tsx - Debug the actual player
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useAudio } from '@/context/AudioContext';

const AudioPlayerDebug: React.FC = () => {
  const { state, play, pause } = useAudio();
  const rawPlayer = useAudioPlayer(); // Direct access to expo-audio player
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `${timestamp}: ${info}`]);
    console.log(`🔍 Debug: ${info}`);
  };

  const testDirectPlay = async () => {
    try {
      addDebugInfo('🎵 Testing direct expo-audio play...');
      
      // Test direct URL
      const testUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      addDebugInfo(`📡 Loading URL: ${testUrl}`);
      
      await rawPlayer.replace(testUrl);
      addDebugInfo('✅ URL loaded successfully');
      
      await rawPlayer.play();
      addDebugInfo('🎵 Play command sent');
      
      // Check status after a delay
      setTimeout(() => {
        addDebugInfo(`📊 Player Status: playing=${rawPlayer.playing}, currentTime=${rawPlayer.currentTime}, duration=${rawPlayer.duration}`);
      }, 2000);
      
    } catch (error) {
      addDebugInfo(`❌ Direct play failed: ${error}`);
      Alert.alert('Direct Play Failed', `Error: ${error}`);
    }
  };

  const testContextPlay = async () => {
    try {
      addDebugInfo('🎵 Testing context play...');
      await play();
      addDebugInfo('✅ Context play called');
    } catch (error) {
      addDebugInfo(`❌ Context play failed: ${error}`);
    }
  };

  const checkPlayerState = () => {
    addDebugInfo('🔍 Checking current player state...');
    addDebugInfo(`📊 Raw Player: playing=${rawPlayer.playing}, currentTime=${rawPlayer.currentTime}, duration=${rawPlayer.duration}`);
    addDebugInfo(`📊 Context State: playing=${state.isPlaying}, currentTrack=${state.currentTrack?.title || 'none'}`);
    addDebugInfo(`📊 Current URL: ${state.currentTrack?.audio_url || 'none'}`);
  };

  const testAlternativeURL = async () => {
    try {
      addDebugInfo('🎵 Testing alternative URL...');
      
      // Different test URL
      const altUrl = 'https://sample-videos.com/zip/10/mp3/SampleAudio_0.4mb_mp3.mp3';
      addDebugInfo(`📡 Loading alternative URL: ${altUrl}`);
      
      await rawPlayer.replace(altUrl);
      addDebugInfo('✅ Alternative URL loaded');
      
      await rawPlayer.play();
      addDebugInfo('🎵 Alternative URL play command sent');
      
    } catch (error) {
      addDebugInfo(`❌ Alternative URL failed: ${error}`);
    }
  };

  const clearDebug = () => {
    setDebugInfo([]);
    addDebugInfo('🧹 Debug log cleared');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Audio Player Debug</Text>
      
      {/* Current State */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current State</Text>
        <Text style={styles.infoText}>
          Track: {state.currentTrack?.title || 'None'}
        </Text>
        <Text style={styles.infoText}>
          Context Playing: {state.isPlaying ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.infoText}>
          Raw Player Playing: {rawPlayer.playing ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.infoText}>
          Duration: {rawPlayer.duration?.toFixed(1) || 'Unknown'}s
        </Text>
        <Text style={styles.infoText}>
          Position: {rawPlayer.currentTime?.toFixed(1) || 'Unknown'}s
        </Text>
      </View>

      {/* Test Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Controls</Text>
        
        <TouchableOpacity style={styles.button} onPress={testDirectPlay}>
          <Text style={styles.buttonText}>🎵 Test Direct Play</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testContextPlay}>
          <Text style={styles.buttonText}>▶️ Test Context Play</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testAlternativeURL}>
          <Text style={styles.buttonText}>🔄 Test Alternative URL</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={checkPlayerState}>
          <Text style={styles.buttonText}>🔍 Check Player State</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Log */}
      <View style={styles.section}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Debug Log</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearDebug}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.debugLog} showsVerticalScrollIndicator={false}>
          {debugInfo.length === 0 ? (
            <Text style={styles.noLogs}>No debug info yet</Text>
          ) : (
            debugInfo.slice(-20).map((info, index) => (
              <Text key={index} style={styles.debugText}>
                {info}
              </Text>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  debugLog: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  noLogs: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    marginBottom: 4,
    color: '#333',
    fontFamily: 'monospace',
  },
});

export default AudioPlayerDebug;