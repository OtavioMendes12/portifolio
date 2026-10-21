import { Children } from 'react';
import { useTerminal } from '../terminal/TerminalContext';

const textOf = (children) => Children.toArray(children).filter((c) => typeof c === 'string' || typeof c === 'number').join('');

/** Palavra clicável: escreve o comando no terminal (o visitante só aperta Enter). */
export default function CmdLink({ cmd, children, className = '' }) {
  const { type } = useTerminal();
  const command = cmd ?? textOf(children);
  return (
    <button type="button" className={`cmd-link ${className}`} onClick={() => type(command)}>
      {children ?? command}
    </button>
  );
}
