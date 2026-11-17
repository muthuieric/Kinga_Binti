import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { colors, shadowSoft } from '../theme';

export default function StatsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setErr('');
    try { setStats(await api.stats()); }
    catch (e: any) { setErr(e?.message || 'Failed to load stats'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const Section = ({ title, data }: { title: string; data?: Record<string, number> }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {data && Object.keys(data).length ? Object.entries(data).map(([k, v]) => (
        <View key={k} style={styles.row}><Text style={styles.k}>{k}</Text><View style={styles.valPill}><Text style={styles.v}>{String(v)}</Text></View></View>
      )) : <Text style={styles.note}>No data</Text>}
    </View>
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <Text style={styles.eyebrow}>Overview</Text>
      <View style={styles.headerRow}>
        <Text style={styles.h1}>Corpus stats</Text>
        <Pressable onPress={() => load()} style={styles.refresh}><Text style={styles.refreshText}>Refresh</Text></Pressable>
      </View>
      {loading && !refreshing && <ActivityIndicator color={colors.primary} />}
      {err ? <Text style={styles.error}>{err}</Text> : null}
      {stats && (
        <>
          <View style={styles.heroRow}>
            <View style={[styles.metric, { backgroundColor: colors.ink }]}>
              <Text style={styles.metricLabel}>Total narratives</Text>
              <Text style={styles.metricValue}>{stats.total_narratives}</Text>
            </View>
            <View style={[styles.metric, { backgroundColor: colors.primary }]}>
              <Text style={styles.metricLabel}>Consent compliance</Text>
              <Text style={styles.metricValue}>{Math.round((stats.consent_compliance_rate || 0) * 100)}%</Text>
            </View>
          </View>
          <Section title="By language" data={stats.by_language} />
          <Section title="By category" data={stats.by_category} />
          <Section title="By sub-county" data={stats.by_sub_county} />
          <Section title="By stance" data={stats.by_stance} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  eyebrow: { color: colors.primary, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { fontSize: 30, fontWeight: '700', color: colors.foreground },
  refresh: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: colors.card },
  refreshText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
  heroRow: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, borderRadius: 18, padding: 14 },
  metricLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  metricValue: { color: '#fff', fontSize: 30, fontWeight: '700', marginTop: 4 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 14, ...shadowSoft },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.muted },
  k: { color: colors.foreground, flex: 1, fontSize: 14 },
  valPill: { backgroundColor: colors.secondary, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 10 },
  v: { color: colors.foreground, fontWeight: '700' },
  error: { color: colors.destructive, backgroundColor: '#F9E3DF', padding: 10, borderRadius: 10 },
  note: { color: colors.mutedForeground },
});
