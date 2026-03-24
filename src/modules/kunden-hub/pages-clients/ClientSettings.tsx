import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// useLanguage available when i18n keys are added
import { useFulfillmentStore } from '../store/fulfillment-store';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import ConnectionsGrid from '../components/ConnectionsGrid';
import Button from '../ui/components/button/Button';
import { Modal } from '../ui/components/modal/index';
import type { ClientConnection } from '../data/types';

export default function ClientSettings() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const clients = useFulfillmentStore((s) => s.clients);
  const deleteClient = useFulfillmentStore((s) => s.deleteClient);
  const resetClient = useFulfillmentStore((s) => s.resetClient);

  const client = clients.find((c) => c.id === clientId);

  const [connections, setConnections] = useState<ClientConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load connections from API
  useEffect(() => {
    if (!clientId) return;
    setConnectionsLoading(true);
    api.clientExecution.get(clientId)
      .then((exec) => {
        const ctx = exec.context || {};
        const conns: ClientConnection[] = [];
        if (ctx.meta_business_id) conns.push({ service: 'meta', label: 'Meta Ads', icon: 'meta', status: 'connected', accountId: String(ctx.meta_business_id) });
        if (ctx.google_drive_folder_id) conns.push({ service: 'google_drive', label: 'Google Drive', icon: 'google_drive', status: 'connected', accountId: String(ctx.google_drive_folder_id), externalUrl: String(ctx.google_drive_folder_url || '') });
        if (ctx.slack_channel_id) conns.push({ service: 'slack', label: 'Slack', icon: 'slack', status: 'connected', accountId: String(ctx.slack_channel_id), externalUrl: String(ctx.slack_channel_url || '') });
        if (ctx.close_lead_id) conns.push({ service: 'close', label: 'Close CRM', icon: 'close', status: 'connected', accountId: String(ctx.close_lead_id), externalUrl: String(ctx.close_lead_url || '') });
        if (ctx.clickup_list_id) conns.push({ service: 'clickup', label: 'ClickUp', icon: 'clickup', status: 'connected', accountId: String(ctx.clickup_list_id), externalUrl: String(ctx.clickup_list_url || '') });
        setConnections(conns);
      })
      .catch(() => {
        setConnections(client?.connections ?? []);
      })
      .finally(() => setConnectionsLoading(false));
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!clientId) return;
    setIsDeleting(true);
    try {
      await deleteClient(clientId);
      notify({ id: `del-${Date.now()}`, type: 'success', title: 'Kunde gelöscht', message: client?.company });
      navigate('/kunden-hub/clients');
    } catch {
      notify({ id: `del-err-${Date.now()}`, type: 'error', title: 'Löschen fehlgeschlagen' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!client) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Kunde nicht gefunden.</p>
        <Button size="sm" variant="outline" onClick={() => navigate('/kunden-hub/clients')} className="mt-4">
          Zurück
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/kunden-hub/clients/${clientId}`)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Einstellungen</h1>
          <p className="text-sm text-gray-500">{client.company}</p>
        </div>
      </div>

      {/* Verbindungen */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Verbindungen</h2>
        {connectionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="h-6 w-6 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <ConnectionsGrid connections={connections} />
        )}
      </section>

      {/* Paket & Konditionen */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Paket & Konditionen</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Paket</p>
            <p className="text-sm font-medium text-gray-700">{client.paket || 'Nicht festgelegt'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Monatspreis</p>
            <p className="text-sm font-medium text-gray-700">{client.monatspreis ? `€${client.monatspreis.toLocaleString('de-DE')}` : 'Nicht festgelegt'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Account Manager</p>
            <p className="text-sm font-medium text-gray-700">{client.accountManager || 'Nicht zugewiesen'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Branche</p>
            <p className="text-sm font-medium text-gray-700">{client.branche || 'Nicht festgelegt'}</p>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="text-base font-semibold text-red-700 mb-4">Danger Zone</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Kunde zurücksetzen</p>
              <p className="text-xs text-gray-500">Setzt alle Deliverables und den Status auf Anfang zurück</p>
            </div>
            <Button size="sm" variant="outline" className="!border-orange-300 !text-orange-600 hover:!bg-orange-50" onClick={() => setResetConfirmOpen(true)}>
              Zurücksetzen
            </Button>
          </div>
          <div className="border-t border-red-200 pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Kunde löschen</p>
              <p className="text-xs text-gray-500">Entfernt den Kunden und alle zugehörigen Daten</p>
            </div>
            <Button size="sm" variant="outline" className="!border-red-300 !text-red-600 hover:!bg-red-50" onClick={() => setDeleteConfirmOpen(true)}>
              Löschen
            </Button>
          </div>
        </div>
      </section>

      {/* Delete Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} className="max-w-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Kunde löschen?</h2>
        <p className="text-sm text-gray-500 mb-6">
          <strong>{client.company}</strong> wird unwiderruflich gelöscht.
        </p>
        <div className="flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Abbrechen</Button>
          <Button size="sm" variant="primary" className="!bg-red-500 hover:!bg-red-600" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
          </Button>
        </div>
      </Modal>

      {/* Reset Modal */}
      <Modal isOpen={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} className="max-w-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Kunde zurücksetzen?</h2>
        <ul className="text-sm text-gray-500 mb-6 list-disc pl-5 space-y-1">
          <li>Strategy-Dokumente → Entwurf</li>
          <li>Alle anderen Deliverables → Blockiert</li>
          <li>Freigaben werden gelöscht</li>
          <li>Client-Status → Onboarding</li>
        </ul>
        <div className="flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setResetConfirmOpen(false)}>Abbrechen</Button>
          <Button size="sm" variant="primary" className="!bg-orange-500 hover:!bg-orange-600" onClick={() => { if (clientId) { resetClient(clientId); setResetConfirmOpen(false); } }}>
            Zurücksetzen
          </Button>
        </div>
      </Modal>
    </div>
  );
}
