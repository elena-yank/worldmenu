import {
  Button,
  Div,
  ModalPage,
  ModalPageHeader,
  ModalRoot,
  PanelHeaderButton,
  Spacing,
  Text,
  Title,
} from '@vkontakte/vkui';
import { Icon24Dismiss } from '@vkontakte/icons';
import { MENU_ITEMS, isModalItem } from '../data/menu';
import type { ModalBlock } from '../data/menu';

interface InfoModalProps {
  activeModal: string | null;
  onClose: () => void;
}

/**
 * Рендерит блок контента модального окна.
 * Все возможные блоки описаны в src/data/menu.ts.
 */
const renderBlocks = (blocks: ModalBlock[]) => (
  <div className="modal-body">
    {blocks.map((block, index) => {
      switch (block.type) {
        case 'lead':
          return (
            <Text key={index} className="modal-lead">
              {block.value}
            </Text>
          );
        case 'heading':
          return (
            <Title key={index} level="3">
              {block.value}
            </Title>
          );
        case 'text':
          return <Text key={index}>{block.value}</Text>;
        case 'list':
          return (
            <ul key={index} className="modal-list">
              {block.items.map((line) => (
                <li key={line}>
                  <Text>{line}</Text>
                </li>
              ))}
            </ul>
          );
        case 'facts':
          return (
            <div key={index} className="modal-facts">
              {block.items.map((fact) => (
                <div key={fact.label} className="modal-fact">
                  <Title level="3" className="modal-fact__value">
                    {fact.value}
                  </Title>
                  <Text className="modal-fact__label">{fact.label}</Text>
                </div>
              ))}
            </div>
          );
        case 'contacts':
          return (
            <div key={index} className="modal-contacts">
              {block.items.map((contact) => (
                <div key={contact.label} className="modal-contact">
                  <Text className="modal-contact__label">{contact.label}</Text>
                  {contact.href ? (
                    <a className="modal-contact__value" href={contact.href}>
                      {contact.value}
                    </a>
                  ) : (
                    <Text className="modal-contact__value">{contact.value}</Text>
                  )}
                </div>
              ))}
            </div>
          );
        default:
          return null;
      }
    })}
  </div>
);

/**
 * Один ModalRoot на всё приложение: активное окно определяется по id плитки.
 */
export const InfoModal = ({ activeModal, onClose }: InfoModalProps) => (
  <ModalRoot activeModal={activeModal} onClose={onClose}>
    {MENU_ITEMS.filter(isModalItem).map((item) => (
      <ModalPage
        key={item.id}
        id={item.id}
        onClose={onClose}
        header={
          <ModalPageHeader
            after={
              <PanelHeaderButton onClick={onClose} aria-label="Закрыть">
                <Icon24Dismiss />
              </PanelHeaderButton>
            }
          >
            {item.modalTitle}
          </ModalPageHeader>
        }
      >
        <Div>{renderBlocks(item.blocks)}</Div>
        <Div>
          <Button size="l" mode="secondary" stretched onClick={onClose}>
            Закрыть
          </Button>
        </Div>
        <Spacing size={8} />
      </ModalPage>
    ))}
  </ModalRoot>
);
