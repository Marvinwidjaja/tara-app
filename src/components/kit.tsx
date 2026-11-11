/**
 * Small shared UI kit for the TARA screens. Built on core React Native components only,
 * so it renders the same on the iOS Simulator, the Android Emulator, Expo Go and the web.
 */
import type { PropsWithChildren, ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dayOfMonth, weekDates, weekdayShort } from '@/lib/dates';

type ScreenProps = PropsWithChildren<{
  step?: string;
  title: string;
  subtitle?: string;
  /** Shown above the title, e.g. the TARA logo on sign-in. */
  top?: ReactNode;
}>;

export function Screen({ step, title, subtitle, top, children }: ScreenProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  // Same inset strategy as the Expo template: native contentInset on iOS (the tab bar is
  // translucent), explicit padding on Android and web.
  const platformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: { paddingTop: Spacing.six + Spacing.three, paddingBottom: Spacing.six },
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInset={insets}
      scrollIndicatorInsets={insets}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[styles.screenContent, platformStyle]}>
      <View style={styles.screenInner}>
        <View style={styles.header}>
          {top ? <View style={{ marginBottom: Spacing.two }}>{top}</View> : null}
          <ThemedText style={styles.title}>{title}</ThemedText>
          {subtitle ? <ThemedText themeColor="textSecondary">{subtitle}</ThemedText> : null}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

type Tone = 'default' | 'accent' | 'warn' | 'danger';

export function Card({
  children,
  tone = 'default',
  style,
}: PropsWithChildren<{ tone?: Tone; style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  const bg = {
    default: theme.backgroundElement,
    accent: theme.accentSoft,
    warn: theme.warnSoft,
    danger: theme.dangerSoft,
  }[tone];
  return <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
}

export function Section({
  title,
  hint,
  right,
  children,
}: PropsWithChildren<{ title: string; hint?: string; right?: ReactNode }>) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            {title.toUpperCase()}
          </ThemedText>
          {hint ? (
            <ThemedText type="small" themeColor="textSecondary">
              {hint}
            </ThemedText>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, small, style }: ButtonProps) {
  const theme = useTheme();
  const colors = {
    primary: { bg: theme.accent, fg: theme.onAccent, border: theme.accent },
    secondary: { bg: theme.background, fg: theme.text, border: theme.border },
    ghost: { bg: 'transparent', fg: theme.accent, border: 'transparent' },
    danger: { bg: theme.dangerSoft, fg: theme.danger, border: theme.dangerSoft },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: colors.bg, borderColor: colors.border },
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.7 },
        style,
      ]}>
      <ThemedText type="smallBold" style={{ color: colors.fg, textAlign: 'center' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected, disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.background,
          borderColor: selected ? theme.accent : theme.border,
        },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
      ]}>
      <ThemedText type="small" style={{ color: selected ? theme.onAccent : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Badge({ label, tone = 'default' }: { label: string; tone?: Tone }) {
  const theme = useTheme();
  const map = {
    default: { bg: theme.backgroundSelected, fg: theme.textSecondary },
    accent: { bg: theme.accentSoft, fg: theme.accent },
    warn: { bg: theme.warnSoft, fg: theme.warn },
    danger: { bg: theme.dangerSoft, fg: theme.danger },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <ThemedText style={[styles.badgeText, { color: map.fg }]}>{label}</ThemedText>
    </View>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: Spacing.one }}>
      {label ? (
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
          props.multiline && { minHeight: 72, textAlignVertical: 'top' },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <ThemedText type="small">{label}</ThemedText>
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12, lineHeight: 16 }}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: theme.accent, false: theme.backgroundSelected }}
        thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
      />
    </View>
  );
}

/** A week of dates (Mon–Sun) with arrows to move between weeks. Dates are YYYY-MM-DD. */
export function DateStrip({
  weekStart,
  value,
  today,
  onChange,
  onWeekChange,
  marked = [],
}: {
  weekStart: string;
  value: string;
  today: string;
  onChange: (date: string) => void;
  onWeekChange: (direction: -1 | 1) => void;
  marked?: string[];
}) {
  const theme = useTheme();
  return (
    <View style={styles.dayRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous week"
        onPress={() => onWeekChange(-1)}
        style={styles.weekArrow}>
        <ThemedText themeColor="accent">‹</ThemedText>
      </Pressable>
      {weekDates(weekStart).map((d) => {
        const selected = d === value;
        const isToday = d === today;
        return (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={d}
            accessibilityState={{ selected }}
            onPress={() => onChange(d)}
            style={[
              styles.day,
              {
                backgroundColor: selected ? theme.accent : theme.backgroundElement,
                borderColor: isToday && !selected ? theme.accent : 'transparent',
              },
            ]}>
            <ThemedText type="small" style={{ color: selected ? theme.onAccent : theme.textSecondary, fontSize: 11, lineHeight: 14 }}>
              {weekdayShort(d)}
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: selected ? theme.onAccent : theme.text }}>
              {dayOfMonth(d)}
            </ThemedText>
            <View
              style={[
                styles.dayDot,
                { backgroundColor: marked.includes(d) ? (selected ? theme.onAccent : theme.accent) : 'transparent' },
              ]}
            />
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next week"
        onPress={() => onWeekChange(1)}
        style={styles.weekArrow}>
        <ThemedText themeColor="accent">›</ThemedText>
      </Pressable>
    </View>
  );
}

export function ErrorText({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <Card tone="danger">
      <ThemedText type="small" themeColor="danger">
        {message}
      </ThemedText>
    </Card>
  );
}

export function Empty({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <Card>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </Card>
  );
}

/** Pick one option from a short list. */
export function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T | null | undefined;
  onChange: (id: T) => void;
}) {
  return (
    <Row>
      {options.map((o) => (
        <Chip key={o.id} label={o.label} selected={o.id === value} onPress={() => onChange(o.id)} />
      ))}
    </Row>
  );
}

export function Bubble({
  text,
  mine,
  meta,
  secondary,
}: {
  text: string;
  mine?: boolean;
  meta?: string;
  secondary?: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.bubbleWrap, { alignItems: mine ? 'flex-end' : 'flex-start' }]}>
      {meta ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.bubbleMeta}>
          {meta}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: theme.accent, borderBottomRightRadius: 4 }
            : { backgroundColor: theme.background, borderBottomLeftRadius: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
        ]}>
        <ThemedText type="small" style={{ color: mine ? theme.onAccent : theme.text }}>
          {text}
        </ThemedText>
        {secondary ? (
          <ThemedText
            type="small"
            style={[styles.bubbleSecondary, { color: mine ? theme.onAccent : theme.textSecondary }]}>
            {secondary}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

export function Row({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Divider() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />;
}

const styles = StyleSheet.create({
  screenContent: { flexDirection: 'row', justifyContent: 'center' },
  screenInner: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  header: { gap: Spacing.one, paddingTop: Spacing.three },
  eyebrow: { fontSize: 12, letterSpacing: 0.8 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  section: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  sectionTitle: { fontSize: 12, letterSpacing: 0.8 },
  button: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: { minHeight: 34, paddingHorizontal: Spacing.two + 4, borderRadius: 10 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: 6,
  },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Platform.select({ ios: 12, default: 8 }),
    fontSize: 16,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 40 },
  dayRow: { flexDirection: 'row', gap: 4 },
  day: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 10, gap: 1, borderWidth: 1.5 },
  weekArrow: { justifyContent: 'center', paddingHorizontal: 4 },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  bubbleWrap: { gap: 2 },
  bubbleMeta: { fontSize: 11, lineHeight: 14, paddingHorizontal: 6 },
  bubble: { maxWidth: '88%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  bubbleSecondary: { fontSize: 12, lineHeight: 16, opacity: 0.85, fontStyle: 'italic' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
});
