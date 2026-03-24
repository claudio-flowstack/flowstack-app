import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { ClientConnection, ConnectionStatus } from '../data/types';
import ConnectionCard from './ConnectionCard';
import { Modal } from '../ui/components/modal/index';
import InputField from '../ui/form/input/InputField';
import Switch from '../ui/form/switch/Switch';
import Button from '../ui/components/button/Button';

interface ConnectionsGridProps {
  connections: ClientConnection[];
}

interface ServiceConfig {
  service: string;
  fields: { key: string; label: string; placeholder: string; format?: string }[];
  toggles?: { key: string; label: string }[];
}

const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  meta: {
    service: 'meta',
    fields: [
      { key: 'businessId', label: 'Business Manager ID', placeholder: 'z.B. 123456789012345' },
      { key: 'adAccountId', label: 'Ad Account ID', placeholder: 'act_XXXXXXXXX', format: 'act_' },
      { key: 'accessToken', label: 'Access Token (OAuth)', placeholder: 'Wird via Meta Login generiert' },
      { key: 'pixelId', label: 'Pixel ID', placeholder: 'z.B. 123456789012345' },
      { key: 'pageId', label: 'Page ID (optional)', placeholder: 'Facebook Seiten-ID' },
    ],
  },
  google_drive: {
    service: 'google_drive',
    fields: [
      { key: 'serviceAccountEmail', label: 'Service Account Email', placeholder: 'name@projekt.iam.gserviceaccount.com' },
      { key: 'folderUrl', label: 'conn.folderUrl', placeholder: 'https://drive.google.com/drive/folders/...' },
    ],
    toggles: [
      { key: 'autoCreate', label: 'conn.autoCreateFolder' },
    ],
  },
  google_tag_manager: {
    service: 'google_tag_manager',
    fields: [
      { key: 'accountId', label: 'GTM Account ID', placeholder: 'z.B. 1234567890' },
      { key: 'containerId', label: 'Container ID', placeholder: 'GTM-XXXXXX', format: 'GTM-' },
      { key: 'workspaceId', label: 'Workspace ID (optional)', placeholder: 'z.B. 5' },
    ],
  },
  google_analytics: {
    service: 'google_analytics',
    fields: [
      { key: 'propertyId', label: 'GA4 Property ID', placeholder: 'z.B. 123456789' },
      { key: 'measurementId', label: 'Measurement ID', placeholder: 'G-XXXXXXX', format: 'G-' },
      { key: 'dataStreamId', label: 'Data Stream ID (optional)', placeholder: 'z.B. 1234567890' },
    ],
  },
  slack: {
    service: 'slack',
    fields: [
      { key: 'workspaceUrl', label: 'Workspace URL', placeholder: 'https://firmenname.slack.com' },
      { key: 'channelName', label: 'Channel-Name', placeholder: '#client-name' },
      { key: 'botToken', label: 'Bot Token (OAuth)', placeholder: 'xoxb-...', format: 'xoxb-' },
      { key: 'webhookUrl', label: 'Webhook URL (optional)', placeholder: 'https://hooks.slack.com/services/...' },
    ],
  },
  clickup: {
    service: 'clickup',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'pk_...' },
      { key: 'workspaceId', label: 'Workspace ID', placeholder: 'z.B. 1234567' },
      { key: 'spaceId', label: 'Space ID', placeholder: 'z.B. 9876543' },
      { key: 'projectUrl', label: 'conn.projectUrl', placeholder: 'https://app.clickup.com/...' },
    ],
  },
  close: {
    service: 'close',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'api_XXXXXXXXXX...' },
      { key: 'orgId', label: 'Organization ID', placeholder: 'orga_...' },
      { key: 'leadUrl', label: 'Lead URL', placeholder: 'https://app.close.com/lead/...' },
    ],
  },
  notion: {
    service: 'notion',
    fields: [
      { key: 'integrationToken', label: 'Integration Token', placeholder: 'secret_...', format: 'secret_' },
      { key: 'databaseId', label: 'Database ID', placeholder: '32-stellige ID aus der Notion URL' },
      { key: 'wikiUrl', label: 'Wiki URL', placeholder: 'https://notion.so/...' },
    ],
  },
  miro: {
    service: 'miro',
    fields: [
      { key: 'accessToken', label: 'Access Token', placeholder: 'OAuth Token von Miro' },
      { key: 'teamId', label: 'Team ID', placeholder: 'z.B. 1234567890' },
      { key: 'boardUrl', label: 'Board URL', placeholder: 'https://miro.com/app/board/...' },
    ],
  },
};

const ConnectionsGrid: React.FC<ConnectionsGridProps> = ({ connections: initialConnections }) => {
  const { t } = useLanguage();
  const [connections, setConnections] = useState<ClientConnection[]>(initialConnections || []);
  const [connectModal, setConnectModal] = useState<string | null>(null);
  const [disconnectModal, setDisconnectModal] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [toggleValues, setToggleValues] = useState<Record<string, boolean>>({});

  const sorted = useMemo(() => {
    return [...connections].sort((a, b) => {
      const order = { connected: 0, error: 1, disconnected: 2, not_required: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4);
    });
  }, [connections]);

  const connectedCount = useMemo(
    () => connections.filter((c) => c.status === 'connected').length,
    [connections]
  );

  const handleOpenConnect = (service: string) => {
    // Pre-fill from existing connection data
    const conn = connections.find((c) => c.service === service);
    const prefill: Record<string, string> = {};
    if (conn?.accountId) {
      const config = SERVICE_CONFIGS[service];
      if (config?.fields[0]) {
        prefill[config.fields[0].key] = conn.accountId;
      }
    }
    if (conn?.externalUrl) {
      const config = SERVICE_CONFIGS[service];
      const urlField = config?.fields.find((f) => f.key.toLowerCase().includes('url'));
      if (urlField) {
        prefill[urlField.key] = conn.externalUrl;
      }
    }
    setFieldValues(prefill);
    setToggleValues({});
    setConnectModal(service);
  };

  // TODO: handleConnect only updates local React state — no backend API call.
  // Connections are auto-configured from the execution context.
  // The edit button has been removed from ConnectionCard for connected services.
  const handleConnect = () => {
    if (!connectModal) return;
    const config = SERVICE_CONFIGS[connectModal];
    const firstFieldValue = config?.fields[0] ? fieldValues[config.fields[0].key] : '';

    // Derive external URL if available
    let externalUrl: string | undefined;
    const urlField = config?.fields.find((f) => f.key.toLowerCase().includes('url'));
    if (urlField && fieldValues[urlField.key]) {
      externalUrl = fieldValues[urlField.key];
    }

    setConnections((prev) =>
      prev.map((c) =>
        c.service === connectModal
          ? {
              ...c,
              status: 'connected' as ConnectionStatus,
              connectedAt: new Date().toISOString(),
              accountName: firstFieldValue || c.accountName,
              accountId: config?.fields[0]?.format ? firstFieldValue : c.accountId,
              externalUrl: externalUrl || c.externalUrl,
              error: undefined,
            }
          : c
      )
    );
    setConnectModal(null);
  };

  const handleDisconnect = () => {
    if (!disconnectModal) return;
    setConnections((prev) =>
      prev.map((c) =>
        c.service === disconnectModal
          ? {
              ...c,
              status: 'disconnected' as ConnectionStatus,
              connectedAt: undefined,
              accountName: undefined,
              accountId: undefined,
              error: undefined,
            }
          : c
      )
    );
    setDisconnectModal(null);
  };

  const activeConfig = connectModal ? SERVICE_CONFIGS[connectModal] : null;
  const connectModalConn = useMemo(
    () => connections.find((c) => c.service === connectModal),
    [connections, connectModal]
  );
  const disconnectModalConn = useMemo(
    () => connections.find((c) => c.service === disconnectModal),
    [connections, disconnectModal]
  );

  return (
    <div>
      <p className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-300">
        {t('misc.servicesConnected', { connected: connectedCount, total: connections.length })}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((conn) => (
          <ConnectionCard
            key={conn.service}
            connection={conn}
            onConnect={() => handleOpenConnect(conn.service)}
            onDisconnect={() => setDisconnectModal(conn.service)}
            onEdit={() => handleOpenConnect(conn.service)}
          />
        ))}
      </div>

      {/* Connect Modal */}
      <Modal isOpen={!!connectModal} onClose={() => setConnectModal(null)} className="max-w-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
          {(connectModalConn?.label || '')} {t('action.connect').toLowerCase()}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t('conn.enterDetails')}
        </p>

        {activeConfig && (
          <div className="space-y-4">
            {activeConfig.toggles?.map((toggle) => (
              <Switch
                key={toggle.key}
                label={t(toggle.label)}
                defaultChecked={toggleValues[toggle.key] ?? false}
                onChange={(checked) =>
                  setToggleValues((prev) => ({ ...prev, [toggle.key]: checked }))
                }
              />
            ))}
            {activeConfig.fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label.startsWith('conn.') ? t(field.label) : field.label}
                </label>
                <InputField
                  type="text"
                  value={fieldValues[field.key] || ''}
                  onChange={(e) =>
                    setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                />
                {field.format && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Format: {field.format}...
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button size="sm" variant="outline" onClick={() => setConnectModal(null)}>
            {t('action.cancel')}
          </Button>
          <Button size="sm" variant="primary" onClick={handleConnect}>
            {t('action.connect')}
          </Button>
        </div>
      </Modal>

      {/* Disconnect Confirm Modal */}
      <Modal isOpen={!!disconnectModal} onClose={() => setDisconnectModal(null)} className="max-w-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          {t('conn.confirmDisconnect')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {(disconnectModalConn?.label || '')} {t('conn.willBeDisconnected')}
        </p>
        <div className="flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setDisconnectModal(null)}>
            {t('action.cancel')}
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="!bg-error-500 hover:!bg-error-600 text-white"
            onClick={handleDisconnect}
          >
            {t('action.disconnect')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ConnectionsGrid;
