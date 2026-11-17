import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { api } from '../api/client';
import { colors, shadowSoft } from '../theme';

const EXAMPLES = [
  'Protect our girls and send them to school.',
  'Stop child marriage — every girl deserves a future.',
  'Elders and mothers, thank you for protecting our children.',
];

export default function TranslateScreen() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const go = async () => {
    if (!text.trim()) return;
    setBusy(true); setError(''); setResult('');
    try {
      const r = await api.translate(text);
      setResult(r.translated_text || r.translation || JSON.stringify(r));
    } catch (e: any) {
      setError(e?.message || 'Translation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>Role 02 · Translator</Text>
      <Text style={styles.h1}>English → Maa</Text>
      <Text style={styles.hint}>Draft an awareness message in Maa. First request can take 30–120s while the server loads the model on CPU; keep the app open and always review with a Maa speaker.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>English</Text>
        <TextInput
          style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
          multiline
          placeholder="e.g. Protect our girls and send them to school."
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
        />
        <View style={styles.rowWrap}>
          {EXAMPLES.map((e) => (
            <Pressable key={e} onPress={() => setText(e)} style={styles.chip}><Text style={styles.chipText}>{e}</Text></Pressable>
          ))}
        </View>
        <Pressable style={[styles.button, (busy || !text.trim()) && { opacity: 0.6 }]} onPress={go} disabled={busy || !text.trim()}>
          {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.buttonText}>Translate to Maa</Text>}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Maa (draft)</Text>
        {busy ? <Text style={styles.hint}>Translating… this may take a while on CPU. Please wait.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {result ? <Text style={styles.result}>{result}</Text> : !busy && <Text style={styles.hint}>Your results will appear here.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  eyebrow: { color: colors.primary, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700' },
  h1: { fontSize: 30, fontWeight: '700', color: colors.foreground },
  hint: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 10, ...shadowSoft },
  label: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.input, borderRadius: 14, padding: 12, fontSize: 15, color: colors.foreground },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: colors.secondary },
  chipText: { color: colors.foreground, fontSize: 12 },
  button: { backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 15 },
  error: { color: colors.destructive, backgroundColor: '#F9E3DF', padding: 10, borderRadius: 10 },
  result: { fontSize: 22, color: colors.foreground, lineHeight: 32, fontWeight: '600' },
});
