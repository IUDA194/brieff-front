// src/utils/tiptapToMarkdown.ts
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import TurndownService from 'turndown';

export type TiptapJson = {
  type: 'doc';
  content?: any[];
  [k: string]: any;
};

export function isTiptapJson(v: unknown): v is TiptapJson {
  return !!v && typeof v === 'object' && (v as any).type === 'doc';
}

const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

export function tiptapToMarkdown(json: TiptapJson): string {
  const html = generateHTML(json, [StarterKit]);
  return td.turndown(html).trim();
}
