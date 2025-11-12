import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from './LanguageContext';
import { useTranslation } from '../utils/i18n';

interface BackButtonProps {
  onClick: () => void;
}

export function BackButton({ onClick }: BackButtonProps) {
  const { language, dir } = useLanguage();
  const t = useTranslation(language);
  
  const Icon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <Icon className="w-4 h-4" />
      {t('back')}
    </Button>
  );
}
