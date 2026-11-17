import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, API_BASE } from '../api/client';
import { colors, shadowSoft } from '../theme';

const HOW = [
  ['Listen', 'A field worker collects a story from the community. Only after the person agrees.'],
  ['Understand', 'The app flags words linked to cutting (ukeketaji) or early marriage (ndoa za mapema) and shows why.'],
  ['Act', 'Coordinators see where warning signs are growing and support communities early.'],
];

export default function HomeScreen({ navigation }: any) {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [detail, setDetail] = useState('');
  const [translation, setTranslation] = useState<{ available?: boolean; reason?: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const check = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setStatus('checking');
    try {
      const h = await api.health();
      setStatus('online');
      setDetail(h?.service || 'Backend reachable');
      if (h?.translation) setTranslation(h.translation);
      else {
        try { setTranslation(await api.translateStatus()); } catch { setTranslation(null); }
      }
    } catch (e: any) {
      setStatus('offline');
      setDetail(e?.message || 'Cannot reach backend');
      setTranslation(null);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { check(); }, []));

  const actions = [
    { to: 'Capture', n: '01', title: 'Field collector', desc: 'Record a Swahili or Maa narrative with consent and get explainable analysis.' },
    { to: 'Translate', n: '02', title: 'Translator', desc: 'Draft English awareness messages in Maa for outreach teams.' },
    { to: 'Narratives', n: '03', title: 'Archive', desc: 'Browse submitted narratives and review predictions.' },
    { to: 'Stats', n: '04', title: 'Stats', desc: 'See corpus totals, categories, languages, and stance.' },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => check(true)} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <View style={styles.hero}>
        <View style={styles.shukaRow}>
          {[colors.primary, colors.ink, colors.primary, colors.accent, colors.primary].map((c, i) => (
            <View key={i} style={{ flex: i === 1 ? 0.5 : 1, backgroundColor: c }} />
          ))}
        </View>
        <View style={styles.heroBody}>
          <Text style={styles.eyebrow}>Narok & Kajiado, Kenya</Text>
          <Text style={styles.heroTitle}>Listening to communities, so we can protect girls sooner.</Text>
          <Text style={styles.heroText}>
            People often talk about female genital mutilation and child marriage long before they happen. Kinga Binti helps local workers notice those conversations early, in Swahili and Maa.
          </Text>
          <View style={styles.statusPill}>
            <View style={[styles.dot, { backgroundColor: status === 'online' ? colors.success : status === 'checking' ? colors.warning : colors.destructive }]} />
            <Text style={styles.statusText}>
              {status === 'checking' ? 'Checking backend…' : status === 'online' ? 'Backend online' : 'Backend offline'}
            </Text>
          </View>
          <Text style={styles.apiText}>API: {API_BASE}</Text>
          {status === 'online' && translation ? (
            <Text style={styles.apiText}>Translation: {translation.available ? 'available' : 'unavailable'}{translation.reason ? ` · ${translation.reason}` : ''}</Text>
          ) : null}
          {status !== 'online' ? <Text style={styles.apiHint}>Set expo.extra.apiBaseUrl in mobile/app.json to your PC LAN IP and run backend on 0.0.0.0:8000 (same Wi-Fi), then restart Expo with -c.</Text> : null}
          {detail ? <Text style={styles.apiHint}>{detail}</Text> : null}
          <Pressable onPress={() => check()} style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Retry connection</Text></Pressable>
        </View>
      </View>

      <Text style={styles.sectionEyebrow}>How it works</Text>
      <View style={styles.howWrap}>
        {HOW.map(([t, d], i) => (
          <View key={t} style={styles.howItem}>
            <Text style={styles.howNum}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.howTitle}>{t}</Text>
              <Text style={styles.howDesc}>{d}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionEyebrow}>Get started</Text>
      <Text style={styles.sectionTitle}>Who are you today?</Text>
      <View style={{ gap: 12 }}>
        {actions.map((r) => (
          <Pressable key={r.to} onPress={() => navigation.navigate(r.to)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}>
            <Text style={styles.cardNum}>{r.n}</Text>
            <Text style={styles.cardTitle}>{r.title}</Text>
            <Text style={styles.cardDesc}>{r.desc}</Text>
            <View style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Open {r.to} →</Text></View>
          </Pressable>
        ))}
      </View>

      <View style={[styles.card, { marginTop: 8 }]}>
        <Text style={styles.cardTitle}>Built on trust</Text>
        <Text style={styles.cardDesc}>These stories are sensitive. Nothing is saved without permission, names are never stored next to stories, and anyone can ask for their story to be deleted at any time.</Text>
        {['Permission comes first — always', 'Explainable signals, not black-box decisions', 'Consent can be withdrawn', 'Research aid — human review required'].map((x) => (
          <View key={x} style={styles.trustRow}><Text style={styles.check}>✓</Text><Text style={styles.trustText}>{x}</Text></View>
        ))}
      </View>

      <Text style={styles.footer}>Narok & Kajiado Counties · Consent-first · Kenya DPA 2019 aligned</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32, gap: 14 },
  hero: { borderRadius: 24, overflow: 'hidden', backgroundColor: colors.ink, ...shadowSoft },
  shukaRow: { flexDirection: 'row', height: 8 },
  heroBody: { padding: 20 },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', fontWeight: '700' },
  heroTitle: { color: colors.inkForeground, fontSize: 30, lineHeight: 36, fontWeight: '700', marginTop: 10 },
  heroText: { color: 'rgba(244,234,215,0.85)', fontSize: 15, lineHeight: 22, marginTop: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: colors.inkForeground, fontSize: 12, fontWeight: '600' },
  apiText: { color: 'rgba(244,234,215,0.7)', fontSize: 12, marginTop: 8 },
  apiHint: { color: 'rgba(244,234,215,0.65)', fontSize: 12, marginTop: 4 },
  secondaryBtn: { marginTop: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(244,234,215,0.3)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  secondaryBtnText: { color: colors.inkForeground, fontSize: 13, fontWeight: '600' },
  sectionEyebrow: { color: colors.primary, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginTop: 8 },
  sectionTitle: { color: colors.foreground, fontSize: 28, fontWeight: '700', marginTop: 2 },
  howWrap: { gap: 12 },
  howItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  howNum: { fontSize: 36, fontWeight: '700', color: 'rgba(160,70,42,0.3)', width: 34 },
  howTitle: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  howDesc: { fontSize: 14, color: colors.mutedForeground, marginTop: 2, lineHeight: 20 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18, ...shadowSoft },
  cardNum: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  cardTitle: { color: colors.foreground, fontSize: 24, fontWeight: '700', marginTop: 4 },
  cardDesc: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, marginTop: 6 },
  primaryBtn: { marginTop: 14, alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  primaryBtnText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 14 },
  trustRow: { flexDirection: 'row', gap: 10, marginTop: 10, backgroundColor: colors.muted, borderRadius: 12, padding: 10 },
  check: { color: colors.success, fontWeight: '700' },
  trustText: { color: colors.foreground, flex: 1, fontSize: 13 },
  footer: { textAlign: 'center', color: colors.mutedForeground, fontSize: 12, marginTop: 6 },
});
