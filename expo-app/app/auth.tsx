import React, { useState } from 'react';
import { View, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row, Btn, Card } from '@/components/ui';
import { useAuth } from '@/services/auth';

/**
 * One screen, two modes (sign in / create account) toggled inline rather
 * than two separate routes - matches contact.tsx's pattern of a single
 * param-driven form screen.
 */
export default function Auth() {
  const r = useResponsive();
  const { mode: initialMode } = useLocalSearchParams<{ mode?: string }>();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode === 'signup' ? 'signup' : 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === 'signup';
  const passcodeValid = /^\d{4,6}$/.test(passcode);
  const canSubmit = email.trim().includes('@') && passcodeValid && (!isSignup || name.trim().length > 0);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (isSignup) {
        await signUp(name.trim(), email.trim(), passcode);
      } else {
        await signIn(email.trim(), passcode);
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padBottom={30}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Close"
          style={{ width: r.s(40), height: r.s(40), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={r.s(18)} color={colors.ink} />
        </Pressable>
      </Row>

      <Text size={28} weight="extra" track={-0.03} style={{ marginTop: r.s(18) }}>
        {isSignup ? 'Create your account' : 'Welcome back'}
      </Text>
      <Text size={13} lh={1.6} color={colors.muted} style={{ marginTop: r.s(6) }}>
        {isSignup ? 'Just a name, email and a passcode - no password to forget.' : 'Sign in with your email and passcode.'}
      </Text>

      <Card style={{ marginTop: r.s(22), gap: r.s(12) }}>
        {isSignup ? (
          <>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.faint}
              autoCapitalize="words"
              style={{ minHeight: r.s(40), fontSize: r.fs(14), color: colors.ink }}
            />
            <View style={{ height: 1, backgroundColor: colors.hairline }} />
          </>
        ) : null}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.faint}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={{ minHeight: r.s(40), fontSize: r.fs(14), color: colors.ink }}
        />
        <View style={{ height: 1, backgroundColor: colors.hairline }} />
        <TextInput
          value={passcode}
          onChangeText={(v) => setPasscode(v.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="4-6 digit passcode"
          placeholderTextColor={colors.faint}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          style={{ minHeight: r.s(40), fontSize: r.fs(14), color: colors.ink, letterSpacing: 3 }}
        />
      </Card>

      {error ? <Text size={11.5} color="#C4453C" style={{ marginTop: r.s(10) }}>{error}</Text> : null}

      <Btn
        full
        label={isSignup ? 'Create account' : 'Sign in'}
        left={submitting ? <ActivityIndicator color={colors.tealInk} /> : undefined}
        style={{ marginTop: r.s(18), paddingVertical: r.s(16), opacity: canSubmit && !submitting ? 1 : 0.5 }}
        disabled={!canSubmit || submitting}
        onPress={submit}
      />

      <Pressable
        onPress={() => {
          setMode(isSignup ? 'signin' : 'signup');
          setError(null);
        }}
        style={{ marginTop: r.s(18), alignItems: 'center', minHeight: r.s(40), justifyContent: 'center' }}
      >
        <Text size={12.5} weight="semibold" color={colors.muted}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <Text size={12.5} weight="bold" color={colors.ink}>{isSignup ? 'Sign in' : 'Create one'}</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}
