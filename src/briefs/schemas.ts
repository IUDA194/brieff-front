// src/briefs/schemas.ts

export type Locale = "ru" | "uk" | "en";
export type BriefType = "static" | "video" | "print" | "logo" | "presentation";

export interface Contact {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  telegram?: string;
  website?: string;
}

export interface Audience {
  segments?: string[];
  geo?: string[];
  ageRange?: [number, number];
  interests?: string[];
  problems?: string[];
}

export interface ReferenceLink {
  title?: string;
  url: string;
  comment?: string;
}

export interface BrandAssets {
  hasBrandbook: boolean;
  logoProvided: boolean;
  fontsProvided: boolean;
  colorPaletteProvided: boolean;
  downloadLinks: ReferenceLink[];
}

export type ExportFormat =
  | "PNG" | "JPG" | "SVG" | "PDF" | "MP4" | "MOV" | "WEBM" | "AI" | "PSD" | "INDD";

export interface BaseBrief {
  type: BriefType;
  locale: Locale;

  projectTitle: string;
  projectBackground?: string;
  goals?: string[];
  kpis?: string[];

  contacts: Contact;
  audience?: Audience;

  mainMessage?: string;
  toneOfVoice?: "neutral" | "friendly" | "bold" | "serious" | "playful";

  references?: ReferenceLink[];

  deadline?: string; // ISO
  budget?: number;   // int >= 0
  approvals?: string[];
  notes?: string;

  brand: BrandAssets;
}

/** STATIC */
export interface StaticSize {
  label: string;
  width: number;
  height: number;
  dpi?: number;
  safeAreaNote?: string;
}

export interface StaticCopy {
  headline?: string;
  subheadline?: string;
  body?: string;
  cta?: string;
  languages?: Locale[];
}

export interface StaticVisualStyle {
  keywords?: string[];
  colorPreferences?: string[];
  avoid?: string[];
}

export interface StaticDeliverables {
  exports: ExportFormat[];
  sourceFiles?: ("AI" | "PSD" | "FIGMA")[];
  needEditableText: boolean;
}

export interface StaticBrief extends BaseBrief {
  type: "static";
  platforms?: ("instagram"|"facebook"|"tiktok"|"youtube"|"x"|"linkedin"|"telegram"|"other")[];
  customPlatform?: string;
  sizes: StaticSize[];
  copy: StaticCopy;
  visualStyle: StaticVisualStyle;
  deliverables: StaticDeliverables;
}

/** VIDEO */
export interface VideoVoiceover {
  needed: boolean;
  language?: Locale;
  maleFemaleAny?: "male" | "female" | "any";
  script?: string;
}

export interface VideoMusic {
  provided: boolean;
  licenseRequired: boolean;
  refs: ReferenceLink[];
}

export interface VideoAssets {
  footageProvided: boolean;
  logoAnimationNeeded: boolean;
  subtitlesNeeded: boolean;
  voiceover: VideoVoiceover;
  music: VideoMusic;
}

export interface VideoDeliverables {
  resolution: "720p" | "1080p" | "1440p" | "2160p";
  codec: "H264" | "H265" | "ProRes" | "DNxHD";
  container: "MP4" | "MOV" | "WEBM";
  cleanVersionWithoutText: boolean;
  thumbnailNeeded: boolean;
  exports: ExportFormat[];
}

export interface VideoBrief extends BaseBrief {
  type: "video";
  durationSec: number;
  aspectRatio: "9:16" | "1:1" | "16:9" | "4:5";
  platforms?: ("tiktok"|"reels"|"shorts"|"youtube"|"facebook"|"other")[];
  customPlatform?: string;

  script?: string;
  storyboardProvided: boolean;

  assets: VideoAssets;
  deliverables: VideoDeliverables;
}

/** PRINT */
export interface PrintSpec {
  size: { unit: "mm" | "cm" | "px"; width: number; height: number };
  bleed: number;
  safeMargin: number;
  folds: number;
  pages: number;
  color: "CMYK" | "Pantone" | "BW";
  paper: { stock?: string; densityGsm?: number; finish?: "matte" | "glossy" | "uncoated" };
  printHouse?: string;
  quantity?: number;
}

export interface PrintCopy {
  headings?: string[];
  body?: string;
  legalBlocks?: string[];
  languages?: Locale[];
}

export interface PrintDeliverables {
  exports: ExportFormat[];
  pdfForPrintWithBleeds: boolean;
  colorProfile?: string;
  sourceFiles?: ("AI" | "INDD" | "PSD")[];
  outlinesRequired: boolean;
}

export interface PrintBrief extends BaseBrief {
  type: "print";
  products?: ("flyer"|"business_card"|"poster"|"brochure"|"catalog"|"sticker"|"packaging"|"other")[];
  customProduct?: string;
  spec: PrintSpec;
  copy: PrintCopy;
  deliverables: PrintDeliverables;
}

/** LOGO / IDENTITY */
export interface LogoBrief extends BaseBrief {
  type: "logo";
  brandCore: {
    companyName: string;
    legalName?: string;
    tagline?: string;
    shortDescription?: string;
    values?: string[];
    differentiators?: string[];
  };
  competitors: { name: string; url?: string; comment?: string }[];
  usageContexts: ("website"|"app"|"social"|"print"|"signage"|"merch"|"other")[];
  customUsage?: string;

  stylePrefs: {
    like?: string[];
    dislike?: string[];
    keywords?: string[];
    colorPreferences?: string[];
    blackWhiteMandatory: boolean;
  };

  rebrandOrNew: "new" | "refresh" | "full_rebrand";
  currentLogoExists: boolean;

  deliverables: {
    logoPack: ("SVG"|"PDF"|"PNG"|"JPG"|"monochrome"|"inverted"|"favicon"|"appIcon"|"socialAvatar")[];
    sourceVector: "AI" | "SVG";
    guidelineNeeded: boolean;
    trademarkCheckNeeded: boolean;
  };
}

/** PRESENTATION */
export interface PresentationSlideText {
  slideNumber?: number;
  text?: string;
  note?: string;
}

/** PRESENTATION */
export interface PresentationBrief {
  type: "presentation";
  locale: Locale;

  projectTitle: string;

  // 1. Текст для каждого слайда или ссылка
  slidesText: string;

  // 2. Цвета/шрифты/брендбук
  designRefs?: ReferenceLink[];

  // 3. Цель/задача и ниша
  goal: string;

  // 4. Референсы
  references?: ReferenceLink[];

  // 5. Материалы
  assetsLinks?: ReferenceLink[];

  // 6. Размер/ориентация
  size: string;

  // 7. Сроки
  deadline: string;
}


export type AnyBrief =
  | StaticBrief
  | VideoBrief
  | PrintBrief
  | LogoBrief
  | PresentationBrief;
