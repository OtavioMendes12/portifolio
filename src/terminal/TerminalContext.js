import { createContext, useContext } from 'react';

/** { run, type, clear, registry } para os componentes de saída. */
export const TerminalContext = createContext(null);

export const useTerminal = () => useContext(TerminalContext);
