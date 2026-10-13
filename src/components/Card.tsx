import React from 'react';
import { BlackCard as IBlackCard, WhiteCard as IWhiteCard } from '../types/game.ts';
import { Check } from 'lucide-react';

interface BlackCardProps {
  card: IBlackCard;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BlackCard: React.FC<BlackCardProps> = ({ card, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'p-3 text-sm min-h-[140px] w-36',
    md: 'p-5 text-base sm:text-lg min-h-[220px] max-w-xs w-full',
    lg: 'p-6 text-xl sm:text-2xl min-h-[280px] max-w-sm w-full',
  }[size];

  // Ersetze ___ durch hervorgehobene Lücken
  const formattedText = card.text.split(/_{3,}/g);

  return (
    <div
      className={`bg-zinc-900 border-2 border-zinc-700 rounded-2xl shadow-2xl flex flex-col justify-between text-zinc-100 font-bold select-none relative overflow-hidden transition-all duration-200 ${sizeClasses} ${className}`}
    >
      <div className="leading-snug tracking-tight">
        {formattedText.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < formattedText.length - 1 && (
              <span className="inline-block border-b-2 border-rose-500 w-16 mx-1.5 align-baseline" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-semibold tracking-wider uppercase">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          OpenDeck
        </span>
        {card.pick > 1 && (
          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono text-[11px]">
            WÄHLE {card.pick}
          </span>
        )}
      </div>
    </div>
  );
};

interface WhiteCardProps {
  card: IWhiteCard;
  isSelected?: boolean;
  selectionOrder?: number;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WhiteCard: React.FC<WhiteCardProps> = ({
  card,
  isSelected = false,
  selectionOrder,
  onClick,
  disabled = false,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'p-3 text-xs min-h-[130px] w-32',
    md: 'p-4 text-sm sm:text-base min-h-[190px] w-44 sm:w-52',
    lg: 'p-5 text-base sm:text-lg min-h-[240px] w-56 sm:w-64',
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`bg-white text-zinc-900 rounded-2xl shadow-md flex flex-col justify-between text-left font-semibold select-none relative transition-all duration-200 active:scale-95 text-balance ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl'
      } ${
        isSelected
          ? 'ring-4 ring-rose-500 scale-102 shadow-rose-500/30 shadow-xl'
          : 'border border-zinc-200'
      } ${sizeClasses} ${className}`}
    >
      <div className="leading-snug pr-4">{card.text}</div>

      <div className="mt-4 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
        <span>OpenDeck</span>
        {isSelected && (
          <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow">
            {selectionOrder !== undefined ? selectionOrder : <Check className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>
    </button>
  );
};
