import { storage } from '../lib/storage';

const KEY = 'history';
const MAX = 100;

/** Histórico de comandos estilo shell, salvo no localStorage. */
export function createHistory() {
  let items = storage.get(KEY, []);
  if (!Array.isArray(items)) items = [];
  let index = null;
  let draft = '';

  return {
    push(cmd) {
      index = null;
      draft = '';
      if (!cmd.trim() || items[items.length - 1] === cmd) return;
      items = [...items, cmd].slice(-MAX);
      storage.set(KEY, items);
    },
    /** ↑: devolve o comando anterior (ou null se não houver). */
    up(current) {
      if (!items.length) return null;
      if (index === null) {
        draft = current;
        index = items.length - 1;
      } else if (index > 0) {
        index--;
      }
      return items[index];
    },
    /** ↓: avança; ao passar do fim, volta para o que estava sendo digitado. */
    down() {
      if (index === null) return null;
      index++;
      if (index >= items.length) {
        index = null;
        return draft;
      }
      return items[index];
    },
  };
}
