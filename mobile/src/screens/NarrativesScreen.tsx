import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, NarrativeRecord } from '../api/client';
import { colors, shadowSoft } from '../theme';

const catTone: Record<string, string> = { FGM: colors.risk4, 'Child marriage': colors.risk3, Other: colors.risk2, None: colors.mutedForeground };

export default function NarrativesScreen() {
  const [items, setItems] = useState<NarrativeRecord[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setErr('');
    try { setItems(await api.narratives()); }
    catch (e: any) { setErr(e?.message || 'Failed to load narratives'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      data={items}
      keyExtractor={(r, i) => r.narrative_id || String(i)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} colors={[colors.primary]} />}
      ListHeaderComponent={
        <View style={{ gap: 8 }}>
          <Text style={styles.eyebrow}>Archive</Text>
          <View style={styles.headerRow}>
            <Text style={styles.h1}>Narratives</Text>
            <Pressable onPress={() => load()} style={styles.refresh}><Text style={styles.refreshText}>Refresh</Text></Pressable>
          </View>
          {loading && !refreshing && <ActivityIndicator color={colors.primary} />}
          {err ? <Text style={styles.error}>{err}</Text> : null}
          {!loading && !err && !items.length ? <View style={styles.card}><Text style={styles.note}>No narratives yet. Capture one to get started.</Text></View> : null}
        </View>
      }
      renderItem={({ item: r }) => (
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>{r.language || '—'}</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>{r.sub_county || '—'}</Text></View>
            <View style={[styles.pred, { backgroundColor: catTone[r.prediction_label] || colors.muted }]}>
              <Text style={styles.predText}>{r.prediction_label || '—'}</Text>
            </View>
          </View>
          <Text style={styles.body} numberOfLines={4}>{r.narrative || ''}</Text>
          <Text style={styles.note}>{(r.discourse_stance || '') + (r.prediction_score ? ` • ${Math.round(r.prediction_score * 100)}%` : '')}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  eyebrow: { color: colors.primary, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { fontSize: 30, fontWeight: '700', color: colors.foreground },
  refresh: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: colors.card },
  refreshText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 14, gap: 8, ...shadowSoft },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  badge: { backgroundColor: colors.muted, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999 },
  badgeText: { fontSize: 12, color: colors.foreground, fontWeight: '600' },
  pred: { marginLeft: 'auto', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999 },
  predText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  body: { color: colors.foreground, fontSize: 14, lineHeight: 20 },
  error: { color: colors.destructive, backgroundColor: '#F9E3DF', padding: 10, borderRadius: 10 },
  note: { color: colors.mutedForeground, fontSize: 13 },
});
