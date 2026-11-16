import { useState } from 'react';
import { Panel, PanelHeader } from '@vkontakte/vkui';
import { InfoModal } from './components/InfoModal';
import { Tile } from './components/Tile';
import { MENU_ITEMS } from './data/menu';
import type { MenuItem } from './data/menu';
import { openVkApp } from './vkBridge';

export const App = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleTileClick = (item: MenuItem) => {
    if (item.kind === 'app') {
      void openVkApp(item.appId, item.url);
      return;
    }
    setActiveModal(item.id);
  };

  return (
    <Panel className="menu-panel">
      <PanelHeader>► МЕНЮ</PanelHeader>

      <div className="tiles">
        {MENU_ITEMS.map((item) => (
          <Tile key={item.id} item={item} onClick={() => handleTileClick(item)} />
        ))}
      </div>

      <InfoModal activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </Panel>
  );
};
