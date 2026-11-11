import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';

import { ct } from '@/lib/caregiver-text';
import { useCaregiver } from '@/state/session';

import { CustomTabList, TabButton } from './app-tabs.web';

/** Web version of the caregiver tabs: the same floating bar as the parent's. */
export default function CaregiverTabs() {
  const { me, lang } = useCaregiver();
  const unread = me?.unread ?? 0;

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="today" href="/today" asChild>
            <TabButton>{ct(lang, 'tabToday')}</TabButton>
          </TabTrigger>
          <TabTrigger name="chat" href="/chat" asChild>
            <TabButton>{`${ct(lang, 'tabMessages')}${unread > 0 ? ` (${unread})` : ''}`}</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>{ct(lang, 'tabMe')}</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}
