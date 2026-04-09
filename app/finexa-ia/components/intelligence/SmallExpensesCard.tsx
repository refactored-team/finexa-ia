import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import { Coffee, Film, Utensils, AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Insight } from '@/src/types/transactions';

export default function SmallExpensesCard({
  total = 0,
  items = [],
}: {
  total?: number;
  items?: Insight[];
}) {
  return (
    <View style={styles.container}>
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
        {items.map((item, index) => {
          // Dynamic icon selection mostly based on affected_category or title mapping
          let IconComp = Utensils;
          let iconColor = '#F97316';
          let bgColor = '#FFF7ED';
          let borderColor = '#FFEDD5';
          
          const cat = (item.affected_category || item.title || '').toLowerCase();
          if (cat.includes('coffee') || cat.includes('cafe') || cat.includes('starbucks')) {
             IconComp = Coffee;
             iconColor = '#22C55E';
             bgColor = '#F0FDF4';
             borderColor = '#DCFCE7';
          } else if (cat.includes('film') || cat.includes('cine') || cat.includes('movie')) {
             IconComp = Film;
             iconColor = '#3B82F6';
             bgColor = '#EFF6FF';
             borderColor = '#DBEAFE';
          } else if (!cat.includes('food') && !cat.includes('eats') && !cat.includes('uber')) {
             IconComp = AlertTriangle;
             iconColor = PrismColors.danger;
             bgColor = 'rgba(185, 28, 28, 0.05)';
             borderColor = 'rgba(185, 28, 28, 0.2)';
          }

          return (
            <View key={item.id || index} style={styles.listItem}>
              <View style={styles.itemLeft}>
                <View style={[styles.iconWrap, { backgroundColor: bgColor, borderColor: borderColor }]}>
                  <IconComp size={18} color={iconColor} />
                </View>
                <View>
                  <Text style={styles.itemName}>{item.title}</Text>
                  <Text style={styles.itemTime}>
                    {item.priority ? `Prioridad: ${item.priority}` : 'Hace poco'}
                  </Text>
                </View>
              </View>
              <Text style={styles.itemAmount}>${item.potential_monthly_saving}</Text>
            </View>
          );
        })}
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
    color: '#0F172A',
    fontWeight: '700',
  },
  totalValue: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 26,
    color: PrismColors.danger,
    marginTop: 4,
    fontWeight: '700',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
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
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  itemTime: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  itemAmount: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
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
