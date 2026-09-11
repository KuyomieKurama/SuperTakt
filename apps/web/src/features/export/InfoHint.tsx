import { Tooltip } from '@ark-ui/react/tooltip';
import { Portal } from '@ark-ui/react/portal';
import type { ReactNode } from 'react';
import { Icon } from '../../shared/ui/Icon';

export function InfoHint({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return <Tooltip.Root openDelay={150} closeDelay={100} positioning={{ placement: 'bottom', gutter: 6 }}>
    <Tooltip.Trigger type="button" className="info-hint__trigger" aria-label={label}>
      <Icon name="info" size={14} />
    </Tooltip.Trigger>
    <Portal><Tooltip.Positioner className="popover-layer"><Tooltip.Content className="info-hint__content">
      {children}
    </Tooltip.Content></Tooltip.Positioner></Portal>
  </Tooltip.Root>;
}
