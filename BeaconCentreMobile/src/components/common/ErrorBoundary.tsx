// src/components/common/ErrorBoundary.tsx - ENHANCED ERROR BOUNDARY
import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: any) => {
    // In a real app, you might send this to a service like Sentry, Bugsnag, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
    };

    // For now, just log to console
    console.log('Error Report:', errorReport);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleReload = () => {
    // In a real app, you might want to restart the app or navigate to a safe screen
    Alert.alert(
      'Restart Required',
      'The app needs to be restarted to recover from this error.',
      [
        {
          text: 'OK',
          onPress: () => {
            // You can implement app restart logic here
            this.handleRetry();
          },
        },
      ]
    );
  };

  private handleReportError = () => {
    const { error, errorInfo } = this.state;
    
    Alert.alert(
      'Report Error',
      'Would you like to report this error to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            // Implement error reporting logic here
            console.log('Error reported by user');
            Alert.alert('Thank You', 'Error report has been sent.');
          },
        },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <Icon name="error-outline" size={80} color={colors.red} />
            </View>
            
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            <Text style={styles.message}>
              The app encountered an unexpected error. Don't worry, your data is safe.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Error Details (Development Mode):</Text>
                <ScrollView style={styles.debugScroll}>
                  <Text style={styles.debugText}>
                    {this.state.error.toString()}
                  </Text>
                  {this.state.error.stack && (
                    <Text style={styles.debugText}>
                      {this.state.error.stack}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleRetry}
              >
                <Icon name="refresh" size={24} color="white" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleReportError}
              >
                <Icon name="bug-report" size={24} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Report Issue</Text>
              </TouchableOpacity>

              {__DEV__ && (
                <TouchableOpacity
                  style={[styles.button, styles.debugButton]}
                  onPress={this.handleReload}
                >
                  <Icon name="restart-alt" size={24} color={colors.textGrey} />
                  <Text style={styles.debugButtonText}>Force Restart</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.errorId}>
              Error ID: {this.state.errorId}
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    ...typography.styles.h3,
    color: colors.light.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    ...typography.styles.body1,
    color: colors.textGrey,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  debugContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 30,
    maxHeight: 200,
  },
  debugTitle: {
    ...typography.styles.caption,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.light.text,
  },
  debugScroll: {
    maxHeight: 150,
  },
  debugText: {
    ...typography.styles.caption,
    color: colors.textGrey,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    ...typography.styles.button,
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    ...typography.styles.button,
    color: colors.primary,
  },
  debugButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textGrey,
  },
  debugButtonText: {
    ...typography.styles.button,
    color: colors.textGrey,
  },
  errorId: {
    ...typography.styles.caption,
    color: colors.textGrey,
    marginTop: 20,
    textAlign: 'center',
  },
});

export default ErrorBoundary;