import type { BriefDefinition } from '../types';

const briefPrint: BriefDefinition = {
  id: 'print',
  i18n: {
    title: {
      ru: 'Дизайн Полиграфии',
      en: 'Design for Print',
      ua: 'Дизайн поліграфії',
    },
    labels: {
      ru: {
        projectTitle: 'Название проекта (для сохранения)',
        texts: '1. Текст:',
        sizes: '2. Размеры и ориентация:',
        format: '3. Формат и печатный профиль:',
        brand: '4. Брендбук, цвета, шрифты:',
        style: '5. Стилистика:',
        wishes: '6. Пожелания:',
        goals: '7. Цель:',
        audience: '8. Целевая аудитория:',
        deadline: '9. Срок:',
      },
      en: {
        projectTitle: 'Project Title (for saving)',
        texts: '1. Text:',
        sizes: '2. Sizes and orientation:',
        format: '3. File format and print profile:',
        brand: '4. Brandbook, colors, fonts:',
        style: '5. Style:',
        wishes: '6. Preferences:',
        goals: '7. Purpose:',
        audience: '8. Target audience:',
        deadline: '9. Deadline:',
      },
      ua: {
        projectTitle: 'Назва проєкту (для збереження)',
        texts: '1. Текст:',
        sizes: '2. Розміри та орієнтація:',
        format: '3. Формат файлів та профіль друку:',
        brand: '4. Брендбук, кольори, шрифти:',
        style: '5. Стилістика:',
        wishes: '6. Побажання:',
        goals: '7. Мета:',
        audience: '8. Цільова аудиторія:',
        deadline: '9. Термін:',
      }
    },
    placeholders: {
      ru: {
        projectTitle_ph: 'Введите название проекта',
        texts_ph: 'Укажите текст для макета (например: визитка — сторона 1 и сторона 2, баннер — основной текст и слоган).',
        sizes_ph: 'Пример: визитка 90×50 мм, двухсторонняя; баннер 85×200 см, вертикальный.',
        format_ph: 'Формат файлов (PDF, TIFF и т.д.). Профиль печати (например: CMYK Coated FOGRA39). Если не знаете — сделаем универсально.',
        brand_ph: 'Укажите фирменные цвета и шрифты или дайте ссылку на брендбук.',
        style_ph: 'Прикрепите примеры или ссылки на сайт/Instagram, чтобы понять стиль.',
        wishes_ph: 'Что точно хотите видеть или чего не должно быть в дизайне.',
        goals_ph: 'Для чего нужна полиграфия (выставка, презентация, продажи, раздатка и т.д.).',
        audience_ph: 'Кто будет видеть/получать материалы (возраст, пол, интересы).',
        deadline_ph: 'Когда нужен готовый макет.',
      },
      en: {
        projectTitle_ph: 'Enter project title',
        texts_ph: 'Provide the text for the layout (e.g., business card — side 1 and side 2, banner — main text and slogan).',
        sizes_ph: 'Example: business card 90×50 mm, double-sided; roll-up banner 85×200 cm, vertical.',
        format_ph: 'File format (PDF, TIFF, etc.). Print profile (e.g., CMYK Coated FOGRA39). If unsure, we will prepare a universal option.',
        brand_ph: 'Provide corporate colors and fonts or share a link to your brandbook.',
        style_ph: 'Attach examples or share links to website/Instagram to clarify style.',
        wishes_ph: 'What you definitely want to see or avoid in the design.',
        goals_ph: 'State the purpose of the print design (exhibition, presentation, sales, handouts, etc.).',
        audience_ph: 'Who will see/receive the materials (age, gender, interests).',
        deadline_ph: 'When the final layout is needed.',
      },
      ua: {
        projectTitle_ph: 'Введіть назву проєкту',
        texts_ph: 'Вкажіть текст для макета (наприклад: візитка — сторона 1 і сторона 2, банер — основний текст і слоган).',
        sizes_ph: 'Приклад: візитка 90×50 мм, двостороння; рол-ап банер 85×200 см, вертикальний.',
        format_ph: 'Формат файлів (PDF, TIFF тощо). Профіль друку (наприклад: CMYK Coated FOGRA39). Якщо ви цього не знаєте — ми підготуємо універсальний варіант.',
        brand_ph: 'Вкажіть фірмові кольори та шрифти або дайте посилання на брендбук.',
        style_ph: 'Прикріпіть приклади або посилання на сайт/Instagram, щоб зрозуміти стиль.',
        wishes_ph: 'Що ви точно хочете бачити або чого не повинно бути в дизайні.',
        goals_ph: 'Для чого потрібна поліграфія (виставка, презентація, продажі, роздаткові матеріали тощо).',
        audience_ph: 'Хто буде бачити/отримувати матеріали (вік, стать, інтереси).',
        deadline_ph: 'Коли потрібен готовий макет.',
      }
    }
  },
  fields: [
    { id: 'projectTitle', type: 'text',     labelKey: 'projectTitle', placeholderKey: 'projectTitle_ph', required: true },
    { id: 'texts',        type: 'textarea', labelKey: 'texts',        placeholderKey: 'texts_ph' },
    { id: 'sizes',        type: 'text',     labelKey: 'sizes',        placeholderKey: 'sizes_ph' },
    { id: 'format',       type: 'text',     labelKey: 'format',       placeholderKey: 'format_ph' },
    { id: 'brand',        type: 'textarea', labelKey: 'brand',        placeholderKey: 'brand_ph' },
    { id: 'style',        type: 'textarea', labelKey: 'style',        placeholderKey: 'style_ph' },
    { id: 'wishes',       type: 'textarea', labelKey: 'wishes',       placeholderKey: 'wishes_ph' },
    { id: 'goals',        type: 'textarea', labelKey: 'goals',        placeholderKey: 'goals_ph' },
    { id: 'audience',     type: 'textarea', labelKey: 'audience',     placeholderKey: 'audience_ph' },
    { id: 'deadline',     type: 'text',     labelKey: 'deadline',     placeholderKey: 'deadline_ph' },
  ]
};

export default briefPrint;
