import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AdaptivityProvider, AppRoot, ConfigProvider } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import './styles.css';
import { App } from './App';
import { initVk, subscribeAppearance } from './vkBridge';
import type { Appearance } from './vkBridge';

/**
 * Корневой компонент: провайдеры VKUI + инициализация vk-bridge.
 */
const Root = () => {
  const [appearance, setAppearance] = useState<Appearance>('light');

  useEffect(() => {
    // VKWebAppInit обязателен для мини-приложения
    void initVk();

    // Следим за темой оформления VK (светлая/тёмная)
    return subscribeAppearance(setAppearance);
  }, []);

  return (
    <ConfigProvider appearance={appearance}>
      <AdaptivityProvider>
        <AppRoot>
          <App />
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
