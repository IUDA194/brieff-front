import type { BriefDefinition } from '../types';

// Бриф для презентации (7 полей)
const brief: BriefDefinition = {
  id: 'prezent',

  fields: [
    { id: 'projectTitle', type: 'text',     required: true,  labelKey: 'projectTitle', placeholderKey: 'projectTitle' },

    { id: 'slidesText',   type: 'textarea', required: true,  labelKey: 'slidesText',   placeholderKey: 'slidesText' },

    { id: 'designRefs',   type: 'text',     required: false, labelKey: 'designRefs',   placeholderKey: 'designRefs' },

    { id: 'goal',         type: 'textarea', required: true,  labelKey: 'goal',         placeholderKey: 'goal' },

    { id: 'references',   type: 'text',     required: false, labelKey: 'references',   placeholderKey: 'references' },

    { id: 'assetsLinks',  type: 'text',     required: false, labelKey: 'assetsLinks',  placeholderKey: 'assetsLinks' },

    { id: 'size',         type: 'text',     required: true,  labelKey: 'size',         placeholderKey: 'size' },

    { id: 'deadline',     type: 'text',     required: true,  labelKey: 'deadline',     placeholderKey: 'deadline' },
  ],

  i18n: {
    title: {
      ru: 'Бриф: презентация',
      en: 'Presentation brief',
      ua: 'Бриф: презентація',
    },

    labels: {
      ru: {
        projectTitle: 'Название проекта',
        slidesText:   'Текст для каждого слайда',
        designRefs:   'Цвета/шрифты/брендбук (ссылки)',
        goal:         'Цель/задача и ниша',
        references:   'Референсы',
        assetsLinks:  'Материалы (ссылки)',
        size:         'Размер/ориентация',
        deadline:     'Сроки',
      },
      en: {
        projectTitle: 'Project title',
        slidesText:   'Slide-by-slide text',
        designRefs:   'Branding (links)',
        goal:         'Goal & niche',
        references:   'References',
        assetsLinks:  'Assets (links)',
        size:         'Size/orientation',
        deadline:     'Deadline',
      },
      ua: {
        projectTitle: 'Назва проєкту',
        slidesText:   'Текст для кожного слайду',
        designRefs:   'Фірмовий стиль (посилання)',
        goal:         'Мета та ніша',
        references:   'Референси',
        assetsLinks:  'Матеріали (посилання)',
        size:         'Розмір/орієнтація',
        deadline:     'Терміни',
      },
    },

    placeholders: {
      ru: {
        projectTitle: "Введите название проекта",
        slidesText: `Напишите текст, который должен быть на каждом слайде.
Например:
СЛАЙД 1: Текст…
Или вставьте ссылку на Figma/Canva/Google Slides или другой документ.`,
        designRefs: `Укажите ссылку на брендбук (если есть) или напишите, какие цвета и шрифты использовать.
Если нет брендбука — можно ли выбрать всё на своё усмотрение?`,
        goal: `Опишите главную цель презентации.
Например: продать маркетинговые услуги, презентовать продукт, привлечь инвесторов, представить стартап и т.д.`,
        references: `Поделитесь ссылками или скриншотами презентаций, которые вам нравятся.`,
        assetsLinks: `Прикрепите ссылки на логотип, фото, иконки и другие материалы.
Если чего-то нет — уточните, что можно найти и использовать на наше усмотрение.`,
        size: `Укажите размер и ориентацию.
Например: 1920×1080 горизонтальная или 1080×1920 вертикальная.`,
        deadline: "Укажите желаемый срок выполнения",
      },

      en: {
        projectTitle: "Enter the project title",
        slidesText: `Write the text that should appear on each slide.
For example:
SLIDE 1: Text…
Or insert a link to Figma/Canva/Google Slides or another document.`,
        designRefs: `Provide a link to the brand book (if any) or specify which colors and fonts should be used.
If not available, let us know if we can choose at our discretion.`,
        goal: `Describe the main goal of the presentation.
For example: sell marketing services, present a product, attract investors, introduce a startup, etc.`,
        references: `Share links or screenshots of presentations you like.`,
        assetsLinks: `Attach links to your logo, photos, icons, and other assets.
If some are missing, specify what we may find and use at our discretion.`,
        size: `Specify the preferred slide size and orientation.
For example: 1920×1080 landscape or 1080×1920 portrait.`,
        deadline: "Specify the desired completion deadline",
      },

      ua: {
        projectTitle: "Введіть назву проєкту",
        slidesText: `Напишіть текст, який має бути на кожному слайді.
Наприклад:
СЛАЙД 1: Текст…
Або вставте посилання на Figma/Canva/Google Slides чи інший документ.`,
        designRefs: `Вкажіть посилання на брендбук (якщо є) або напишіть, які кольори та шрифти використати.
Якщо цього немає — повідомте, чи можемо ми обрати все на власний розсуд.`,
        goal: `Опишіть головну мету презентації.
Наприклад: продати маркетингові послуги, презентувати продукт, залучити інвесторів, представити стартап тощо.`,
        references: `Поділіться посиланнями або скріншотами презентацій, які вам подобаються.`,
        assetsLinks: `Прикріпіть посилання на логотип, фото, іконки та інші матеріали.
Якщо деяких матеріалів немає — уточніть, що ми можемо знайти й використати на власний розсуд.`,
        size: `Вкажіть бажаний розмір і орієнтацію слайдів.
Наприклад: 1920×1080 горизонтальна або 1080×1920 вертикальна.`,
        deadline: "Вкажіть бажаний час виконання",
      },
    },
  },
};

export default brief;
