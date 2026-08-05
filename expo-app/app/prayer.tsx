import React, { useState } from 'react';
import { View, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row, Btn, Card } from '@/components/ui';
import { useAuth } from '@/services/auth';
import { submitPrayerRequest } from '@/services/prayerContact';

export default function Prayer() {
  const r = useResponsive();
  const { isMember, user } = useAuth();
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!body.trim()) {
      setError('Write what you would like the team to pray for.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitPrayerRequest({ name: name.trim() || undefined, body: body.trim(), isPrivate });
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? 'Could not send this right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Screen padBottom={20}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: r.s(80) }}>
          <View style={{ width: r.s(88), height: r.s(88), borderRadius: 99, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="heart" size={r.s(38)} color={colors.tealInk} />
          </View>
          <Text size={22} weight="extra" style={{ marginTop: r.s(22) }}>Sent</Text>
          <Text size={13} lh={1.6} color={colors.muted} style={{ marginTop: r.s(8), textAlign: 'center', maxWidth: r.s(260) }}>
            Your request has gone privately to the pastoral team. They'll be praying with you.
          </Text>
          <Btn label="Done" style={{ marginTop: r.s(24) }} onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padBottom={30}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text size={28} weight="extra" track={-0.03}>Prayer request</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Close"
          style={{ width: r.s(40), height: r.s(40), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={r.s(18)} color={colors.ink} />
        </Pressable>
      </Row>
      <Text size={12.5} lh={1.6} color={colors.muted} style={{ marginTop: r.s(8) }}>
        Sent privately to the pastoral team, never posted publicly.
      </Text>

      <Card style={{ marginTop: r.s(20) }}>
        {!isMember ? (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name (optional)"
            placeholderTextColor={colors.faint}
            style={{ minHeight: r.s(44), fontSize: r.fs(14), color: colors.ink, marginBottom: r.s(10) }}
          />
        ) : null}
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="What would you like us to pray for?"
          placeholderTextColor={colors.faint}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={{ minHeight: r.s(140), fontSize: r.fs(14), color: colors.ink }}
        />
      </Card>

      <Pressable onPress={() => setIsPrivate((v) => !v)}>
        <Row gap={12} style={{ marginTop: r.s(11), padding: r.s(15), borderRadius: radius.lg, backgroundColor: colors.surface }}>
          <View style={{ width: r.s(22), height: r.s(22), borderRadius: r.s(7), backgroundColor: isPrivate ? colors.teal : 'transparent', borderWidth: isPrivate ? 0 : 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
            {isPrivate ? <Ionicons name="checkmark" size={r.s(13)} color={colors.tealInk} /> : null}
          </View>
          <Text size={12.5} weight="bold" lh={1.5} style={{ flex: 1 }}>Keep this private to the pastoral team</Text>
        </Row>
      </Pressable>

      {error ? <Text size={11.5} color="#C4453C" style={{ marginTop: r.s(10) }}>{error}</Text> : null}

      <Btn
        full
        label={submitting ? 'Sending…' : 'Send prayer request'}
        tone="ink"
        disabled={submitting}
        style={{ marginTop: r.s(16), paddingVertical: r.s(17), opacity: submitting ? 0.7 : 1 }}
        onPress={submit}
      />
      {submitting ? <ActivityIndicator style={{ marginTop: r.s(10) }} color={colors.teal} /> : null}
    </Screen>
  );
}
