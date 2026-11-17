import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

const SHUKA = [colors.primary, colors.ink, colors.primary, colors.accent, colors.primary];

export default function BrandHeader({
  subtitle = 'Community Narrative Monitor',
}: {
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.stripeRow}>
        {SHUKA.map((c, i) => (
          <View key={i} style={[styles.stripe, { backgroundColor: c, flex: i === 1 ? 0.5 : 1 }]} />
        ))}
      </View>
      <View style={styles.row}>
        <View style={styles.logo}><Text style={styles.logoText}>N</Text></View>
        <View>
          <Text style={styles.title}>Kinga Binti</Text>
          <Text style={styles.sub}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  stripeRow: { flexDirection: 'row', height: 6 },
  stripe: { height: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  logo: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 18 },
  title: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  sub: { fontSize: 11, color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1.2 },
});
