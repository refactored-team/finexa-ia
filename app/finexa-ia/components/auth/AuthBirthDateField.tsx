import { Calendar, ChevronDown, type LucideIcon } from '@/constants/lucideIcons';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { Fonts, PrismColors } from '@/constants/theme';
import { Radius, Spacing, TextStyles } from '@/constants/uiStyles';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { isValidBirthdate } from '@/lib/auth/cognito';

const F = Fonts!;

function parseIsoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return new Date(2000, 0, 15);
  return new Date(y, m - 1, d);
}

function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const mo = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplay(iso: string): string {
  if (!iso || !isValidBirthdate(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type AuthBirthDateFieldProps = {
  label: string;
  /** YYYY-MM-DD */
  value: string;
  onChangeIso: (iso: string) => void;
  icon?: LucideIcon;
};

const MIN_DATE = new Date(1900, 0, 1);

export function AuthBirthDateField({
  label,
  value,
  onChangeIso,
  icon: IconComponent = Calendar,
}: AuthBirthDateFieldProps) {
  const colorScheme = useColorScheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState(() =>
    value && isValidBirthdate(value) ? parseIsoToLocalDate(value) : new Date(2000, 0, 15),
  );

  const maxDate = useMemo(() => {
    const t = new Date();
    t.setHours(23, 59, 59, 999);
    return t;
  }, []);

  const selectedDate = useMemo(() => {
    if (value && isValidBirthdate(value)) return parseIsoToLocalDate(value);
    return new Date(2000, 0, 15);
  }, [value]);

  useEffect(() => {
    if (iosOpen) setIosDraft(selectedDate);
  }, [iosOpen, selectedDate]);

  const displayText = formatDisplay(value);

  if (Platform.OS === 'web') {
    return (
      <AuthTextField
        label={label}
        placeholder="AAAA-MM-DD"
        value={value}
        onChangeText={onChangeIso}
        icon={IconComponent}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
      />
    );
  }

  function applyAndroid(event: DateTimePickerEvent, date?: Date) {
    if (event.type === 'set' && date) {
      onChangeIso(toIsoDateLocal(date));
    }
  }

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: 'date',
        minimumDate: MIN_DATE,
        maximumDate: maxDate,
        onChange: applyAndroid,
      });
      return;
    }
    setIosOpen(true);
  }

  return (
    <View style={styles.field}>
      <Text style={[TextStyles.labelUppercase, styles.label]}>{label}</Text>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel="Elegir fecha de nacimiento"
        style={({ pressed }) => [styles.inputRow, pressed && styles.inputRowPressed]}>
        <View pointerEvents="none" style={styles.iconLeft}>
          <IconComponent size={20} color={PrismColors.textSecondary} strokeWidth={2} />
        </View>
        <Text
          style={[
            styles.valueText,
            !displayText && styles.placeholderText,
            { paddingLeft: 48, paddingRight: 44 },
          ]}
          numberOfLines={1}>
          {displayText || 'Tocá para elegir'}
        </Text>
        <View pointerEvents="none" style={styles.iconRight}>
          <ChevronDown size={20} color={PrismColors.textSecondary} strokeWidth={2} />
        </View>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} animationType="slide" transparent>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIosOpen(false)} />
            <View style={styles.iosSheet}>
              <View style={styles.iosToolbar}>
                <Pressable onPress={() => setIosOpen(false)} hitSlop={12}>
                  <Text style={styles.iosToolbarBtn}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onChangeIso(toIsoDateLocal(iosDraft));
                    setIosOpen(false);
                  }}
                  hitSlop={12}>
                  <Text style={[styles.iosToolbarBtn, styles.iosToolbarDone]}>Listo</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosDraft}
                mode="date"
                display="spinner"
                themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                minimumDate={MIN_DATE}
                maximumDate={maxDate}
                onChange={(_, date) => {
                  if (date) setIosDraft(date);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
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
  inputRow: {
    position: 'relative',
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: PrismColors.neutral,
  },
  inputRowPressed: {
    opacity: 0.92,
  },
  iconLeft: {
    position: 'absolute',
    left: Spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  iconRight: {
    position: 'absolute',
    right: Spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  valueText: {
    fontFamily: F.sansMedium,
    fontSize: 15,
    color: PrismColors.textPrimary,
    paddingVertical: 14,
  },
  placeholderText: {
    color: `${PrismColors.textSecondary}99`,
  },
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  iosSheet: {
    backgroundColor: PrismColors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Spacing.xl,
  },
  iosToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PrismColors.primaryBorder,
  },
  iosToolbarBtn: {
    fontFamily: F.sansMedium,
    fontSize: 16,
    color: PrismColors.textSecondary,
  },
  iosToolbarDone: {
    fontFamily: F.sansBold,
    color: PrismColors.primary,
  },
});
