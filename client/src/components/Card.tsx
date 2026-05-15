import React from 'react';
import { Card as CardType } from '../../../server/src/game/types'; // Using server types for consistency

interface CardProps {
  card: CardType;
  onClick?: () => void;
  playable?: boolean;
  isFaceDown?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, playable = false, isFaceDown = false }) => {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [card.id, isFaceDown]);

  // Determine card style based on color
  let bgColor = 'var(--black)';
  let textColor = 'white';

  if (!isFaceDown) {
    switch (card.color) {
      case 'red': bgColor = 'var(--red)'; break;
      case 'blue': bgColor = 'var(--blue)'; break;
      case 'green': bgColor = 'var(--green)'; break;
      case 'yellow': bgColor = 'var(--yellow)'; break;
      case 'black': bgColor = 'var(--black)'; break;
    }
  }

  const renderFallback = () => {
    if (isFaceDown) {
      return (
        <div style={{
          width: '100%', height: '100%', 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          border: '4px solid white', borderRadius: '10px', flexDirection: 'column'
        }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', transform: 'rotate(-20deg)', boxShadow: '0 4px 6px rgba(0,0,0,0.5)' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', textShadow: '1px 1px 0 #000' }}>LC</span>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        width: '100%', height: '100%',
        background: bgColor,
        borderRadius: '10px',
        border: '4px solid white',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        color: textColor, position: 'relative',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)'
      }}>
        {/* Top left value */}
        <span style={{ position: 'absolute', top: '5px', left: '8px', fontSize: '1rem', fontWeight: 'bold' }}>
          {card.value === 'colorChange' ? '🌈' : card.value}
        </span>
        
        {/* Center large value */}
        <span style={{ fontSize: '3rem', fontWeight: 800, textShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}>
          {card.value === 'colorChange' ? '🌈' : card.value}
        </span>

        {/* Bottom right value (inverted) */}
        <span style={{ position: 'absolute', bottom: '5px', right: '8px', fontSize: '1rem', fontWeight: 'bold', transform: 'rotate(180deg)' }}>
          {card.value === 'colorChange' ? '🌈' : card.value}
        </span>
      </div>
    );
  };

  return (
    <div 
      draggable={playable && !isFaceDown}
      onDragStart={(e) => {
        if (playable && !isFaceDown) {
          e.dataTransfer.setData('cardId', card.id);
          e.dataTransfer.effectAllowed = 'move';
        }
      }}
      onClick={playable ? onClick : undefined}
      style={{
        width: '100px',
        height: '150px',
        borderRadius: '8px',
        cursor: playable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: playable ? '0 10px 20px rgba(99, 102, 241, 0.4)' : '0 4px 6px rgba(0,0,0,0.3)',
        border: playable ? '2px solid #a855f7' : 'none',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {!imageError ? (
        <img 
          src={isFaceDown ? '/assets/cards/card_back.png' : `/assets/cards/${card.imagePath}`} 
          alt={isFaceDown ? 'Card Back' : `${card.color} ${card.value}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImageError(true)}
          draggable={false} // Prevent image dragging so div drag works
        />
      ) : (
        renderFallback()
      )}
      
      {/* Dim unplayable cards slightly if they are in hand (not facedown and not playable) */}
      {!isFaceDown && !playable && onClick && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)' }} />
      )}
    </div>
  );
};

export default Card;
