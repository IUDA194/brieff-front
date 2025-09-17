import type { BriefDefinition } from '../types';

const briefStatic: BriefDefinition = {
  id: 'static',
  i18n: {
    title: {
      ru: 'Бриф статика (RU)',
      en: 'Static Brief (EN)',
      ua: 'Бриф статика (UA)',
    },
    labels: {
      ru: {
        projectTitle: 'Название проекта (для сохранения)',
        about: '1. Кратко о проекте:',
        brand: '2. Информация о вашем фирменном стиле:',
        links: '3. Ссылки на сайт и соцсети:',
        refs: '4. Ссылки на референсы:',
        assets: '5. Ссылки на материалы (фото/видео):',
        sizes: '6. Необходимое количество и размеры:',
        texts: '7. Тексты/тезисы для креативов:',
        goals: '8. Цели проекта:',
        audience: '9. Целевая аудитория:',
        wishes: '10. Ваши пожелания:',
        deadline: '11. Желаемый срок выполнения, и почему:',
      },
      en: {
        projectTitle: 'Project Title (for saving)',
        about: '1. About the project:',
        brand: '2. Branding info:',
        links: '3. Links to website & socials:',
        refs: '4. References:',
        assets: '5. Assets (photos/videos):',
        sizes: '6. Quantity & sizes:',
        texts: '7. Copy / headlines:',
        goals: '8. Goals:',
        audience: '9. Target audience:',
        wishes: '10. Your wishes:',
        deadline: '11. Desired deadline and why:',
      },
      ua: {
        projectTitle: 'Назва проєкту (для збереження)',
        about: '1. Коротко про проєкт:',
        brand: '2. Інформація про фірмовий стиль:',
        links: '3. Посилання на сайт та соцмережі:',
        refs: '4. Референси:',
        assets: '5. Матеріали (фото/відео):',
        sizes: '6. Необхідна кількість і розміри:',
        texts: '7. Тексти/тези для креативів:',
        goals: '8. Цілі проєкту:',
        audience: '9. Цільова аудиторія:',
        wishes: '10. Ваші побажання:',
        deadline: '11. Бажаний термін виконання і чому:',
      }
    },
    placeholders: {
      ru: {
        projectTitle_ph: 'Введите название проекта',
        about_ph: 'Название, вид деятельности, ценовой сегмент...',
        brand_ph: 'Брендбук, гайдлайн, шрифты, цвета (#******)...',
        links_ph: 'Ссылки на сайт/соцсети...',
        refs_ph: 'Почему выбрали эти примеры/референсы',
        assets_ph: 'Ссылки на Google Диск или другие сервисы...',
        sizes_ph: 'Например: 5 штук, 1920×1080',
        texts_ph: 'УТП, подзаголовок, СТА...',
        goals_ph: 'Повысить узнаваемость / продажи / трафик...',
        audience_ph: 'Пол, возраст, доход, какую боль решает...',
        wishes_ph: 'Идеи, рекомендации, что важно учесть',
        deadline_ph: ''
      },
      en: {
        projectTitle_ph: 'Enter project title',
        about_ph: 'Name, activity, price segment...',
        brand_ph: 'Brandbook, guidelines, fonts, colors (#******)...',
        links_ph: 'Links to website/socials...',
        refs_ph: 'Why these references',
        assets_ph: 'Links to Google Drive or other services...',
        sizes_ph: 'e.g. 5 pcs, 1920×1080',
        texts_ph: 'USP, subheadline, CTA...',
        goals_ph: 'Awareness / sales / traffic...',
        audience_ph: 'Gender, age, income, pain point...',
        wishes_ph: 'Ideas, recommendations, important notes',
        deadline_ph: ''
      },
      ua: {
        projectTitle_ph: 'Введіть назву проєкту',
        about_ph: 'Назва, діяльність, ціновий сегмент...',
        brand_ph: 'Брендбук, гайдлайн, шрифти, кольори (#******)...',
        links_ph: 'Посилання на сайт/соцмережі...',
        refs_ph: 'Чому обрали ці референси',
        assets_ph: 'Посилання на Google Drive чи інші сервіси...',
        sizes_ph: 'напр.: 5 шт, 1920×1080',
        texts_ph: 'УТП, підзаголовок, CTA...',
        goals_ph: 'Впізнаваність / продажі / трафік...',
        audience_ph: 'Стать, вік, дохід, яку біль вирішує...',
        wishes_ph: 'Ідеї, рекомендації, важливі моменти',
        deadline_ph: ''
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
