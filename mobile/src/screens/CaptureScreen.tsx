import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Switch, ActivityIndicator } from 'react-native';
import { api, BackendAnalysis } from '../api/client';
import { SUB_COUNTIES, AGE_BANDS, GENDERS, LABELS, CATEGORY_LABEL, Category } from '../constants';
import { colors, shadowSoft } from '../theme';

const catMap: Record<string, Category> = { FGM: 'fgm', 'Child marriage': 'child_marriage', Other: 'other', None: 'none' };

const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

export default function CaptureScreen() {
  const [narrative, setNarrative] = useState('');
  const [language, setLanguage] = useState<'English' | 'Swahili' | 'Maa'>('English');
  const [ageBand, setAgeBand] = useState(AGE_BANDS[1]);
  const [gender, setGender] = useState(GENDERS[0]);
  const [subCounty, setSubCounty] = useState(SUB_COUNTIES[0]);
  const [sourceOrg, setSourceOrg] = useState('Tareto Africa Trust');
  const [label, setLabel] = useState(LABELS[0]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ id: string; analysis: BackendAnalysis } | null>(null);

  const resetForNext = () => {
    setNarrative('');
    setConsent(false);
    setError('');
    setResult(null);
  };

  const submit = async () => {
    setError('');
    if (!consent) return setError('Consent required — nothing is stored without informed consent.');
    if (narrative.trim().length < 5) return setError('Please enter a longer narrative.');
    setBusy(true);
    try {
      const res = await api.submit({
        narrative,
        language,
        age_band: ageBand,
        gender,
        sub_county: subCounty,
        source_org: sourceOrg,
        label,
        consent_given: true,
      });
      setResult({ id: res.narrative_id, analysis: res.analysis });
    } catch (e: any) {
      setError(e?.message || 'Submission failed');
    } finally {
      setBusy(false);
    }
  };

  const cat = result ? (catMap[result.analysis.prediction_label] || 'none') : 'none';
  const score = Math.round((result?.analysis.prediction_score || 0) * 100);
  const breakdown = Object.entries(result?.analysis.confidence_breakdown || {}).sort((a, b) => (b[1] as number) - (a[1] as number));

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>Step 1 · Capture</Text>
      <Text style={styles.h1}>Record a community narrative</Text>
      <Text style={styles.hint}>Type a Swahili or Maa narrative. Consent is mandatory before analysis and storage.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Narrative language</Text>
        <View style={styles.row}>
          {(['English', 'Swahili', 'Maa'] as const).map((l) => <Chip key={l} label={l} active={language === l} onPress={() => setLanguage(l)} />)}
        </View>

        <Text style={styles.label}>Narrative</Text>
        <TextInput
          style={[styles.input, { minHeight: 130, textAlignVertical: 'top' }]}
          multiline
          placeholder="e.g. Wazee wanasema ukeketaji ni desturi..."
          placeholderTextColor={colors.mutedForeground}
          value={narrative}
          onChangeText={setNarrative}
        />

        <Text style={styles.label}>Sub-county</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.row}>
          {SUB_COUNTIES.map((s) => <Chip key={s} label={s} active={subCounty === s} onPress={() => setSubCounty(s)} />)}
        </View></ScrollView>

        <Text style={styles.label}>Age band</Text>
        <View style={styles.rowWrap}>{AGE_BANDS.map((a) => <Chip key={a} label={a} active={ageBand === a} onPress={() => setAgeBand(a)} />)}</View>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.rowWrap}>{GENDERS.map((g) => <Chip key={g} label={g} active={gender === g} onPress={() => setGender(g)} />)}</View>

        <Text style={styles.label}>Ground-truth label</Text>
        <View style={styles.rowWrap}>{LABELS.map((l) => <Chip key={l} label={l} active={label === l} onPress={() => setLabel(l)} />)}</View>

        <Text style={styles.label}>Source organisation</Text>
        <TextInput style={styles.input} value={sourceOrg} onChangeText={setSourceOrg} placeholder="Source organisation" placeholderTextColor={colors.mutedForeground} />

        <View style={styles.consentBox}>
          <Switch value={consent} onValueChange={setConsent} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          <Text style={styles.consentText}><Text style={{ fontWeight: '700' }}>Informed consent given.</Text> The narrator understands how this is used and can withdraw at any time.</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.buttonText}>Analyse & submit</Text>}
        </Pressable>
      </View>

      {result ? (
        <View style={styles.card}>
          <View style={styles.resultHeader}>
            <Text style={styles.cardEyebrow}>Classification result</Text>
            <Pressable onPress={resetForNext} style={styles.smallBtn}><Text style={styles.smallBtnText}>New entry</Text></Pressable>
          </View>
          <Text style={styles.resultTitle}>{CATEGORY_LABEL[cat]}</Text>
          <Text style={styles.score}>{score}% confidence</Text>
          <Text style={styles.meta}>ID: KB-NAR-{result.id.slice(0, 8).toUpperCase()} · Stance: {result.analysis.discourse_stance || '—'}</Text>
          {breakdown.length ? (
            <View style={{ marginTop: 6, gap: 6 }}>
              <Text style={styles.label}>Confidence breakdown</Text>
              {breakdown.map(([k, v]) => (
                <View key={k} style={styles.barRow}>
                  <Text style={styles.barLabel}>{k}</Text>
                  <View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.round((v as number) * 100)}%` }]} /></View>
                  <Text style={styles.barVal}>{Math.round((v as number) * 100)}%</Text>
                </View>
              ))}
            </View>
          ) : null}
          {result.analysis.cultural_context_notes ? <Text style={styles.note}>{result.analysis.cultural_context_notes}</Text> : null}
          {result.analysis.detected_markers?.length ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Detected markers</Text>
              <View style={styles.rowWrap}>
                {result.analysis.detected_markers.slice(0, 12).map((m, i) => (
                  <View key={i} style={styles.marker}><Text style={styles.markerText}>{m.term}{m.meaning ? ` · ${m.meaning}` : ''}</Text></View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}>
          <Text style={styles.resultTitle}>Awaiting narrative</Text>
          <Text style={styles.hint}>Results, markers and confidence appear here.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  eyebrow: { color: colors.primary, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700' },
  h1: { fontSize: 30, fontWeight: '700', color: colors.foreground },
  hint: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 10, ...shadowSoft },
  label: { fontSize: 13, fontWeight: '700', color: colors.foreground, marginTop: 2 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.input, borderRadius: 14, padding: 12, fontSize: 15, color: colors.foreground },
  row: { flexDirection: 'row', gap: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.foreground, fontSize: 13 },
  chipTextActive: { color: colors.primaryForeground, fontWeight: '700' },
  consentBox: { flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(160,70,42,0.35)', borderRadius: 14, padding: 12, marginTop: 4 },
  consentText: { flex: 1, color: colors.foreground, fontSize: 13, lineHeight: 18 },
  button: { backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 15 },
  error: { color: colors.destructive, backgroundColor: '#F9E3DF', padding: 10, borderRadius: 10 },
  cardEyebrow: { color: colors.mutedForeground, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: colors.secondary },
  smallBtnText: { color: colors.foreground, fontSize: 12, fontWeight: '700' },
  resultTitle: { fontSize: 26, fontWeight: '700', color: colors.foreground },
  score: { fontSize: 22, fontWeight: '700', color: colors.primary },
  meta: { color: colors.mutedForeground, fontSize: 13 },
  note: { color: colors.foreground, fontSize: 14, lineHeight: 20, backgroundColor: colors.muted, padding: 10, borderRadius: 12, marginTop: 4 },
  marker: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: colors.secondary },
  markerText: { fontSize: 12, color: colors.foreground },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 90, fontSize: 12, color: colors.foreground },
  barTrack: { flex: 1, height: 8, borderRadius: 999, backgroundColor: colors.muted, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 999, backgroundColor: colors.primary },
  barVal: { width: 36, fontSize: 12, color: colors.mutedForeground, textAlign: 'right' },
});
