/** The caregiver's chat with the parent. Opening it marks the parent's messages as read. */
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bubble, Button, ErrorText } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { useQuery } from '@/hooks/use-query';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { ct } from '@/lib/caregiver-text';
import { clockTime, localDay } from '@/lib/dates';
import type { Message } from '@/shared/types';
import { useCaregiver } from '@/state/session';

export default function CaregiverChatScreen() {
  const { me, lang, reload } = useCaregiver();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { busy, run } = useAction();
  const [text, setText] = useState('');
  const thread = useQuery<Message[]>('/api/caregiver/messages', { pollMs: 5_000 });
  const parentName = me?.family.parentName ?? '';

  // The server marks messages read when the thread loads; refresh the unread badge to match.
  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => void reload().catch(() => {}), 1_000);
      return () => clearTimeout(t);
    }, [reload])
  );

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    const res = await run('send', () => api.post('/api/caregiver/messages', { text: body }));
    if (res) setText('');
    void thread.reload();
  };

  let lastDay = '';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          // On web the tab bar floats over the top of the page.
          { paddingTop: Platform.OS === 'web' ? Spacing.six + Spacing.three : insets.top + Spacing.three },
        ]}>
        <View style={styles.inner}>
          <ThemedText type="subtitle">{ct(lang, 'chatTitle', { parent: parentName })}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {ct(lang, 'chatHint', { parent: parentName })}
          </ThemedText>
          <ErrorText message={thread.error} />
          {thread.data?.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              {ct(lang, 'noMessages')}
            </ThemedText>
          ) : null}

          {thread.data?.map((m) => {
            const day = localDay(m.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;
            const mine = m.direction === 'in';
            const who = mine ? ct(lang, 'you') : m.kind === 'chat' ? parentName : ct(lang, 'taraReminder');
            const meta = `${who} · ${clockTime(m.createdAt)}${mine && m.status === 'read' ? ` · ${ct(lang, 'read')}` : ''}`;
            return (
              <View key={m.id} style={{ gap: Spacing.one }}>
                {showDay ? (
                  <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', fontSize: 12 }}>
                    {day}
                  </ThemedText>
                ) : null}
                <Bubble text={m.body} mine={mine} meta={meta} />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={[
          styles.composer,
          {
            borderTopColor: theme.border,
            // Clear the floating tab bar.
            paddingBottom: Math.max(insets.bottom, Spacing.two) + BottomTabInset,
          },
        ]}>
        <View style={styles.inner}>
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={ct(lang, 'messageParent', { parent: parentName })}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              multiline
            />
            <Button label={busy === 'send' ? '…' : ct(lang, 'send')} onPress={send} disabled={!!busy || !text.trim()} />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingBottom: Spacing.three },
  inner: { flex: 1, maxWidth: MaxContentWidth, paddingHorizontal: Spacing.three, gap: Spacing.two },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.two, flexDirection: 'row', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-end' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 10, default: 8 }),
    fontSize: 16,
    maxHeight: 120,
  },
});
