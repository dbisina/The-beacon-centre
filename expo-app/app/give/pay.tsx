import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, HIT, useResponsive } from '@/theme';
import { Text, Row, Btn, Kicker } from '@/components/ui';
import { useAuth } from '@/services/auth';
import {
  initializeGiving,
  verifyGiving,
  fetchBankAccounts,
  ChurchBankAccount,
  GivingPurpose,
  GIVING_CALLBACK_URL,
} from '@/services/giving';
import { useAsync } from '@/hooks/useAsync';

type MethodKey = 'card' | 'transfer' | 'ussd' | 'wallet';

/**
 * Card giving (Paystack) is built end-to-end - initializeGiving/verifyGiving,
 * the checkout WebView and the receipt screen all still work. It is held back
 * until the Paystack account is live; flip `enabled` back to true here and the
 * whole flow returns, no other change needed.
 */
const CARD_ENABLED = false;

const METHODS: { key: MethodKey; icon: keyof typeof Ionicons.glyphMap; label: string; sub: string; enabled: boolean }[] = [
  { key: 'transfer', icon: 'business-outline', label: 'Bank transfer', sub: "Give directly to the church's account", enabled: true },
  { key: 'card', icon: 'card-outline', label: 'Pay with card', sub: CARD_ENABLED ? 'Secured by Paystack' : 'Coming soon', enabled: CARD_ENABLED },
  { key: 'ussd', icon: 'phone-portrait-outline', label: 'USSD', sub: 'Coming soon', enabled: false },
  { key: 'wallet', icon: 'wallet-outline', label: 'Apple Pay / Google Pay', sub: 'Coming soon', enabled: false },
];

const PURPOSE_LABEL: Record<GivingPurpose, string> = {
  TITHE: 'Tithe',
  OFFERING: 'Offering',
  SEED: 'Seed',
  PROJECT: 'Project',
};

/**
 * One bank detail with tap-to-copy. The whole row is the target rather than
 * just the icon - people are copying this while holding a phone in one hand
 * and their banking app is one switch away - and the button flips to a tick
 * in place instead of raising a toast, which would cover the very number
 * they are about to paste.
 */
function CopyField({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  const r = useResponsive();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The 1.8s reset fires after the user may well have left for their bank app;
  // clear it on unmount so it can't setState on a torn-down screen.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await Clipboard.setStringAsync(value);
    } catch {
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Pressable
      onPress={copy}
      accessibilityRole="button"
      accessibilityLabel={`Copy ${label.toLowerCase()}: ${value}`}
      accessibilityHint="Copies to your clipboard"
      hitSlop={8}
    >
      {({ pressed }) => (
        <Row gap={10} style={{ minHeight: HIT, opacity: pressed ? 0.6 : 1 }}>
          <View style={{ flex: 1 }}>
            <Kicker color={colors.faint}>{label}</Kicker>
            <Text
              size={emphasis ? 19 : 14}
              weight={emphasis ? 'extra' : 'bold'}
              track={emphasis ? -0.02 : undefined}
              style={{ marginTop: r.s(3) }}
            >
              {value}
            </Text>
          </View>
          <Row
            gap={5}
            style={{
              paddingHorizontal: r.s(11), paddingVertical: r.s(7),
              borderRadius: radius.pill,
              backgroundColor: copied ? colors.tealPale : colors.surfaceAlt,
            }}
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={r.s(13)}
              color={copied ? colors.tealDeep : colors.inkSoft}
            />
            <Text size={11} weight="bold" color={copied ? colors.tealDeep : colors.inkSoft}>
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </Row>
        </Row>
      )}
    </Pressable>
  );
}

export default function Pay() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { user, isMember } = useAuth();
  const params = useLocalSearchParams<{ amount: string; purpose: GivingPurpose; projectId?: string; projectTitle?: string }>();

  const amount = Number(params.amount) || 0;
  const purpose = (params.purpose as GivingPurpose) || 'TITHE';
  const projectId = params.projectId ? Number(params.projectId) : undefined;

  const [method, setMethod] = useState<MethodKey>(CARD_ENABLED ? 'card' : 'transfer');
  const [email, setEmail] = useState(user?.email ?? '');
  const [stage, setStage] = useState<'select' | 'checkout' | 'verifying'>('select');
  const [checkout, setCheckout] = useState<{ authorizationUrl: string; reference: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: bankAccounts, loading: bankLoading } = useAsync<ChurchBankAccount[]>(
    () => (method === 'transfer' ? fetchBankAccounts() : Promise.resolve([])),
    [],
    [method]
  );

  const emailValid = /\S+@\S+\.\S+/.test(email);
  const needsEmail = !isMember;

  async function startCardCheckout() {
    if (needsEmail && !emailValid) {
      setError('Enter a valid email so we can send your receipt.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await initializeGiving({
        amount,
        purpose,
        projectId,
        email: needsEmail ? email : undefined,
      });
      setCheckout(result);
      setStage('checkout');
    } catch (e: any) {
      setError(e?.message ?? 'Could not start checkout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCallback(url: string) {
    setStage('verifying');
    try {
      const query = url.split('?')[1] ?? '';
      const reference = new URLSearchParams(query).get('reference') ?? checkout?.reference;
      if (!reference) throw new Error('Missing payment reference');
      const tx = await verifyGiving(reference);
      if (tx.status === 'SUCCESS') {
        router.replace({
          pathname: '/give/receipt',
          params: {
            reference: tx.reference,
            amount: tx.amount,
            purpose: tx.purpose,
            channel: tx.channel ?? '',
            paidAt: tx.paidAt ?? '',
            projectTitle: params.projectTitle ?? '',
          },
        });
      } else {
        setError('Payment was not completed. You can try again.');
        setStage('select');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Could not verify payment.');
      setStage('select');
    }
  }

  if (stage === 'checkout' && checkout) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, paddingTop: insets.top }}>
        <Row style={{ justifyContent: 'space-between', paddingHorizontal: r.s(16), paddingBottom: r.s(10) }}>
          <Pressable onPress={() => setStage('select')} hitSlop={10}>
            <Ionicons name="chevron-back" size={r.s(22)} color={colors.ink} />
          </Pressable>
          <Text size={13} weight="bold">Secure checkout</Text>
          <View style={{ width: r.s(22) }} />
        </Row>
        <WebView
          source={{ uri: checkout.authorizationUrl }}
          style={{ flex: 1 }}
          onShouldStartLoadWithRequest={(req) => {
            if (req.url.startsWith(GIVING_CALLBACK_URL)) {
              handleCallback(req.url);
              return false;
            }
            return true;
          }}
        />
      </View>
    );
  }

  if (stage === 'verifying') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text size={13} weight="bold" style={{ marginTop: r.s(14) }}>Confirming your payment…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(18,16,15,0.55)', justifyContent: 'flex-end' }}>
      <Pressable style={{ flex: 1 }} onPress={() => router.back()} accessibilityLabel="Dismiss" />

      <View
        style={{
          borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
          backgroundColor: colors.ground,
          paddingTop: r.s(18), paddingHorizontal: r.s(16),
          paddingBottom: insets.bottom + r.s(20),
          maxWidth: r.contentWidth, width: '100%', alignSelf: 'center',
        }}
      >
        <View style={{ width: r.s(40), height: r.s(4), borderRadius: 99, backgroundColor: '#D8D3C9', alignSelf: 'center', marginBottom: r.s(18) }} />
        <Text size={22} weight="extra" track={-0.025}>How would you like to pay?</Text>
        <Text size={12.5} color={colors.muted} style={{ marginTop: r.s(6) }}>
          {params.projectTitle ? params.projectTitle : PURPOSE_LABEL[purpose]} · ₦{amount.toLocaleString('en-NG')}
        </Text>

        <View style={{ marginTop: r.s(18), gap: r.s(9) }}>
          {METHODS.map((m) => {
            const on = method === m.key;
            return (
              <Pressable key={m.key} onPress={() => m.enabled && setMethod(m.key)} disabled={!m.enabled}>
                <Row gap={13} style={{ padding: r.s(15), borderRadius: radius.lg, backgroundColor: on ? colors.teal : colors.surface, opacity: m.enabled ? 1 : 0.5 }}>
                  <View style={{ width: r.s(40), height: r.s(40), borderRadius: radius.sm, backgroundColor: on ? 'rgba(4,33,27,0.14)' : colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={m.icon} size={r.s(18)} color={on ? colors.tealInk : colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text size={13.5} weight={on ? 'extra' : 'bold'} color={on ? colors.tealInk : colors.ink}>{m.label}</Text>
                    <Text size={11} color={on ? 'rgba(4,33,27,0.72)' : colors.muted} style={{ marginTop: r.s(2) }}>{m.sub}</Text>
                  </View>
                  {on ? (
                    <View style={{ width: r.s(22), height: r.s(22), borderRadius: 99, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark" size={r.s(12)} color={colors.teal} />
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={r.s(16)} color={colors.faint} />
                  )}
                </Row>
              </Pressable>
            );
          })}
        </View>

        {method === 'card' && needsEmail ? (
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Your email, for the receipt"
            placeholderTextColor={colors.faint}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginTop: r.s(14), minHeight: r.s(46), borderRadius: radius.sm, backgroundColor: colors.surface, paddingHorizontal: r.s(14), color: colors.ink, fontSize: r.fs(14) }}
          />
        ) : null}

        {method === 'transfer' ? (
          <View style={{ marginTop: r.s(14), padding: r.s(15), borderRadius: radius.lg, backgroundColor: colors.surface }}>
            {bankLoading ? (
              <ActivityIndicator color={colors.teal} />
            ) : bankAccounts.length === 0 ? (
              <Text size={12.5} color={colors.muted}>
                No bank account is set up yet. Please check back shortly, or reach the church through Contact.
              </Text>
            ) : (
              bankAccounts.map((acc, i) => (
                <View
                  key={acc.id}
                  style={i ? { marginTop: r.s(14), paddingTop: r.s(14), borderTopWidth: 1, borderTopColor: colors.hairline } : null}
                >
                  <CopyField label="Bank" value={acc.bankName} />
                  <View style={{ height: r.s(8) }} />
                  <CopyField label="Account number" value={acc.accountNumber} emphasis />
                  <Text size={12} color={colors.muted} style={{ marginTop: r.s(8) }}>{acc.accountName}</Text>
                  {acc.instructions ? (
                    <Text size={11.5} color={colors.muted} style={{ marginTop: r.s(6) }}>{acc.instructions}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : null}

        {error ? (
          <Text size={11.5} color="#C4453C" style={{ marginTop: r.s(10) }}>{error}</Text>
        ) : null}

        {method === 'card' ? (
          <Btn
            full
            label={submitting ? 'Starting checkout…' : `Pay ₦${amount.toLocaleString('en-NG')}`}
            tone="ink"
            disabled={submitting}
            style={{ marginTop: r.s(18), paddingVertical: r.s(17), opacity: submitting ? 0.7 : 1 }}
            onPress={startCardCheckout}
          />
        ) : method === 'transfer' ? (
          <Btn full label="Done" tone="ink" style={{ marginTop: r.s(18), paddingVertical: r.s(17) }} onPress={() => router.back()} />
        ) : null}

        <Row gap={7} style={{ justifyContent: 'center', marginTop: r.s(12) }}>
          <Ionicons name="lock-closed-outline" size={r.s(13)} color={colors.faint} />
          <Text size={11} color={colors.faint}>
            {method === 'card'
              ? 'Secured by Paystack · card never stored'
              : 'Your transfer goes straight to the church account'}
          </Text>
        </Row>
      </View>
    </View>
  );
}
