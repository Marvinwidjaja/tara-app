/** The parent's chat with one caregiver (in-app messages; the caregiver reads them in TARA). */
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CAREGIVER_STATUS, languageName } from '@/components/cocare';
import { InviteCard } from '@/components/invite-card';
import { Badge, Bubble, Button, Card, ErrorText, Row } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { useQuery } from '@/hooks/use-query';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { clockTime, localDay } from '@/lib/dates';
import type { Message } from '@/shared/types';
import { useFamily } from '@/state/session';

export default function CaregiverChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const family = useFamily();
  const caregiver = family.caregiver(id);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { busy, run } = useAction();
  const [text, setText] = useState('');

  const thread = useQuery<Message[]>(id ? `/api/caregivers/${id}/messages` : null, { pollMs: 5_000 });

  if (!caregiver) {
    return (
      <View style={{ flex: 1, padding: Spacing.three, backgroundColor: theme.background }}>
        <ThemedText type="small" themeColor="textSecondary">
          This caregiver was removed.
        </ThemedText>
      </View>
    );
  }

  const status = CAREGIVER_STATUS[caregiver.status];

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    const res = await run('send', () => api.post(`/api/caregivers/${caregiver.id}/messages`, { text: body }));
    if (res) setText('');
    void thread.reload();
  };

  let lastDay = '';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <Stack.Screen options={{ title: caregiver.name }} />
      <ScrollView
        ref={scrollRef}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <Card>
            <Row>
              <ThemedText type="smallBold" style={{ flex: 1 }}>
                {caregiver.name}
                {caregiver.relation ? ` · ${caregiver.relation}` : ''}
              </ThemedText>
              <Badge label={status.label} tone={status.tone} />
            </Row>
            <ThemedText type="small" themeColor="textSecondary">
              Sees TARA in {languageName(caregiver.language)}
              {caregiver.phone ? ` · ${caregiver.phone}` : ''}
            </ThemedText>
            <Row>
              <Button
                small
                label="Assign"
                onPress={() => router.push({ pathname: '/assign', params: { caregiverId: caregiver.id } })}
              />
              <Button
                small
                variant="ghost"
                label="Edit"
                onPress={() => router.push({ pathname: '/caregiver-edit', params: { id: caregiver.id } })}
              />
            </Row>
          </Card>
          {caregiver.status !== 'joined' ? <InviteCard caregiver={caregiver} /> : null}

          <ErrorText message={thread.error} />
          {thread.data?.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              No messages yet.{caregiver.status === 'joined' ? '' : ` ${caregiver.name} will see them once they join.`}
            </ThemedText>
          ) : null}

          {thread.data?.map((m) => {
            const day = localDay(m.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;
            const mine = m.direction === 'out';
            const who = !mine ? caregiver.name : m.kind === 'chat' ? 'You' : 'TARA reminder';
            const meta = `${who} · ${clockTime(m.createdAt)}${mine && m.status === 'read' ? ' · read' : ''}`;
            return (
              <View key={m.id} style={{ gap: Spacing.one }}>
                {showDay ? (
                  <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', fontSize: 12 }}>
                    {day}
                  </ThemedText>
                ) : null}
                <Bubble text={m.body} mine={mine} meta={meta} secondary={m.english ?? undefined} />
                {m.mediaUrl ? (
                  <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                    <Button small variant="secondary" label="▶ Play voice note" onPress={() => WebBrowser.openBrowserAsync(m.mediaUrl!)} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.composer, { borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, Spacing.two) }]}>
        <View style={styles.inner}>
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={`Message ${caregiver.name}`}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              multiline
            />
            <Button label={busy === 'send' ? '…' : 'Send'} onPress={send} disabled={!!busy || !text.trim()} />
          </View>
          {caregiver.language !== 'en' ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
              Your messages appear exactly as you write them (not translated into {languageName(caregiver.language)}).
            </ThemedText>
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingVertical: Spacing.three },
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
