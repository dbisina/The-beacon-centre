import React from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, HIT, useResponsive } from '@/theme';
import { Text, Row, Kicker } from '@/components/ui';
import { Answer, EventField } from '@/services/events';

/**
 * Renders a registration form the admin composed, one control per field type.
 * Values are kept as the member typed them; toApiAnswers() converts them to
 * what the server expects. The server validates everything again - these are
 * inputs, not the source of truth.
 */

export type FormValues = Record<string, Answer>;

/** DD/MM/YYYY as typed -> YYYY-MM-DD, or null if incomplete. */
function dateToIso(v: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** Adds the slashes as the member types digits. */
function maskDate(v: string): string {
  const d = v.replace(/[^0-9]/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join('/');
}
function maskTime(v: string): string {
  const d = v.replace(/[^0-9]/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
}

/** First problem a member can fix before sending, or null. */
export function firstProblem(fields: EventField[], values: FormValues): string | null {
  for (const f of fields) {
    const v = values[String(f.id)];
    const empty = v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (f.required) return `Please answer "${f.label}".`;
      continue;
    }
    if (f.type === 'DATE' && typeof v === 'string' && !dateToIso(v)) return `"${f.label}": use DD/MM/YYYY.`;
    if (f.type === 'TIME' && typeof v === 'string' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) return `"${f.label}": use a time like 14:30.`;
    if (f.type === 'EMAIL' && typeof v === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return `"${f.label}": that email doesn't look right.`;
  }
  return null;
}

export function toApiAnswers(fields: EventField[], values: FormValues): Record<string, Answer> {
  const out: Record<string, Answer> = {};
  for (const f of fields) {
    const k = String(f.id);
    const v = values[k];
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = f.type === 'DATE' && typeof v === 'string' ? dateToIso(v) ?? v : typeof v === 'string' ? v.trim() : v;
  }
  return out;
}

function Choice({ label, selected, multi, onPress }: { label: string; selected: boolean; multi: boolean; onPress: () => void }) {
  const r = useResponsive();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      style={{ minHeight: HIT, justifyContent: 'center' }}
    >
      <Row gap={10}>
        <Ionicons
          name={multi ? (selected ? 'checkbox' : 'square-outline') : selected ? 'radio-button-on' : 'radio-button-off'}
          size={r.s(20)}
          color={selected ? colors.tealDeep : colors.faint}
        />
        <Text size={13.5} style={{ flex: 1 }}>{label}</Text>
      </Row>
    </Pressable>
  );
}

export function EventFormFields({
  fields,
  values,
  onChange,
}: {
  fields: EventField[];
  values: FormValues;
  onChange: (next: FormValues) => void;
}) {
  const r = useResponsive();
  const set = (id: number, v: Answer) => onChange({ ...values, [String(id)]: v });
  const input = { minHeight: r.s(40), fontSize: r.fs(14), color: colors.ink } as const;

  return (
    <View style={{ gap: r.s(18) }}>
      {fields.map((f) => {
        const k = String(f.id);
        const v = values[k];
        const text = typeof v === 'string' ? v : '';
        const label = `${f.label}${f.required ? ' *' : ''}`;

        let control: React.ReactNode;
        switch (f.type) {
          case 'TEXTAREA':
            control = (
              <TextInput value={text} onChangeText={(t) => set(f.id, t)} multiline numberOfLines={4} textAlignVertical="top"
                placeholder={f.placeholder ?? ''} placeholderTextColor={colors.faint} accessibilityLabel={f.label}
                style={[input, { minHeight: r.s(90) }]} />
            );
            break;
          case 'DATE':
            control = (
              <TextInput value={text} onChangeText={(t) => set(f.id, maskDate(t))} keyboardType="number-pad" maxLength={10}
                placeholder="DD/MM/YYYY" placeholderTextColor={colors.faint} accessibilityLabel={`${f.label}, day month year`} style={input} />
            );
            break;
          case 'TIME':
            control = (
              <TextInput value={text} onChangeText={(t) => set(f.id, maskTime(t))} keyboardType="number-pad" maxLength={5}
                placeholder="HH:MM (24-hour)" placeholderTextColor={colors.faint} accessibilityLabel={`${f.label}, 24 hour time`} style={input} />
            );
            break;
          case 'SELECT':
          case 'RADIO':
            control = (
              <View>
                {f.options.map((o) => (
                  <Choice key={o} label={o} multi={false} selected={v === o} onPress={() => set(f.id, o)} />
                ))}
              </View>
            );
            break;
          case 'CHECKBOX': {
            const picked = Array.isArray(v) ? v : [];
            control = (
              <View>
                {f.options.map((o) => (
                  <Choice key={o} label={o} multi selected={picked.includes(o)}
                    onPress={() => set(f.id, picked.includes(o) ? picked.filter((x) => x !== o) : [...picked, o])} />
                ))}
              </View>
            );
            break;
          }
          case 'YES_NO':
            control = (
              <Row gap={8}>
                {[{ l: 'Yes', val: true }, { l: 'No', val: false }].map(({ l, val }) => {
                  const on = v === val;
                  return (
                    <Pressable key={l} onPress={() => set(f.id, val)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                      style={{ flex: 1, minHeight: HIT, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: on ? colors.teal : colors.surfaceAlt }}>
                      <Text size={13} weight={on ? 'extra' : 'semibold'} color={on ? colors.tealInk : colors.ink}>{l}</Text>
                    </Pressable>
                  );
                })}
              </Row>
            );
            break;
          default:
            control = (
              <TextInput value={text} onChangeText={(t) => set(f.id, t)}
                keyboardType={f.type === 'EMAIL' ? 'email-address' : f.type === 'PHONE' ? 'phone-pad' : f.type === 'NUMBER' ? 'numeric' : 'default'}
                autoCapitalize={f.type === 'EMAIL' ? 'none' : 'sentences'}
                autoComplete={f.type === 'EMAIL' ? 'email' : f.type === 'PHONE' ? 'tel' : 'off'}
                placeholder={f.placeholder ?? ''} placeholderTextColor={colors.faint} accessibilityLabel={f.label} style={input} />
            );
        }

        return (
          <View key={k}>
            <Kicker>{label}</Kicker>
            {f.helpText ? <Text size={11.5} color={colors.muted} style={{ marginTop: r.s(3) }}>{f.helpText}</Text> : null}
            <View style={{ marginTop: r.s(6) }}>{control}</View>
            <View style={{ height: 1, backgroundColor: colors.hairline, marginTop: r.s(8) }} />
          </View>
        );
      })}
    </View>
  );
}
