import bridge from '@vkontakte/vk-bridge';

export type Appearance = 'light' | 'dark';

export interface VkUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_100?: string;
}

/**
 * Приводит схему оформления VK к теме VKUI.
 */
const schemeToAppearance = (scheme: string): Appearance => {
  if (scheme === 'bright_light' || scheme === 'client_light') {
    return 'light';
  }
  return 'dark';
};

/**
 * Инициализация мини-приложения.
 * Вне VK (в обычном браузере) вызовы отклоняются — это нормально,
 * поэтому все ошибки проглатываем и возвращаем null.
 */
export const initVk = async (): Promise<VkUser | null> => {
  try {
    await bridge.send('VKWebAppInit');
  } catch {
    return null;
  }

  try {
    const info = await bridge.send('VKWebAppGetUserInfo');
    return {
      id: info.id,
      first_name: info.first_name,
      last_name: info.last_name,
      photo_100: info.photo_100,
    };
  } catch {
    return null;
  }
};

/**
 * Подписка на изменение темы VK.
 * Возвращает функцию отписки.
 */
export const subscribeAppearance = (onChange: (appearance: Appearance) => void): (() => void) => {
  const handler: Parameters<typeof bridge.subscribe>[0] = (event) => {
    const detail = event.detail as { type: string; data?: { scheme?: string } };
    if (detail.type === 'VKWebAppUpdateConfig' && detail.data?.scheme) {
      onChange(schemeToAppearance(detail.data.scheme));
    }
  };

  bridge.subscribe(handler);

  // Пытаемся сразу узнать текущую тему (если поддерживается)
  void bridge
    .send('VKWebAppGetConfig')
    .then((config) => {
      if (config.scheme) {
        onChange(schemeToAppearance(config.scheme));
      }
    })
    .catch(() => undefined);

  return () => bridge.unsubscribe(handler);
};

/**
 * Открывает другое мини-приложение VK по app_id.
 * Если bridge недоступен (обычный браузер) — открываем ссылку.
 */
export const openVkApp = async (appId: number, url: string): Promise<void> => {
  try {
    await bridge.send('VKWebAppOpenApp', { app_id: appId });
  } catch {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = url;
    }
  }
};
