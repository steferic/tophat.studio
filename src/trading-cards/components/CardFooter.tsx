import React from 'react';
import { useCardTheme } from '../styles/CardThemeContext';

interface CardFooterProps {
  illustrator: string;
  cardNumber: string;
  /** Slot for the dance button (or any left-side action) */
  leftAction?: React.ReactNode;
  /** Slot for right-side actions (e.g. flip button) */
  rightAction?: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ illustrator, cardNumber, leftAction, rightAction }) => {
  const theme = useCardTheme();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2px 2px 0',
        marginTop: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {leftAction}
        <span style={{ fontSize: 6, color: theme.footer.illustratorColor }}>Illus. {illustrator}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 7, fontWeight: 700, color: theme.footer.cardNumberColor }}>{cardNumber}</span>
        {rightAction}
      </div>
    </div>
  );
};
