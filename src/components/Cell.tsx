import React from 'react';
import { CellState } from '../types';
import { Check } from 'lucide-react';

interface CellProps {
  state: CellState;
  size?: 'micro' | 'standard'; // micro = 11px, standard = 24px
  onClick?: () => void;
  title?: string;
  className?: string;
}

export const Cell: React.FC<CellProps> = ({
  state,
  size = 'standard',
  onClick,
  title,
  className = '',
}) => {
  const isMicro = size === 'micro';

  return (
    <div
      onClick={state === 'pending' || state === 'done' || state === 'missed' || state === 'half' ? onClick : undefined}
      title={title}
      data-state={state}
      style={{
        width: isMicro ? 'var(--sys-cell-micro, 12px)' : 'var(--sys-cell, 24px)',
        height: isMicro ? 'var(--sys-cell-micro, 12px)' : 'var(--sys-cell, 24px)',
      }}
      className={`sys-cell ${isMicro ? '!rounded-[2px]' : '!rounded-[4px]'} ${className}`}
    >
      {state === 'done' && (
        <Check
          className={isMicro ? 'w-2 h-2 stroke-[3]' : 'w-3.5 h-3.5 stroke-[2.8] text-ob-on-gold'}
        />
      )}
    </div>
  );
};
