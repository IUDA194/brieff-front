// src/briefs/defaults.ts
import type {
  Contact, BrandAssets, StaticBrief, VideoBrief, PrintBrief, LogoBrief
} from "./schemas";

export const defaultContacts: Contact = {
  name: "", email: "", phone: "", company: "", role: "", telegram: "", website: ""
};

export const defaultBrand: BrandAssets = {
  hasBrandbook: false,
  logoProvided: false,
  fontsProvided: false,
  colorPaletteProvided: false,
  downloadLinks: [],
};

export const defaultStatic: StaticBrief = {
  type: "static",
  locale: "ru",
  projectTitle: "",
  goals: [],
  kpis: [],
  contacts: defaultContacts,
  brand: defaultBrand,
  platforms: ["instagram","telegram"],
  sizes: [{ label: "IG Post", width: 1080, height: 1080, dpi: 72 }],
  copy: { headline: "", subheadline: "", body: "", cta: "", languages: ["ru"] },
  visualStyle: { keywords: [], colorPreferences: [], avoid: [] },
  deliverables: { exports: ["PNG","SVG","PDF"], sourceFiles: ["AI"], needEditableText: true }
};

export const defaultVideo: VideoBrief = {
  type: "video",
  locale: "ru",
  projectTitle: "",
  goals: [],
  kpis: [],
  contacts: defaultContacts,
  brand: defaultBrand,
  durationSec: 15,
  aspectRatio: "9:16",
  platforms: ["reels","shorts"],
  storyboardProvided: false,
  assets: {
    footageProvided: false,
    logoAnimationNeeded: false,
    subtitlesNeeded: true,
    voiceover: { needed: false },
    music: { provided: false, licenseRequired: true, refs: [] }
  },
  deliverables: {
    resolution: "1080p",
    codec: "H264",
    container: "MP4",
    cleanVersionWithoutText: false,
    thumbnailNeeded: true,
    exports: ["MP4"]
  }
};

export const defaultPrint: PrintBrief = {
  type: "print",
  locale: "ru",
  projectTitle: "",
  goals: [],
  kpis: [],
  contacts: defaultContacts,
  brand: defaultBrand,
  products: ["flyer"],
  spec: {
    size: { unit: "mm", width: 148, height: 210 },
    bleed: 3, safeMargin: 3, folds: 0, pages: 2,
    color: "CMYK",
    paper: { stock: "Coated", densityGsm: 170, finish: "matte" },
    printHouse: undefined, quantity: undefined
  },
  copy: { headings: [], body: "", legalBlocks: [], languages: ["ru"] },
  deliverables: {
    exports: ["PDF","JPG"],
    pdfForPrintWithBleeds: true,
    outlinesRequired: true
  }
};

export const defaultLogo: LogoBrief = {
  type: "logo",
  locale: "ru",
  projectTitle: "",
  goals: [],
  kpis: [],
  contacts: defaultContacts,
  brand: defaultBrand,
  brandCore: { companyName: "", tagline: "", shortDescription: "", values: [], differentiators: [] },
  competitors: [],
  usageContexts: ["website","social"],
  stylePrefs: { like: [], dislike: [], keywords: [], colorPreferences: [], blackWhiteMandatory: true },
  rebrandOrNew: "new",
  currentLogoExists: false,
  deliverables: {
    logoPack: ["SVG","PNG","monochrome","inverted","favicon"],
    sourceVector: "AI",
    guidelineNeeded: true,
    trademarkCheckNeeded: false
  }
};
