import ko from './ko';
import en from './en';
import { useAppStore } from '@/store/useAppStore';

export type Lang = 'ko' | 'en';

const dict = { ko, en } as const;

export function useT() {
  const lang = useAppStore((s) => s.lang);
  return dict[lang];
}

export { ko, en };
