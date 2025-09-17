// src/utils/markdown.ts
function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function mdToHtml(mdRaw: string): string {
  let md = (mdRaw || '').replace(/\r\n?/g, '\n').trim();

  // 🔧 Нормализуем «визуальные» маркеры в markdown-вид
  // • item → - item
  // – item / — item → - item
  md = md.replace(/^\s*[•–—]\s+/gm, '- ');

  md = escapeHtml(md);

  md = md.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);
  md = md.replace(/(\*\*|__)(.+?)\1/g, (_m, _b, txt) => `<strong>${txt}</strong>`);
  md = md.replace(/(\*|_)([^*_]+)\1/g, (_m, _b, txt) => `<em>${txt}</em>`);
  md = md.replace(/~~(.+?)~~/g, (_m, txt) => `<del>${txt}</del>`);
  md = md.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);

  const lines = md.split('\n');
  const html: string[] = [];
  let inUl = false, inOl = false, inBQ = false;

  const closeLists = () => { if (inUl) { html.push('</ul>'); inUl = false; } if (inOl) { html.push('</ol>'); inOl = false; } };
  const closeBQ = () => { if (inBQ) { html.push('</blockquote>'); inBQ = false; } };

  for (const raw of lines) {
    const line = raw.trim();

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line)) { closeLists(); closeBQ(); html.push('<hr/>'); continue; }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { const lvl = h[1].length; closeLists(); closeBQ(); html.push(`<h${lvl}>${h[2]}</h${lvl}>`); continue; }

    if (/^>/.test(line)) {
      closeLists();
      if (!inBQ) { html.push('<blockquote>'); inBQ = true; }
      html.push(line.replace(/^>\s?/, ''));
      continue;
    } else closeBQ();

    if (/^[-*+]\s+/.test(line)) {
      if (inOl) { html.push('</ol>'); inOl = false; }
      if (!inUl) { html.push('<ul>'); inUl = true; }
      html.push(`<li>${line.replace(/^[-*+]\s+/, '')}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      if (inUl) { html.push('</ul>'); inUl = false; }
      if (!inOl) { html.push('<ol>'); inOl = true; }
      html.push(`<li>${line.replace(/^\d+\.\s+/, '')}</li>`);
      continue;
    }

    if (line === '') { closeLists(); closeBQ(); html.push(''); continue; }

    closeLists(); closeBQ();
    html.push(`<p>${line}</p>`);
  }

  if (inUl) html.push('</ul>');
  if (inOl) html.push('</ol>');
  if (inBQ) html.push('</blockquote>');

  return html.join('\n');
}
