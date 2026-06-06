import React from 'react';
import type { EscalationState } from '../../api/chatApi';

interface EscalationBannerProps {
  escalationState: EscalationState;
}

const bannerConfig: Record<
  EscalationState,
  { show: boolean; label: string; className: string }
> = {
  OPEN: {
    show: false,
    label: '',
    className: '',
  },
  ESCALATION_REQUESTED: {
    show: true,
    label: 'Escalation requested. We are routing this chat to a real agent.',
    className: 'bg-amber-50 border-amber-300 text-amber-900',
  },
  ESCALATION_QUEUED: {
    show: true,
    label: 'You are in the escalation queue. A real agent will join shortly.',
    className: 'bg-amber-50 border-amber-300 text-amber-900',
  },
  HUMAN_ACTIVE: {
    show: true,
    label: 'A real agent is now active in this conversation.',
    className: 'bg-emerald-50 border-emerald-300 text-emerald-900',
  },
  HUMAN_RESOLVED: {
    show: true,
    label: 'This ticket was resolved by a real agent.',
    className: 'bg-sky-50 border-sky-300 text-sky-900',
  },
  CLOSED: {
    show: true,
    label: 'This ticket is closed.',
    className: 'bg-slate-100 border-slate-300 text-slate-700',
  },
};

export const EscalationBanner: React.FC<EscalationBannerProps> = ({ escalationState }) => {
  const config = bannerConfig[escalationState];

  if (!config.show) {
    return null;
  }

  return (
    <div className={`mx-4 mt-3 rounded-md border px-3 py-2 text-xs font-medium ${config.className}`}>
      {config.label}
    </div>
  );
};

export default EscalationBanner;
