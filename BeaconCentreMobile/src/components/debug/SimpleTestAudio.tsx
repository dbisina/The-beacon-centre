// src/components/debug/SimpleAudioTest.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';

const SimpleAudioTest: React.FC = () => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const testAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; // Known working URL

  const playTestAudio = async () => {
    try {
      setIsLoading(true);
      console.log('🎵 Starting audio test...');

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('✅ Audio mode set');

      // Stop previous sound
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Create and play new sound
      console.log('📡 Loading audio from:', testAudioUrl);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: testAudioUrl },
        { shouldPlay: true, volume: 1.0 }
      );

      console.log('✅ Audio loaded, starting playback...');
      setSound(newSound);
      setIsPlaying(true);

      // Set status update callback
      newSound.setOnPlaybackStatusUpdate((status) => {
        console.log('📊 Playback status:', status);
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
        }
      });

      Alert.alert('Success', 'Audio should be playing now!');

    } catch (error) {
      console.error('❌ Audio test failed:', error);
      Alert.alert('Error', `Audio test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
        console.log('⏹️ Audio stopped');
      }
    } catch (error) {
      console.error('❌ Error stopping audio:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Audio Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: isLoading ? '#ccc' : '#007AFF' }]}
        onPress={playTestAudio}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : 'Play Test Audio'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#FF3B30' }]}
        onPress={stopAudio}
        disabled={!isPlaying}
      >
        <Text style={styles.buttonText}>Stop Audio</Text>
      </TouchableOpacity>

      <Text style={styles.status}>
        Status: {isLoading ? 'Loading...' : isPlaying ? 'Playing 🎵' : 'Stopped ⏹️'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SimpleAudioTest;