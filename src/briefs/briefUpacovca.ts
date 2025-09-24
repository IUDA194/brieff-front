// src/briefs/briefUpacovca.ts

import type { BriefDefinition } from '../types';

const briefUpacovca: BriefDefinition = {
  id: 'upacovca',
  i18n: {
    title: {
      ru: 'Упаковка Инстаграм',
      en: 'Inst Visual',
      ua: 'Упаковка Інстаграм',
    },
    labels: {
      ru: {
        projectTitle: 'Название проекта (для сохранения)',
        text: '1. Текст:',
        audience: '2. Целевая аудитория:',
        assets: '3. Материалы (лого, фото и т.д.):',
        style: '4. Стиль:',
        brand: '5. Фирменные цвета/шрифты (если есть):',
        niche: '6. Ниша и описание:',
        deadline: '7. Сроки:',
        refs: '8. Референсы:',
      },
      en: {
        projectTitle: 'Project Title (for saving)',
        text: '1. Copy/Text:',
        audience: '2. Target audience:',
        assets: '3. Assets (logo, photos, etc.):',
        style: '4. Style:',
        brand: '5. Brand colors/fonts (if any):',
        niche: '6. Niche & description:',
        deadline: '7. Deadline:',
        refs: '8. References:',
      },
      ua: {
        projectTitle: 'Назва проєкту (для збереження)',
        text: '1. Текст:',
        audience: '2. Цільова аудиторія:',
        assets: '3. Матеріали (лого, фото тощо):',
        style: '4. Стиль:',
        brand: '5. Фірмові кольори/шрифти (якщо є):',
        niche: '6. Ніша та опис:',
        deadline: '7. Терміни:',
        refs: '8. Референси:',
      },
    },
    placeholders: {
      ru: {
        projectTitle_ph: 'Введите название проекта',
        text_ph:
          'Укажите текст для постов или слайдов.\nНапр.: \nПОСТ 1\nСлайд 1 — текст\nСлайд 2 — текст\nЕсли есть пожелания — добавьте к конкретному слайду.',
        audience_ph:
          'Кто ваша аудитория? Возраст, пол, интересы, поведение в соцсетях.',
        assets_ph:
          'Ссылки на логотип, фото продукта/команды, иные материалы (Drive/Dropbox и т.д.).',
        style_ph:
          'Какой визуал нужен? (минимализм, ярко, премиум, женственно и т.п.)',
        brand_ph: 'Укажите ваши фирменные цвета и шрифты (если есть).',
        niche_ph: 'Кратко опишите нишу и продукт/услугу.',
        deadline_ph: 'Когда нужны готовые посты.',
        refs_ph:
          'Ссылки/примеры аккаунтов или визуала, который вам нравится.',
      },
      en: {
        projectTitle_ph: 'Enter project title',
        text_ph:
          'Provide text for posts or slides.\nE.g.:\nPOST 1\nSlide 1 — text\nSlide 2 — text\nAdd slide-specific notes if any.',
        audience_ph:
          'Who is your audience? Age, gender, interests, social behavior.',
        assets_ph:
          'Links to logo, product/team photos, and any materials (Drive/Dropbox, etc.).',
        style_ph:
          'What visual style do you need? (minimal, bold, premium, feminine, etc.)',
        brand_ph: 'Your brand colors and fonts (if any).',
        niche_ph: 'Briefly describe your niche and product/service.',
        deadline_ph: 'When the posts are needed.',
        refs_ph:
          'Links/examples of accounts or visuals you like.',
      },
      ua: {
        projectTitle_ph: 'Введіть назву проєкту',
        text_ph:
          'Вкажіть текст для постів або слайдів.\nНапр.:\nПОСТ 1\nСлайд 1 — текст\nСлайд 2 — текст\nДодайте побажання до конкретного слайда.',
        audience_ph:
          'Хто ваша аудиторія? Вік, стать, інтереси, поведінка в соцмережах.',
        assets_ph:
          'Посилання на логотип, фото продукту/команди та інші матеріали (Drive/Dropbox тощо).',
        style_ph:
          'Який візуал потрібен? (мінімалізм, яскраво, преміум, жіночно тощо)',
        brand_ph: 'Ваші фірмові кольори та шрифти (за наявності).',
        niche_ph: 'Коротко опишіть нішу та продукт/послугу.',
        deadline_ph: 'Коли потрібні готові пости.',
        refs_ph:
          'Посилання/приклади акаунтів або візуалу, який вам подобається.',
      },
    },
  },
  fields: [
    { id: 'projectTitle', type: 'text',     labelKey: 'projectTitle', placeholderKey: 'projectTitle_ph', required: true },
    { id: 'text',         type: 'textarea', labelKey: 'text',         placeholderKey: 'text_ph' },
    { id: 'audience',     type: 'textarea', labelKey: 'audience',     placeholderKey: 'audience_ph' },
    { id: 'assets',       type: 'textarea', labelKey: 'assets',       placeholderKey: 'assets_ph' },
    { id: 'style',        type: 'textarea', labelKey: 'style',        placeholderKey: 'style_ph' },
    { id: 'brand',        type: 'textarea', labelKey: 'brand',        placeholderKey: 'brand_ph' },
    { id: 'niche',        type: 'textarea', labelKey: 'niche',        placeholderKey: 'niche_ph' },
    { id: 'deadline',     type: 'text',     labelKey: 'deadline',     placeholderKey: 'deadline_ph' },
    { id: 'refs',         type: 'textarea', labelKey: 'refs',         placeholderKey: 'refs_ph' },
  ],
};

export default briefUpacovca;
