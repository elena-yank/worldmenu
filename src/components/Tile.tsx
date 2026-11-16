import type { KeyboardEvent } from 'react';
import { Card, Title } from '@vkontakte/vkui';
import type { MenuItem } from '../data/menu';

interface TileProps {
  item: MenuItem;
  onClick: () => void;
}

/**
 * Вертикальная плитка меню на всю высоту экрана:
 * изображение на фоне, название — внизу.
 * Доступна с клавиатуры (Enter / Space).
 */
export const Tile = ({ item, onClick }: TileProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      mode="shadow"
      className="tile"
      role="button"
      tabIndex={0}
      aria-label={item.title}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="tile__media" style={{ backgroundColor: item.accent }}>
        <img src={item.image} alt="" loading="lazy" />
      </div>
      <div className="tile__body">
        <Title level="3" className="tile__title">
          {item.title}
        </Title>
      </div>
    </Card>
  );
};
