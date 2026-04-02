import { ChevronDown } from '@/constants/lucideIcons';
import type { PhoneCountry } from '@/constants/phoneCountries';
import { PHONE_COUNTRIES } from '@/constants/phoneCountries';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, PrismColors } from '@/constants/theme';
import { BorderColors, Radius, Spacing, TextStyles } from '@/constants/uiStyles';

const F = Fonts!;

type AuthPhoneFieldProps = {
  label: string;
  country: PhoneCountry;
  onSelectCountry: (c: PhoneCountry) => void;
  nationalDigits: string;
  onChangeNationalDigits: (digits: string) => void;
};

export function AuthPhoneField({
  label,
  country,
  onSelectCountry,
  nationalDigits,
  onChangeNationalDigits,
}: AuthPhoneFieldProps) {
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.dial.includes(q),
    );
  }, [query]);

  function onNationalInput(text: string) {
    const d = text.replace(/\D/g, '').slice(0, country.maxNationalDigits);
    onChangeNationalDigits(d);
  }

  const placeholder =
    country.iso === 'MX'
      ? '55 1234 5678'
      : country.iso === 'AR'
        ? '9 11 2345 6789'
        : 'Número sin código de país';

  return (
    <View style={styles.field}>
      <Text style={[TextStyles.labelUppercase, styles.label]}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [styles.countryBtn, pressed && styles.countryBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Elegir país">
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={styles.dialText}>+{country.dial}</Text>
          <ChevronDown size={18} color={PrismColors.textSecondary} strokeWidth={2} />
        </Pressable>
        <TextInput
          value={nationalDigits}
          onChangeText={onNationalInput}
          placeholder={placeholder}
          placeholderTextColor={`${PrismColors.textSecondary}99`}
          keyboardType="phone-pad"
          autoComplete="tel-national"
          textContentType="telephoneNumber"
          autoCapitalize="none"
          style={styles.nationalInput}
        />
      </View>
      <Text style={styles.hint}>
        País: {country.name}. Solo el número local ({country.maxNationalDigits} dígitos máx.); el +{country.dial} se
        agrega solo.
      </Text>

      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <Text style={styles.sheetTitle}>País o región</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar país o código…"
              placeholderTextColor={`${PrismColors.textSecondary}99`}
              style={styles.search}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.iso}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelectCountry(item);
                    onChangeNationalDigits(
                      nationalDigits.slice(0, item.maxNationalDigits),
                    );
                    setPickerOpen(false);
                    setQuery('');
                  }}
                  style={({ pressed }) => [styles.countryRow, pressed && styles.countryRowPressed]}>
                  <Text style={styles.countryRowFlag}>{item.flag}</Text>
                  <View style={styles.countryRowText}>
                    <Text style={styles.countryRowName}>{item.name}</Text>
                    <Text style={styles.countryRowDial}>+{item.dial}</Text>
                  </View>
                  {item.iso === country.iso ? (
                    <Text style={styles.check}>✓</Text>
                  ) : (
                    <View style={styles.checkPlaceholder} />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>No hay resultados.</Text>
              }
            />
            {Platform.OS === 'ios' ? (
              <Pressable onPress={() => setPickerOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Cerrar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.sm,
  },
  label: {
    marginLeft: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: PrismColors.neutral,
    minHeight: 52,
  },
  countryBtnPressed: {
    opacity: 0.9,
  },
  flag: {
    fontSize: 22,
  },
  dialText: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: PrismColors.textPrimary,
  },
  nationalInput: {
    flex: 1,
    borderRadius: Radius.full,
    backgroundColor: PrismColors.neutral,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
    fontFamily: F.sansMedium,
    fontSize: 15,
    color: PrismColors.textPrimary,
    letterSpacing: 0.3,
  },
  hint: {
    marginLeft: Spacing.xs,
    marginTop: -Spacing.xs,
    fontFamily: F.sans,
    fontSize: 11,
    lineHeight: 16,
    color: PrismColors.textSecondary,
  },
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: PrismColors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '72%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sheetTitle: {
    fontFamily: F.sansBold,
    fontSize: 18,
    color: PrismColors.textPrimary,
    marginBottom: Spacing.md,
  },
  search: {
    borderRadius: Radius.full,
    backgroundColor: PrismColors.neutral,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    fontFamily: F.sansMedium,
    fontSize: 15,
    color: PrismColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  list: {
    flexGrow: 0,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BorderColors.subtle,
    gap: Spacing.md,
  },
  countryRowPressed: {
    opacity: 0.85,
  },
  countryRowFlag: {
    fontSize: 24,
  },
  countryRowText: {
    flex: 1,
  },
  countryRowName: {
    fontFamily: F.sansMedium,
    fontSize: 16,
    color: PrismColors.textPrimary,
  },
  countryRowDial: {
    fontFamily: F.sans,
    fontSize: 13,
    color: PrismColors.textSecondary,
    marginTop: 2,
  },
  check: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: PrismColors.primary,
    width: 24,
    textAlign: 'center',
  },
  checkPlaceholder: {
    width: 24,
  },
  empty: {
    fontFamily: F.sans,
    fontSize: 14,
    color: PrismColors.textSecondary,
    paddingVertical: Spacing.xl,
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  closeBtnText: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: PrismColors.primary,
  },
});
