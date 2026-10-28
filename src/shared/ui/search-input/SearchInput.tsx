import React from 'react';
import clsx from 'clsx';
import styles from './SearchInput.module.css';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (value: string) => void;
  iconContent?: React.ReactNode;
  className?: string;
}
export const SearchInput = ({
  placeholder = 'Искать навык',
  value,
  onChange,
  onSubmit,
  iconContent,
  className,
}: SearchInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit(value ?? '');
    }
  };
return (
    <div className={clsx(styles.wrapper, className)}>
      <span className={styles.icon} aria-hidden="true">
        {iconContent}
      </span>
      <input
            type="text"
            className={styles.input}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            aria-label={placeholder}
          />
    </div>
  );
};
