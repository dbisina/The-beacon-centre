import React, { useRef, useState } from 'react';
import { View, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, HIT, useResponsive } from '@/theme';
import { Screen, Text, Row, Btn, Card, Kicker } from '@/components/ui';
import { useAuth } from '@/services/auth';
import { requestToJoinCsg } from '@/services/csg';

/**
 * Asking to join a community group. The details go to that group's leaders,
 * who approve the request; other members only ever see the name.
 *
 * Date of birth is three number fields rather than a date wheel: scrolling a
 * picker back thirty or sixty years is slow, and typed digits need no native
 * module. The server re-validates everything (backend csg.service.ts,
 * validateJoinRequest) - these checks are only for a fast, friendly answer.
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Kicker>{label}</Kicker>
      {children}
    </View>
  );
}

const onlyDigits = (v: string, max: number) => v.replace(/[^0-9]/g, '').slice(0, max);

/** YYYY-MM-DD if the three parts make a real past date, else an error. */
function composeDob(day: string, month: string, year: string, now = new Date()): { ok: true; iso: string } | { ok: false; error: string } {
  if (!day || !month || year.length !== 4) return { ok: false, error: 'Please enter your full date of birth.' };
  const d = Number(day), m = Number(month), y = Number(year);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (m < 1 || m > 12 || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return { ok: false, error: "That date of birth isn't a real date." };
  }
  if (date.getTime() >= now.getTime()) return { ok: false, error: 'Your date of birth must be in the past.' };
  if (now.getUTCFullYear() - y > 120) return { ok: false, error: 'Please check the year.' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return { ok: true, iso: `${y}-${pad(m)}-${pad(d)}` };
}

export default function JoinCsg() {
  const r = useResponsive();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.displayName ?? '');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const streetRef = useRef<TextInput>(null);
  const areaRef = useRef<TextInput>(null);

  const inputStyle = { minHeight: r.s(40), fontSize: r.fs(14), color: colors.ink } as const;
  const complete =
    fullName.trim().length >= 2 && day.length > 0 && month.length > 0 && year.length === 4 &&
    street.trim().length >= 3 && area.trim().length >= 2;

  async function submit() {
    if (!complete || submitting) return;
    const dob = composeDob(day, month, year);
    if (!dob.ok) {
      setError(dob.error);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestToJoinCsg(id, {
        fullName: fullName.trim(),
        dateOfBirth: dob.iso,
        addressStreet: street.trim(),
        addressArea: area.trim(),
      });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Could not send your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen padBottom={30}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={6}
            style={{ width: r.s(40), height: r.s(40), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close" size={r.s(18)} color={colors.ink} />
          </Pressable>
        </Row>

        <Text size={26} weight="extra" track={-0.03} style={{ marginTop: r.s(18) }}>
          Ask to join{name ? ` ${name}` : ''}
        </Text>
        <Text size={13} lh={1.6} color={colors.muted} style={{ marginTop: r.s(6) }}>
          A group leader will look at your request and let you in.
        </Text>

        <Card style={{ marginTop: r.s(22), gap: r.s(12) }}>
          <Field label="Full name">
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="As you'd like the group to know you"
              placeholderTextColor={colors.faint}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              accessibilityLabel="Full name"
              style={inputStyle}
            />
          </Field>
          <View style={{ height: 1, backgroundColor: colors.hairline }} />

          <Field label="Date of birth">
            <Row gap={8} style={{ alignItems: 'center' }}>
              <TextInput
                value={day}
                onChangeText={(v) => {
                  const next = onlyDigits(v, 2);
                  setDay(next);
                  if (next.length === 2) monthRef.current?.focus();
                }}
                placeholder="DD"
                placeholderTextColor={colors.faint}
                keyboardType="number-pad"
                maxLength={2}
                accessibilityLabel="Day of birth"
                style={[inputStyle, { width: r.s(44), textAlign: 'center' }]}
              />
              <Text size={14} color={colors.faint}>/</Text>
              <TextInput
                ref={monthRef}
                value={month}
                onChangeText={(v) => {
                  const next = onlyDigits(v, 2);
                  setMonth(next);
                  if (next.length === 2) yearRef.current?.focus();
                }}
                placeholder="MM"
                placeholderTextColor={colors.faint}
                keyboardType="number-pad"
                maxLength={2}
                accessibilityLabel="Month of birth"
                style={[inputStyle, { width: r.s(44), textAlign: 'center' }]}
              />
              <Text size={14} color={colors.faint}>/</Text>
              <TextInput
                ref={yearRef}
                value={year}
                onChangeText={(v) => {
                  const next = onlyDigits(v, 4);
                  setYear(next);
                  if (next.length === 4) streetRef.current?.focus();
                }}
                placeholder="YYYY"
                placeholderTextColor={colors.faint}
                keyboardType="number-pad"
                maxLength={4}
                accessibilityLabel="Year of birth"
                style={[inputStyle, { width: r.s(64), textAlign: 'center' }]}
              />
            </Row>
          </Field>
          <View style={{ height: 1, backgroundColor: colors.hairline }} />

          <Field label="Street address">
            <TextInput
              ref={streetRef}
              value={street}
              onChangeText={setStreet}
              placeholder="House number and street"
              placeholderTextColor={colors.faint}
              autoCapitalize="words"
              autoComplete="street-address"
              textContentType="streetAddressLine1"
              returnKeyType="next"
              onSubmitEditing={() => areaRef.current?.focus()}
              accessibilityLabel="Street address"
              style={inputStyle}
            />
          </Field>
          <View style={{ height: 1, backgroundColor: colors.hairline }} />

          <Field label="Area">
            <TextInput
              ref={areaRef}
              value={area}
              onChangeText={setArea}
              placeholder="e.g. Oluyole, Ring Road"
              placeholderTextColor={colors.faint}
              autoCapitalize="words"
              textContentType="sublocality"
              returnKeyType="done"
              onSubmitEditing={submit}
              accessibilityLabel="Area"
              style={inputStyle}
            />
          </Field>
        </Card>

        <Row gap={10} style={{ marginTop: r.s(14), alignItems: 'flex-start' }}>
          <Ionicons name="shield-checkmark-outline" size={r.s(16)} color={colors.tealDeep} style={{ marginTop: 1 }} />
          <Text size={12} lh={1.55} color={colors.muted} style={{ flex: 1 }}>
            Only this group's leaders see your date of birth and address. Other members see your name.
          </Text>
        </Row>

        {error ? <Text size={11.5} color={colors.danger} style={{ marginTop: r.s(12) }}>{error}</Text> : null}

        <Btn
          full
          label={submitting ? 'Sending…' : 'Send request'}
          left={submitting ? <ActivityIndicator color={colors.tealInk} /> : undefined}
          disabled={!complete || submitting}
          style={{ marginTop: r.s(18), paddingVertical: r.s(16), minHeight: HIT, opacity: complete && !submitting ? 1 : 0.5 }}
          onPress={submit}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
