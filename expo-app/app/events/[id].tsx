import React, { useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Linking, Platform, KeyboardAvoidingView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, HIT, useResponsive } from '@/theme';
import { Text, Row, Card, Btn, Kicker } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/services/auth';
import { fetchEvent, setRsvp, clearRsvp, registerForEvent, eventWhen, ChurchEvent, RsvpStatus } from '@/services/events';
import { EventFormFields, FormValues, firstProblem, toApiAnswers } from '@/components/EventFormFields';
import { DateLeaf } from '@/components/EventBits';

const RSVP_OPTIONS: Array<{ status: RsvpStatus; label: string }> = [
  { status: 'GOING', label: 'Going' },
  { status: 'MAYBE', label: 'Maybe' },
  { status: 'NOT_GOING', label: "Can't go" },
];

/** Opens the system maps app at the event's place. */
function openMaps(e: ChurchEvent) {
  const q = encodeURIComponent([e.locationName, e.address].filter(Boolean).join(', '));
  const url = Platform.OS === 'ios' ? `http://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
  Linking.openURL(url).catch(() => {});
}

export default function EventDetail() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isMember } = useAuth();
  const [override, setOverride] = useState<ChurchEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState<FormValues>({});
  const [justRegistered, setJustRegistered] = useState(false);

  const loaded = useAsync<ChurchEvent | null>(() => fetchEvent(id).catch(() => null), null, [id, isMember]);
  const e = override ?? loaded.data;

  /** Runs an action; true if it worked. */
  async function act(fn: () => Promise<ChurchEvent>): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      setOverride(await fn());
      return true;
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitForm() {
    if (!e?.form) return;
    const problem = firstProblem(e.form.fields, values);
    if (problem) return setError(problem);
    // Only close the form on success - on failure the answers stay put and the
    // error shows under them, instead of claiming a registration that failed.
    if (await act(() => registerForEvent(e.id, toApiAnswers(e.form!.fields, values)))) {
      setJustRegistered(true);
      setFormOpen(false);
    }
  }

  if (loaded.loading && !e) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }
  if (!e) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center', padding: r.s(20) }}>
        <Text size={14} weight="bold" style={{ textAlign: 'center' }}>This event isn't available.</Text>
        <Btn label="Back" style={{ marginTop: r.s(16) }} onPress={() => router.back()} />
      </View>
    );
  }

  const full = e.spotsLeft === 0;
  const formClosed = !!e.form && (!e.form.isOpen || (!!e.form.closesAt && new Date(e.form.closesAt).getTime() < Date.now()));
  const places = e.capacity != null ? `${e.spotsLeft} of ${e.capacity} places left` : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + r.s(8),
          paddingBottom: insets.bottom + r.s(30),
          paddingHorizontal: r.s(16),
          maxWidth: r.contentWidth,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={6}
          style={{ width: r.s(HIT), height: r.s(HIT), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={r.s(20)} color={colors.ink} />
        </Pressable>

        <Row gap={16} style={{ marginTop: r.s(18), alignItems: 'center' }}>
          <DateLeaf iso={e.startsAt} size={64} />
          <View style={{ flex: 1 }}>
            <Kicker>Event</Kicker>
            <Text size={23} weight="extra" track={-0.03} style={{ marginTop: r.s(4) }}>{e.title}</Text>
          </View>
        </Row>

        <Card style={{ marginTop: r.s(18) }}>
          <Row gap={12}>
            <Ionicons name="time-outline" size={r.s(18)} color={colors.tealDeep} />
            <Text size={13} style={{ flex: 1 }}>
              {eventWhen(e)}
              {e.endsAt ? ` – ${new Date(e.endsAt).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}` : ''}
            </Text>
          </Row>
          {e.locationName || e.address ? (
            <Pressable onPress={() => openMaps(e)} accessibilityRole="link" accessibilityHint="Opens in Maps" style={{ marginTop: r.s(12) }}>
              <Row gap={12}>
                <Ionicons name="location-outline" size={r.s(18)} color={colors.tealDeep} />
                <View style={{ flex: 1 }}>
                  {e.locationName ? <Text size={13}>{e.locationName}</Text> : null}
                  {e.address ? <Text size={12} color={colors.muted}>{e.address}</Text> : null}
                </View>
                <Text size={12} weight="bold" color={colors.tealDeep}>Map</Text>
              </Row>
            </Pressable>
          ) : null}
          {places ? (
            <Row gap={12} style={{ marginTop: r.s(12) }}>
              <Ionicons name="people-outline" size={r.s(18)} color={colors.tealDeep} />
              <Text size={13} style={{ flex: 1 }}>{places}</Text>
            </Row>
          ) : null}
        </Card>

        <Text size={13.5} lh={1.65} color={colors.inkSoft} style={{ marginTop: r.s(16) }}>{e.content}</Text>

        {/* What you can do depends on the event and on you. */}
        <View style={{ marginTop: r.s(20) }}>
          {!e.form && !e.rsvpEnabled ? null : !isMember ? (
            <Btn full label={e.form ? 'Sign in to register' : 'Sign in to RSVP'} onPress={() => router.push('/auth')} />
          ) : e.form ? (
            e.mine?.registered ? (
              <Card bg={colors.tealPale}>
                <Row gap={10}>
                  <Ionicons name="checkmark-circle" size={r.s(20)} color={colors.tealDeep} />
                  <Text size={14} weight="extra" color={colors.tealDeep}>You're registered</Text>
                </Row>
                {justRegistered && e.form.confirmationMessage ? (
                  <Text size={13} lh={1.55} color={colors.inkSoft} style={{ marginTop: r.s(8) }}>{e.form.confirmationMessage}</Text>
                ) : null}
              </Card>
            ) : formClosed ? (
              <Card><Text size={13} color={colors.muted}>Registration for this event has closed.</Text></Card>
            ) : full ? (
              <Card><Text size={13} color={colors.muted}>This event is full.</Text></Card>
            ) : formOpen ? (
              <Card pad={18}>
                <Text size={16} weight="extra">{e.form.title}</Text>
                {e.form.description ? (
                  <Text size={12.5} lh={1.55} color={colors.muted} style={{ marginTop: r.s(4) }}>{e.form.description}</Text>
                ) : null}
                <View style={{ marginTop: r.s(16) }}>
                  <EventFormFields fields={e.form.fields} values={values} onChange={setValues} />
                </View>
                <Btn full label={busy ? 'Sending…' : 'Register'} disabled={busy} style={{ marginTop: r.s(18) }} onPress={submitForm} />
              </Card>
            ) : (
              <Btn full label="Register" onPress={() => { setError(null); setFormOpen(true); }} />
            )
          ) : (
            <>
              <Row gap={8}>
                {RSVP_OPTIONS.map((o) => {
                  const on = e.mine?.rsvp === o.status;
                  const blocked = o.status === 'GOING' && full && !on;
                  return (
                    <Pressable
                      key={o.status}
                      disabled={busy || blocked}
                      onPress={() => act(() => (on ? clearRsvp(e.id) : setRsvp(e.id, o.status)))}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on, disabled: busy || blocked }}
                      style={{
                        flex: 1, minHeight: HIT, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: on ? colors.teal : colors.surface, opacity: blocked ? 0.4 : 1,
                      }}
                    >
                      <Text size={13} weight={on ? 'extra' : 'semibold'} color={on ? colors.tealInk : colors.ink}>{o.label}</Text>
                    </Pressable>
                  );
                })}
              </Row>
              <Text size={11.5} color={colors.muted} style={{ marginTop: r.s(8), textAlign: 'center' }}>
                {full && e.mine?.rsvp !== 'GOING' ? 'This event is full.' : e.mine?.rsvp ? 'Tap your answer again to clear it.' : 'Let us know if you can make it.'}
              </Text>
            </>
          )}
          {error ? <Text size={11.5} color={colors.danger} style={{ marginTop: r.s(10) }}>{error}</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
