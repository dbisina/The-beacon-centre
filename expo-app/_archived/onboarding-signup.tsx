import React, { useState } from 'react';
import { View, Image, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row, Btn } from '@/components/ui';
import { useAuth } from '@/services/auth';

/**
 * Sign up — never a gate.
 *
 * The "Continue without an account" panel is deliberately given as much
 * visual weight as the form: an account only buys sync, so the screen says so
 * plainly rather than dark-patterning people into registering.
 */
export default function SignUp() {
  const r = useResponsive();
  const { signUp, signIn, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<'up' | 'in'>('up');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Check your details', 'Enter an email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      mode === 'up' ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
      router.replace('/onboarding/setup');
    } catch (e: any) {
      Alert.alert(mode === 'up' ? "Couldn't create your account" : "Couldn't sign you in", e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const asGuest = async () => {
    await continueAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen padBottom={20}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          style={{ width: r.s(44), height: r.s(44), borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={r.s(19)} color={colors.ink} />
        </Pressable>

        <Text size={32} weight="extra" lh={1.08} track={-0.035} style={{ marginTop: r.s(26) }}>
          {mode === 'up' ? 'Create an account' : 'Welcome back'}
        </Text>
        <Text size={13} lh={1.65} color={colors.muted} style={{ marginTop: r.s(10) }}>
          Only needed to save sermons, keep your giving history and get your CSG's updates.
        </Text>

        {/* Social sign-in is designed but not wired — see unmade.md §9. */}
        <View style={{ marginTop: r.s(24), gap: r.s(10) }}>
          <Pressable
            onPress={() => Alert.alert('Not connected yet', 'Google sign-in needs an OAuth client — see unmade.md.')}
            style={{ minHeight: r.s(52), borderRadius: radius.md, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: r.s(10) }}
          >
            <Image source={require('../../assets/google.png')} style={{ width: r.s(18), height: r.s(18) }} resizeMode="contain" />
            <Text size={13.5} weight="bold">Continue with Google</Text>
          </Pressable>
          {Platform.OS === 'ios' ? (
            <Pressable
              onPress={() => Alert.alert('Not connected yet', 'Apple sign-in is required before Google ships — see unmade.md.')}
              style={{ minHeight: r.s(52), borderRadius: radius.md, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: r.s(10) }}
            >
              <Ionicons name="logo-apple" size={r.s(18)} color="#fff" />
              <Text size={13.5} weight="bold" color="#fff">Continue with Apple</Text>
            </Pressable>
          ) : null}
        </View>

        <Row gap={14} style={{ marginVertical: r.s(22) }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text size={11} weight="semibold" color={colors.faint}>or with email</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </Row>

        <View style={{ gap: r.s(10) }}>
          {mode === 'up' ? <Field label="FULL NAME" value={name} onChange={setName} placeholder="Adeola Okon" /> : null}
          <Field label="EMAIL" value={email} onChange={setEmail} placeholder="you@email.com" keyboard="email-address" />
          <Field label="PASSWORD" value={password} onChange={setPassword} placeholder="At least 6 characters" secure={!show} trailing={
            <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} accessibilityLabel="Show password">
              <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={r.s(18)} color={colors.faint} />
            </Pressable>
          } />
        </View>

        <Btn
          full
          label={busy ? 'One moment…' : mode === 'up' ? 'Create account' : 'Sign in'}
          disabled={busy}
          style={{ marginTop: r.s(18), paddingVertical: r.s(17) }}
          onPress={submit}
        />

        <Pressable onPress={() => setMode(mode === 'up' ? 'in' : 'up')} style={{ minHeight: r.s(44), justifyContent: 'center' }}>
          <Text size={12} color={colors.muted} style={{ textAlign: 'center' }}>
            {mode === 'up' ? 'Already have an account? ' : "Don't have one? "}
            <Text size={12} weight="bold" color={colors.tealDeep}>{mode === 'up' ? 'Sign in' : 'Create one'}</Text>
          </Text>
        </Pressable>

        <View style={{ marginTop: r.s(14), padding: r.s(18), borderRadius: radius.lg, backgroundColor: colors.surfaceAlt }}>
          <Row gap={10}>
            <Ionicons name="information-circle-outline" size={r.s(16)} color={colors.tealDeep} />
            <Text size={12.5} weight="extra">You don't have to</Text>
          </Row>
          <Text size={12} lh={1.65} color={colors.inkSoft} style={{ marginTop: r.s(8) }}>
            Sermons, live services, announcements and giving all work without an account. You can sign up later from Settings and keep everything you've saved on this phone.
          </Text>
          <Btn full tone="plain" label="Continue without an account" style={{ marginTop: r.s(14) }} onPress={asGuest} />
        </View>

        <Text size={11} lh={1.6} color={colors.faint} style={{ marginTop: r.s(18), textAlign: 'center' }}>
          By continuing you agree to our <Text size={11} weight="bold" color={colors.tealDeep}>Terms</Text> and{' '}
          <Text size={11} weight="bold" color={colors.tealDeep}>Privacy Policy</Text>.
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChange, placeholder, secure, keyboard, trailing,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  secure?: boolean; keyboard?: 'email-address' | 'default'; trailing?: React.ReactNode;
}) {
  const r = useResponsive();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ paddingVertical: r.s(12), paddingHorizontal: r.s(16), borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: focused ? colors.teal : 'transparent', flexDirection: 'row', alignItems: 'center', gap: r.s(10) }}>
      <View style={{ flex: 1 }}>
        <Text size={9.5} weight="bold" track={0.14} color={focused ? colors.tealDeep : colors.faint}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#B5AFA6"
          secureTextEntry={secure}
          keyboardType={keyboard ?? 'default'}
          autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ minHeight: r.s(28), marginTop: r.s(4), fontSize: r.fs(14), color: colors.ink, padding: 0 }}
        />
      </View>
      {trailing}
    </View>
  );
}
