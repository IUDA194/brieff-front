import React, { useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';


interface Props {
value?: string; // can be URL or dataURL
onChange: (val: string | null) => void;
}


export const ImageInput: React.FC<Props> = ({ value, onChange }) => {
const fileRef = useRef<HTMLInputElement | null>(null);
const { t } = useI18n();


async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
const f = e.target.files?.[0];
if (!f) return;
const dataUrl = await toDataUrl(f);
onChange(dataUrl);
}


return (
<div style={{ display: 'grid', gap: 8 }}>
<input
type="url"
placeholder={t('field.image.url', 'Image URL')}
value={value?.startsWith('data:') ? '' : (value || '')}
onChange={(e) => onChange(e.target.value || null)}
style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
/>
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
<span style={{ opacity: 0.7 }}>{t('field.image.or', 'or upload a file')}</span>
<input ref={fileRef} type="file" accept="image/*" onChange={onFile} />
</div>
{value && (
<img src={value} alt="preview" style={{ maxWidth: 240, borderRadius: 12, border: '1px solid #eee' }} />
)}
</div>
);
};


function toDataUrl(file: File): Promise<string> {
return new Promise((resolve, reject) => {
const reader = new FileReader();
reader.onload = () => resolve(String(reader.result));
reader.onerror = (e) => reject(e);
reader.readAsDataURL(file);
});
}