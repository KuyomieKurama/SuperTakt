import { useState } from 'react';
import { Popover } from '@ark-ui/react/popover';
import { Portal } from '@ark-ui/react/portal';
import { Icon } from './Icon';

/** Ortszeit ohne Datums- oder Zeitzonenumrechnung, minutengenau. */
export function TimeField({ label, value, onChange, disabled = false }: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hour, minute] = (value || '00:00').split(':').map(Number);
  const select = (part: 'hour' | 'minute', number: number) => {
    const hours = part === 'hour' ? number : hour ?? 0;
    const minutes = part === 'minute' ? number : minute ?? 0;
    onChange(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  };
  return <Popover.Root open={open && !disabled} onOpenChange={details => setOpen(details.open)}
    modal={false} lazyMount unmountOnExit
    positioning={{ placement: 'bottom-end', strategy: 'fixed', gutter: 6 }}>
    <Popover.Trigger className="time-field__trigger" disabled={disabled} aria-label={label}>
      <span>{value || '00:00'}</span><Icon name="clock" size={16} />
    </Popover.Trigger>
    <Portal><Popover.Positioner className="popover-layer">
      <Popover.Content className="time-field__picker" aria-label={`${label} wählen`}>
        <Popover.Title className="time-field__title">Uhrzeit</Popover.Title>
        <div className="time-field__columns">
          {(['hour', 'minute'] as const).map(part => {
            const selected = (part === 'hour' ? hour : minute) ?? 0;
            const count = part === 'hour' ? 24 : 60;
            const title = part === 'hour' ? 'Stunde' : 'Minute';
            return <div key={part}>
              <div className="field__label">{title}</div>
              <div className="time-field__options" role="listbox" aria-label={title}>
                {Array.from({ length: count }, (_, number) =>
                  <button key={number} type="button" role="option"
                    aria-selected={selected === number} tabIndex={selected === number ? 0 : -1}
                    ref={element => { if (element && selected === number) element.scrollIntoView({ block: 'nearest' }); }}
                    onClick={() => select(part, number)}
                    onKeyDown={event => {
                      const next = event.key === 'ArrowDown' ? (number + 1) % count
                        : event.key === 'ArrowUp' ? (number + count - 1) % count
                        : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : null;
                      if (next === null) return;
                      event.preventDefault();
                      select(part, next);
                      (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
                    }}>{String(number).padStart(2, '0')}</button>)}
              </div>
            </div>;
          })}
        </div>
        <Popover.CloseTrigger className="time-field__done" aria-label="Übernehmen">Übernehmen</Popover.CloseTrigger>
      </Popover.Content>
    </Popover.Positioner></Portal>
  </Popover.Root>;
}
