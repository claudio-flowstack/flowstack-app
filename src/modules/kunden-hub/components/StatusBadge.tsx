import Badge from '../ui/components/badge/Badge';
import { useLanguage } from '../i18n/LanguageContext';
import type { ClientStatus, DeliverableStatus } from '../data/types';
import { CLIENT_STATUS_CONFIG, DELIVERABLE_STATUS_CONFIG } from '../data/constants';

type BadgeColor = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark';

function colorToBadge(colorClass: string): BadgeColor {
  if (colorClass.includes('success')) return 'success';
  if (colorClass.includes('error')) return 'error';
  if (colorClass.includes('warning')) return 'warning';
  if (colorClass.includes('brand')) return 'primary';
  if (colorClass.includes('blue-light')) return 'info';
  return 'light';
}

interface StatusBadgeProps {
  status?: ClientStatus;
  deliverableStatus?: DeliverableStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, deliverableStatus }) => {
  const { t } = useLanguage();

  if (deliverableStatus) {
    const cfg = DELIVERABLE_STATUS_CONFIG[deliverableStatus];
    if (!cfg) return null;
    return (
      <Badge variant="light" size="sm" color={colorToBadge(cfg.color)}>
        {t(`delStatus.${deliverableStatus}`)}
      </Badge>
    );
  }

  if (status) {
    const cfg = CLIENT_STATUS_CONFIG[status];
    if (!cfg) return null;
    return (
      <Badge variant="light" size="sm" color={colorToBadge(cfg.color)}>
        {t(`status.${status}`)}
      </Badge>
    );
  }

  return null;
};

export default StatusBadge;
