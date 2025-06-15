// src/components/audio/DownloadManager.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';

import { AudioSermon } from '@/types/api';
import { DownloadedAudio } from '@/types/storage';
import LocalStorageService from '@/services/storage/LocalStorage';
import { colors, typography } from '@/constants';
import { useApp } from '@/context/AppContext';

interface DownloadManagerProps {
  sermon: AudioSermon;
  onDownloadComplete?: () => void;
  showProgress?: boolean;
}

const DownloadManager: React.FC<DownloadManagerProps> = ({
  sermon,
  onDownloadComplete,
  showProgress = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { state } = useApp();

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadedFile, setDownloadedFile] = useState<DownloadedAudio | null>(null);

  useEffect(() => {
    checkDownloadStatus();
  }, [sermon.id, state.userData]);

  const checkDownloadStatus = async () => {
    if (state.userData) {
      const downloaded = state.userData.downloadedAudio.find(
        item => item.sermonId === sermon.id
      );
      
      if (downloaded) {
        // Check if file still exists
        const exists = await RNFS.exists(downloaded.localPath);
        if (exists) {
          setIsDownloaded(true);
          setDownloadedFile(downloaded);
        } else {
          // File was deleted, remove from storage
          await LocalStorageService.removeDownloadedAudio(sermon.id);
          setIsDownloaded(false);
          setDownloadedFile(null);
        }
      }
    }
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to storage to download audio files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const startDownload = async () => {
    // Check network connection
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert(
        'No Internet',
        'Please check your internet connection and try again.'
      );
      return;
    }

    // Check storage permission
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Storage permission is required to download audio files.'
      );
      return;
    }

    // Check available storage
    const freeSpace = await RNFS.getFSInfo();
    const requiredSpace = sermon.file_size || 10 * 1024 * 1024; // Default 10MB
    
    if (freeSpace.freeSpace < requiredSpace * 1.2) { // 20% buffer
      Alert.alert(
        'Storage Full',
        'Not enough storage space available. Please free up some space and try again.'
      );
      return;
    }

    // Check if auto-download is enabled and we're not on WiFi
    if (state.userData?.appSettings.autoDownloadWifi && netInfo.type !== 'wifi') {
      Alert.alert(
        'Mobile Data',
        'You have auto-download on WiFi enabled. Do you want to download using mobile data?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => performDownload() },
        ]
      );
      return;
    }

    await performDownload();
  };

  const performDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      // Create download directory if it doesn't exist
      const downloadDir = `${RNFS.DocumentDirectoryPath}/beacon_audio`;
      await RNFS.mkdir(downloadDir);

      // Generate unique filename
      const fileName = `sermon_${sermon.id}_${Date.now()}.mp3`;
      const downloadPath = `${downloadDir}/${fileName}`;

      // Start download
      const download = RNFS.downloadFile({
        fromUrl: sermon.audio_url,
        toFile: downloadPath,
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          setDownloadProgress(Math.round(progress));
        },
        progressDivider: 1,
      });

      const result = await download.promise;

      if (result.statusCode === 200) {
        // Save download info to local storage
        const downloadedAudio: DownloadedAudio = {
          sermonId: sermon.id,
          localPath: downloadPath,
          downloadDate: new Date().toISOString(),
          title: sermon.title,
          speaker: sermon.speaker,
          duration: sermon.duration,
        };

        await LocalStorageService.addDownloadedAudio(downloadedAudio);
        
        setIsDownloaded(true);
        setDownloadedFile(downloadedAudio);
        setIsDownloading(false);
        setDownloadProgress(0);

        onDownloadComplete?.();

        Alert.alert('Success', 'Audio sermon downloaded successfully!');
      } else {
        throw new Error(`Download failed with status ${result.statusCode}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
      setDownloadProgress(0);
      
      Alert.alert(
        'Download Failed',
        'Failed to download audio sermon. Please try again.'
      );
    }
  };

  const deleteDownload = async () => {
    Alert.alert(
      'Delete Download',
      `Are you sure you want to delete "${sermon.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (downloadedFile) {
                await RNFS.unlink(downloadedFile.localPath);
                await LocalStorageService.removeDownloadedAudio(sermon.id);
                
                setIsDownloaded(false);
                setDownloadedFile(null);
                
                Alert.alert('Success', 'Download deleted successfully!');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete download.');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  if (isDownloading) {
    return (
      <View style={styles.downloadContainer}>
        <View style={styles.progressContainer}>
          <View style={[
            styles.progressBar,
            { backgroundColor: isDark ? colors.dark.border : colors.light.border }
          ]}>
            <View style={[
              styles.progressFill,
              { 
                width: `${downloadProgress}%`,
                backgroundColor: colors.primary 
              }
            ]} />
          </View>
          <Text style={[
            styles.progressText,
            { color: isDark ? colors.dark.text : colors.textGrey }
          ]}>
            {downloadProgress}%
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => {
            // Cancel download (implement if needed)
            setIsDownloading(false);
            setDownloadProgress(0);
          }}
          style={styles.cancelButton}
        >
          <Icon name="close" size={20} color={colors.red} />
        </TouchableOpacity>
      </View>
    );
  }

  if (isDownloaded) {
    return (
      <View style={styles.downloadContainer}>
        <View style={styles.downloadedInfo}>
          <Icon name="download-done" size={20} color={colors.success} />
          <Text style={[
            styles.downloadedText,
            { color: colors.success }
          ]}>
            Downloaded
          </Text>
          {downloadedFile && (
            <Text style={[
              styles.downloadDate,
              { color: colors.textGrey }
            ]}>
              {new Date(downloadedFile.downloadDate).toLocaleDateString()}
            </Text>
          )}
        </View>
        
        <TouchableOpacity onPress={deleteDownload} style={styles.deleteButton}>
          <Icon name="delete" size={20} color={colors.red} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={startDownload} style={styles.downloadButton}>
      <Icon name="download" size={20} color={colors.primary} />
      <Text style={[styles.downloadText, { color: colors.primary }]}>
        Download ({formatFileSize(sermon.file_size)})
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  downloadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  downloadText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
    marginLeft: 4,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
    minWidth: 40,
  },
  cancelButton: {
    padding: 4,
  },
  downloadedInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadedText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
    marginLeft: 4,
    marginRight: 8,
  },
  downloadDate: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.small,
  },
  deleteButton: {
    padding: 4,
  },
});

export default DownloadManager;