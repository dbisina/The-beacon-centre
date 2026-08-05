import React, { useState } from 'react';
import { View, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row, Btn, Card } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/services/auth';
import { submitContact, ContactCategory } from '@/services/prayerContact';
import { fetchCsgs, Csg } from '@/services/csg';

const TITLES: Record<ContactCategory, string> = {
  GENERAL: 'Contact the church office',
  CSG: 'Message my CSG admin',
  PRAYER: 'Prayer request',
  TECHNICAL: 'Contact the developers',
  OTHER: 'Get in touch',
};

export default function Contact() {
  const r = useResponsive();
  const { user } = useAuth();
  const { category: categoryParam } = useLocalSearchParams<{ category?: ContactCategory }>();
  const category: ContactCategory = categoryParam ?? 'GENERAL';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [csgId, setCsgId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: csgs } = useAsync<Csg[]>(() => (category === 'CSG' ? fetchCsgs() : Promise.resolve([])), [], [category]);

  async function submit() {
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Name, email and a message are all required.');
      return;
    }
    if (category === 'CSG' && !csgId) {
      setError('Pick which CSG this is about.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitContact({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        category,
        csgId: csgId ?? undefined,
        message: message.trim(),
      });
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
            <Ionicons name="checkmark" size={r.s(38)} color={colors.tealInk} />
          </View>
          <Text size={22} weight="extra" style={{ marginTop: r.s(22) }}>Message sent</Text>
          <Text size={13} lh={1.6} color={colors.muted} style={{ marginTop: r.s(8), textAlign: 'center', maxWidth: r.s(260) }}>
            We'll get back to you at {email}.
          </Text>
          <Btn label="Done" style={{ marginTop: r.s(24) }} onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padBottom={30}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text size={26} weight="extra" track={-0.03} style={{ flex: 1 }}>{TITLES[category]}</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Close"
          style={{ width: r.s(40), height: r.s(40), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={r.s(18)} color={colors.ink} />
        </Pressable>
      </Row>

      {category === 'CSG' ? (
        <View style={{ marginTop: r.s(16) }}>
          <Text size={12} weight="bold" color={colors.muted} style={{ marginBottom: r.s(8) }}>Which CSG?</Text>
          <Row gap={7} style={{ flexWrap: 'wrap' }}>
            {csgs.map((c) => {
              const on = csgId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCsgId(c.id)}
                  style={{ minHeight: r.s(38), paddingVertical: r.s(9), paddingHorizontal: r.s(14), borderRadius: radius.sm, backgroundColor: on ? colors.ink : colors.surface }}
                >
                  <Text size={12} weight={on ? 'bold' : 'semibold'} color={on ? '#fff' : colors.ink}>{c.name}</Text>
                </Pressable>
              );
            })}
          </Row>
        </View>
      ) : null}

      <Card style={{ marginTop: r.s(18), gap: r.s(12) }}>
        <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.faint} style={{ minHeight: r.s(40), fontSize: r.fs(14), color: colors.ink }} />
        <View style={{ height: 1, backgroundColor: colors.hairline }} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.faint} keyboardType="email-address" autoCapitalize="none" style={{ minHeight: r.s(40), fontSize: r.fs(14), color: colors.ink }} />
        <View style={{ height: 1, backgroundColor: colors.hairline }} />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Phone (optional)" placeholderTextColor={colors.faint} keyboardType="phone-pad" style={{ minHeight: r.s(40), fontSize: r.fs(14), color: colors.ink }} />
        <View style={{ height: 1, backgroundColor: colors.hairline }} />
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Your message"
          placeholderTextColor={colors.faint}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={{ minHeight: r.s(110), fontSize: r.fs(14), color: colors.ink }}
        />
      </Card>

      {error ? <Text size={11.5} color="#C4453C" style={{ marginTop: r.s(10) }}>{error}</Text> : null}

      <Btn
        full
        label={submitting ? 'Sending…' : 'Send message'}
        tone="ink"
        disabled={submitting}
        style={{ marginTop: r.s(16), paddingVertical: r.s(17), opacity: submitting ? 0.7 : 1 }}
        onPress={submit}
      />
      {submitting ? <ActivityIndicator style={{ marginTop: r.s(10) }} color={colors.teal} /> : null}
    </Screen>
  );
}
