import aboutImage from '../assets/about.svg';
import casesImage from '../assets/cases.svg';
import servicesImage from '../assets/services.svg';
import teamImage from '../assets/team.svg';
import reviewsImage from '../assets/reviews.svg';

export type ModalBlock =
  | { type: 'lead'; value: string }
  | { type: 'heading'; value: string }
  | { type: 'text'; value: string }
  | { type: 'list'; items: string[] }
  | { type: 'facts'; items: { label: string; value: string }[] }
  | {
      type: 'contacts';
      items: { label: string; value: string; href?: string }[];
    };

interface MenuItemBase {
  /** Уникальный id плитки */
  id: string;
  title: string;
  image: string;
  /** Цвет-заглушка, пока грузится изображение */
  accent: string;
}

/** Плитка, открывающая диалоговое окно */
export interface ModalMenuItem extends MenuItemBase {
  kind: 'modal';
  modalTitle: string;
  blocks: ModalBlock[];
}

/** Плитка, открывающая другое мини-приложение VK */
export interface LinkMenuItem extends MenuItemBase {
  kind: 'app';
  /** id приложения из ссылки vk.ru/app<id> */
  appId: number;
  /** Запасная ссылка, если bridge недоступен */
  url: string;
}

export type MenuItem = ModalMenuItem | LinkMenuItem;

export const isModalItem = (item: MenuItem): item is ModalMenuItem => item.kind === 'modal';

/**
 * Содержимое меню.
 * Чтобы добавить раздел — допишите объект в массив:
 * плитка и модальное окно появятся автоматически.
 */
export const MENU_ITEMS: MenuItem[] = [
  {
    kind: 'modal',
    id: 'info',
    title: 'Информация',
    image: aboutImage,
    accent: '#4C8DFF',
    modalTitle: 'Информация',
    blocks: [{ type: 'text', value: 'привет мир' }],
  },
  {
    kind: 'modal',
    id: 'distribution',
    title: 'Распределение',
    image: casesImage,
    accent: '#28C76F',
    modalTitle: 'Распределение',
    blocks: [{ type: 'text', value: 'привет мир' }],
  },
  {
    kind: 'app',
    id: 'stick',
    title: 'Получить палочку',
    image: servicesImage,
    accent: '#FF9A3D',
    appId: 54660044,
    url: 'https://vk.ru/app54660044',
  },
  {
    kind: 'modal',
    id: 'administration',
    title: 'Администрация',
    image: teamImage,
    accent: '#7B5CFF',
    modalTitle: 'Администрация',
    blocks: [{ type: 'text', value: 'привет мир' }],
  },
  {
    kind: 'modal',
    id: 'pridira',
    title: 'Придира',
    image: reviewsImage,
    accent: '#FF6FA5',
    modalTitle: 'Придира',
    blocks: [{ type: 'text', value: 'привет мир' }],
  },
];
