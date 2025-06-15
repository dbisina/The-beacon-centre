// metro.config.js - Metro bundler configuration
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push(
  'bin',
  'txt',
  'jpg',
  'png',
  'json',
  'mp3',
  'wav',
  'm4a'
);

// Configure for React Native Track Player
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;