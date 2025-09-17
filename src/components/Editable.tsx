import React from 'react';

type Props = {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
};

export const Editable: React.FC<Props> = ({ value, placeholder, onChange }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div
      className="editable"
      contentEditable
      data-placeholder={placeholder || ''}
      ref={ref}
      onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
    />
  );
};
