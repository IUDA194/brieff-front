// src/briefs/briefStatic.ts

import type { BriefDefinition } from '../types';

const briefStatic: BriefDefinition = {
  id: 'static',
  i18n: {
    title: {
      ru: 'Статические креативы',
      en: 'Ad Creatives',
      ua: 'Статичні Креативи',
    },
    labels: {
      ru: {
        projectTitle: 'Название проекта (для сохранения)',
        about: '1. Кратко о проекте:',
        brand: '2. Информация о фирменном стиле:',
        links: '3. Сайт и ссылки на соцсети:',
        refs: '4. Референсы:',
        assets: '5. Материалы (фото/видео):',
        sizes: '6. Количество и размеры:',
        texts: '7. Тексты/идеи для креативов:',
        goals: '8. Цели проекта:',
        audience: '9. Целевая аудитория:',
        wishes: '10. Ваши предпочтения:',
        deadline: '11. Желаемый срок:',
      },
      en: {
        projectTitle: 'Project Title (for saving)',
        about: '1. Briefly about the project:',
        brand: '2. Brand identity information:',
        links: '3. Website and social media links:',
        refs: '4. References:',
        assets: '5. Links to materials (photos/videos):',
        sizes: '6. Required quantity and sizes:',
        texts: '7. Texts/ideas for creatives:',
        goals: '8. Project goals:',
        audience: '9. Target audience:',
        wishes: '10. Your preferences:',
        deadline: '11. Desired deadline:',
      },
      ua: {
        projectTitle: 'Назва проєкту (для збереження)',
        about: '1. Коротко про проєкт:',
        brand: '2. Інформація про фірмовий стиль:',
        links: '3. Сайт та посилання на соцмережі:',
        refs: '4. Референси:',
        assets: '5. Матеріали (фото/відео):',
        sizes: '6. Кількість і розміри:',
        texts: '7. Тексти/ідеї для креативів:',
        goals: '8. Цілі проєкту:',
        audience: '9. Цільова аудиторія:',
        wishes: '10. Ваші вподобання:',
        deadline: '11. Бажаний термін:',
      }
    },
    placeholders: {
      ru: {
        projectTitle_ph: 'Введите название проекта',
        about_ph: 'Опишите вашу компанию, сферу деятельности и позиционирование на рынке.',
        brand_ph: 'Укажите брендбук, фирменные цвета, шрифты или другие правила айдентики. Если этого нет, сообщите, можем ли мы выбрать всё на своё усмотрение.',
        links_ph: 'Добавьте ссылки на сайт и социальные сети для понимания стиля и коммуникации.',
        refs_ph: 'Прикрепите ссылки на примеры креативов, которые вам нравятся, и объясните, чем они вам понравились.',
        assets_ph: 'Прикрепите ссылки на фото, видео, логотипы или другие материалы. Если чего-то нет, уточните, что мы можем найти и использовать на своё усмотрение.',
        sizes_ph: 'Укажите, сколько креативов нужно и в каких размерах — например, пост, сторис / 1080×1080, 1920×1080 и т.д.',
        texts_ph: 'Напишите тексты, слоганы или идеи, которые должны быть на креативах. Это должно включать заголовок, оффер и призыв к действию (CTA).',
        goals_ph: 'Опишите основную цель креативов: продажи, трафик, узнаваемость бренда и т. д.',
        audience_ph: 'Определите вашу аудиторию: возраст, пол, локация, интересы, тип клиента.',
        wishes_ph: 'Укажите, что вы точно хотите видеть или наоборот чего нужно избегать в дизайне.',
        deadline_ph: 'Укажите желаемое время выполнения.',
      },
      en: {
        projectTitle_ph: 'Enter project title',
        about_ph: 'Describe your company, field of activity, and market positioning.',
        brand_ph: 'Provide brand guidelines, colors, fonts, or any rules for maintaining brand identity. If not available, let us know if we can choose them at our discretion.',
        links_ph: 'Share links to your website and social media for style and communication reference.',
        refs_ph: 'Attach links for examples of creatives you like and explain why they are relevant.',
        assets_ph: 'Provide links to photos, videos, logos, or any assets. If some materials are missing, please specify what we can find and use at our own discretion.',
        sizes_ph: 'Specify how many creatives you need and in what sizes — e.g., post, story / 1080х1080, 1920х1080, etc.',
        texts_ph: 'Write the texts, slogans, or ideas that should appear in the creatives. This should include a headline, offer, and call to action (CTA) etc.',
        goals_ph: 'Describe the main purpose of the creatives: sales, traffic, brand awareness, etc.',
        audience_ph: 'Define your target audience: age, gender, location, interests, type of customer.',
        wishes_ph: 'List what you definitely want to see or, on the contrary, what should be avoided in the design.',
        deadline_ph: 'State the desired completion time.',
      },
      ua: {
        projectTitle_ph: 'Введіть назву проєкту',
        about_ph: 'Опишіть вашу компанію, сферу діяльності та позиціонування на ринку.',
        brand_ph: 'Укажіть брендбук, фірмові кольори, шрифти чи інші правила айдентики. Якщо цього немає, повідомте, чи можемо ми обрати все на свій розсуд.',
        links_ph: 'Додайте посилання на сайт і соціальні мережі для розуміння стилю та комунікації.',
        refs_ph: 'Прикріпіть посилання на приклади креативів, які вам подобаються, і поясніть, чому вони вам сподобалися.',
        assets_ph: 'Прикріпіть посилання на фото, відео, логотипи чи інші матеріали. Якщо чогось немає, уточніть, що ми можемо знайти й використати на свій розсуд.',
        sizes_ph: 'Укажіть, скільки креативів потрібно і в яких розмірах — наприклад, пост, сторіс / 1080×1080, 1920×1080 тощо.',
        texts_ph: 'Напишіть тексти, слогани чи ідеї, які мають бути на креативах. Це повинно включати заголовок, оффер і заклик до дії (CTA).',
        goals_ph: 'Опишіть основну мету креативів: продажі, трафік, впізнаваність бренду тощо.',
        audience_ph: 'Визначте вашу аудиторію: вік, стать, локація, інтереси, тип клієнта.',
        wishes_ph: 'Укажіть, що ви точно хочете бачити або навпаки чого слід уникати в дизайні.',
        deadline_ph: 'Укажіть бажаний термін виконання.',
      }
    }
  },
  fields: [
    { id: 'projectTitle', type: 'text',     labelKey: 'projectTitle', placeholderKey: 'projectTitle_ph', required: true },
    { id: 'about',        type: 'textarea', labelKey: 'about',        placeholderKey: 'about_ph' },
    { id: 'brand',        type: 'textarea', labelKey: 'brand',        placeholderKey: 'brand_ph' },
    { id: 'links',        type: 'textarea', labelKey: 'links',        placeholderKey: 'links_ph' },
    { id: 'refs',         type: 'textarea', labelKey: 'refs',         placeholderKey: 'refs_ph' },
    { id: 'assets',       type: 'textarea', labelKey: 'assets',       placeholderKey: 'assets_ph' },
    { id: 'sizes',        type: 'text',     labelKey: 'sizes',        placeholderKey: 'sizes_ph' },
    { id: 'texts',        type: 'textarea', labelKey: 'texts',        placeholderKey: 'texts_ph' },
    { id: 'goals',        type: 'textarea', labelKey: 'goals',        placeholderKey: 'goals_ph' },
    { id: 'audience',     type: 'textarea', labelKey: 'audience',     placeholderKey: 'audience_ph' },
    { id: 'wishes',       type: 'textarea', labelKey: 'wishes',       placeholderKey: 'wishes_ph' },
    { id: 'deadline',     type: 'text',     labelKey: 'deadline',     placeholderKey: 'deadline_ph' },
  ]
};

export default briefStatic;
