import React from 'react';

interface CardFooterProps {
  illustrator: string;
  cardNumber: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ illustrator, cardNumber }) => {
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
      <span style={{ fontSize: 6, color: '#999' }}>Illus. {illustrator}</span>
      <span style={{ fontSize: 7, fontWeight: 700, color: '#666' }}>{cardNumber}</span>
    </div>
  );
};
