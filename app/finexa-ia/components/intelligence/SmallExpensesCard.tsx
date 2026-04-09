import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import { Coffee, Film, Utensils } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SmallExpensesCard({
  total = 929.0,
}: {
  total?: number;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.statusMicro}>[LEAK_DETECTOR: RUNNING]</Text>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gasto Hormiga</Text>
          <Text style={styles.totalValue}>${total.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.leakBadge}>
          <Text style={styles.leakBadgeText}>fuga detectada</Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        {/* Item 1 */}
        <View style={styles.listItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
              <Utensils size={18} color="#F97316" />
            </View>
            <View>
              <Text style={styles.itemName}>Uber Eats</Text>
              <Text style={styles.itemTime}>hace 2h</Text>
            </View>
          </View>
          <Text style={styles.itemAmount}>$340</Text>
        </View>

        {/* Item 2 */}
        <View style={styles.listItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
              <Film size={18} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.itemName}>Cinépolis</Text>
              <Text style={styles.itemTime}>ayer</Text>
            </View>
          </View>
          <Text style={styles.itemAmount}>$320</Text>
        </View>

        {/* Item 3 */}
        <View style={styles.listItem}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
              <Coffee size={18} color="#22C55E" />
            </View>
            <View>
              <Text style={styles.itemName}>Starbucks</Text>
              <Text style={styles.itemTime}>08:15 am</Text>
            </View>
          </View>
          <Text style={styles.itemAmount}>$115</Text>
        </View>
      </View>

      {/* Accent Bottom Right */}
      <View style={[styles.prismAccent, styles.prismAccentBr]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    ...Shadow.card,
    overflow: 'hidden',
    padding: Spacing.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(39, 75, 154, 0.08)',
    gap: Spacing.md,
  },
  statusMicro: {
    position: 'absolute',
    top: 8,
    right: 16,
    fontSize: 9,
    fontFamily: TextStyles.caption.fontFamily,
    color: 'rgba(0,0,0,0.3)',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  title: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 18,
    color: PrismColors.textPrimary,
  },
  totalValue: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 26,
    color: PrismColors.danger,
    marginTop: 4,
  },
  leakBadge: {
    backgroundColor: 'rgba(185, 28, 28, 0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(185, 28, 28, 0.2)',
  },
  leakBadgeText: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: PrismColors.danger,
    textTransform: 'uppercase',
  },
  listContainer: {
    gap: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 14,
    color: PrismColors.textPrimary,
  },
  itemTime: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    color: 'rgba(100, 116, 139, 0.7)',
    marginTop: 2,
  },
  itemAmount: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: PrismColors.textPrimary,
  },
  prismAccent: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 1,
  },
  prismAccentBr: {
    bottom: -1,
    right: -1,
    backgroundColor: PrismColors.danger,
    shadowColor: PrismColors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});
