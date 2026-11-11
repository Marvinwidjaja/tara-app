import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Source images (assets/images): tara-logo*.png are 455×507, tara-mark.png is 455×390.
const LOGO_RATIO = 507 / 455;
const MARK_RATIO = 390 / 455;

/** The full TARA logo (mark + wordmark). In dark mode the wordmark is white so it stays readable. */
export function TaraLogo({ width = 120 }: { width?: number }) {
  const scheme = useColorScheme();
  return (
    <Image
      source={
        scheme === 'dark' ? require('@/assets/images/tara-logo-dark.png') : require('@/assets/images/tara-logo.png')
      }
      style={{ width, height: Math.round(width * LOGO_RATIO) }}
      contentFit="contain"
      accessibilityLabel="TARA"
    />
  );
}

/** Just the colorful T, for small places like the header. */
export function TaraMark({ width = 28 }: { width?: number }) {
  return (
    <Image
      source={require('@/assets/images/tara-mark.png')}
      style={{ width, height: Math.round(width * MARK_RATIO) }}
      contentFit="contain"
      accessibilityLabel="TARA"
    />
  );
}
