import React, { useState } from 'react';
import { View, Image, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Text, Row, Btn } from '@/components/ui';
import { useAuth } from '@/services/auth';
import { LOGO_LIGHT } from '@/data/content';

const ONBOARDING_1 = require('../../assets/1.jpg');
const ONBOARDING_2 = require('../../assets/2.webp');
const ONBOARDING_3 = require('../../assets/3.webp');
const ONBOARDING_4 = require('../../assets/4.jpg');

const CARDS = [
  {
    image: ONBOARDING_2,
    badge: 'NO ACCOUNT NEEDED',
    title: 'Watch and listen\nfrom day one',
    body: 'Shorts, full messages, audio sermons and Sunday live, all open, nothing gated.',
  },
  {
    image: ONBOARDING_3,
    badge: 'EVERY SUNDAY',
    title: 'Never miss\na service',
    body: "We'll tell you the moment we go live, and the message is here to replay all week.",
  },
  {
    image: ONBOARDING_4,
    badge: 'COMMUNITY GROUPS',
    title: 'Find your\npeople',
    body: 'CSGs meet in person each week. Join one and its updates come straight to you.',
  },
];

export default function Onboarding() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { continueAsGuest } = useAuth();
  const [step, setStep] = useState(-1); // -1 = welcome

  const enter = async () => {
    await continueAsGuest();
    router.replace('/(tabs)');
  };

  if (step === -1) {
    return (
      <View style={{ flex: 1, backgroundColor: '#081A19' }}>
        <ImageBackground source={ONBOARDING_1} resizeMode="cover" style={{ flex: 1 }}>
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(8,26,25,0.88)']}
            locations={[0, 1]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%' }}
          />

          <Row gap={10} style={{ marginTop: insets.top + r.s(10), marginLeft: r.s(22) }}>
            <Image source={LOGO_LIGHT} style={{ width: r.s(30), height: r.s(30) }} resizeMode="contain" />
            <Text size={13} weight="extra" lh={1.15} color={colors.onDark}>The Beacon{'\n'}Centre</Text>
          </Row>

          <View style={{ flex: 1 }} />

          <View style={{ paddingHorizontal: r.s(22), paddingBottom: insets.bottom + r.s(26), maxWidth: r.contentWidth, width: '100%', alignSelf: 'center' }}>
            <Text size={40} weight="extra" lh={1.04} track={-0.038} color={colors.onDark}>
              Sermons, live{'\n'}services and{'\n'}a place to belong.
            </Text>
            <Text size={13.5} lh={1.65} color="rgba(243,241,236,0.66)" style={{ marginTop: r.s(16), maxWidth: r.s(300) }}>
              Everything works straight away. Make an account only when you want to save things.
            </Text>

            <Btn full label="Start exploring" style={{ marginTop: r.s(28), paddingVertical: r.s(17) }} onPress={() => setStep(0)} />
          </View>
        </ImageBackground>
      </View>
    );
  }

  const card = CARDS[step];
  const isLast = step === CARDS.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground, paddingTop: insets.top + r.s(10) }}>
      <View style={{ flex: 1, maxWidth: r.contentWidth, width: '100%', alignSelf: 'center' }}>
        <Row style={{ justifyContent: 'space-between', paddingHorizontal: r.s(20) }}>
          <Row gap={6}>
            {CARDS.map((_, i) => (
              <View key={i} style={{ width: i === step ? r.s(22) : r.s(5), height: r.s(5), borderRadius: 99, backgroundColor: i === step ? colors.ink : '#D5D0C6' }} />
            ))}
          </Row>
          <Pressable onPress={enter} hitSlop={12} style={{ minHeight: r.s(44), justifyContent: 'center' }}>
            <Text size={12.5} weight="bold" color={colors.muted}>Skip</Text>
          </Pressable>
        </Row>

        <View style={{ flex: 1, marginTop: r.s(20), marginHorizontal: r.s(20), borderRadius: radius.xxl, overflow: 'hidden', backgroundColor: colors.ink }}>
          <ImageBackground source={card.image} resizeMode="cover" style={{ flex: 1, justifyContent: 'flex-end' }}>
            <LinearGradient
              pointerEvents="none"
              colors={['transparent', 'rgba(18,16,15,0.85)']}
              locations={[0, 1]}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '42%' }}
            />
            <View style={{ padding: r.s(22) }}>
              <Row gap={7} style={{ alignSelf: 'flex-start', paddingVertical: r.s(7), paddingHorizontal: r.s(11), borderRadius: radius.xs, backgroundColor: 'rgba(255,255,255,0.14)' }}>
                <View style={{ width: r.s(6), height: r.s(6), borderRadius: 99, backgroundColor: colors.teal }} />
                <Text size={9.5} weight="extra" color="#fff" track={0.14}>{card.badge}</Text>
              </Row>
              <Text size={30} weight="extra" lh={1.1} track={-0.03} color="#fff" style={{ marginTop: r.s(16) }}>{card.title}</Text>
              <Text size={13} lh={1.65} color="rgba(255,255,255,0.65)" style={{ marginTop: r.s(12) }}>{card.body}</Text>
            </View>
          </ImageBackground>
        </View>

        <Row gap={12} style={{ padding: r.s(20), paddingBottom: insets.bottom + r.s(20) }}>
          <Btn
            full
            tone="ink"
            label={isLast ? 'Take me in' : 'Next'}
            style={{ flex: 1, paddingVertical: r.s(17) }}
            onPress={() => (isLast ? router.push('/onboarding/setup') : setStep(step + 1))}
          />
          <Pressable
            onPress={() => (isLast ? enter() : setStep(step + 1))}
            accessibilityLabel="Next"
            style={{ width: r.s(56), height: r.s(56), borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-forward" size={r.s(19)} color={colors.ink} />
          </Pressable>
        </Row>
      </View>
    </View>
  );
}
