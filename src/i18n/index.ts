export type Lang = 'ru' | 'en' | 'ua';

import ru from './locales/ru.json';
import en from './locales/en.json';
import ua from './locales/ua.json';

export const dict: Record<Lang, Record<string, string>> = { ru, en, ua };
