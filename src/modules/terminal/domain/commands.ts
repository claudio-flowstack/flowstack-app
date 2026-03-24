import type { TerminalCommand, TerminalChain } from './types'

const DOPPLER_PREFIX = 'doppler run -p fulfillment-automation -c dev_claudio --'

export const TERMINAL_COMMANDS: TerminalCommand[] = [
  // Wichtig
  {
    id: 'cleanup',
    label: 'Cleanup All',
    script: `${DOPPLER_PREFIX} python3 demo-backend/cleanup-all.py`,
    group: 'high',
    description: 'Reset aller Test-Daten',
    dangerous: true,
  },
  {
    id: 'reauth',
    label: 'Reauth Google',
    script: `${DOPPLER_PREFIX} python3 demo-backend/reauth-google.py`,
    group: 'high',
    description: 'Google OAuth Token erneuern',
  },
  {
    id: 'inbox',
    label: 'Check Inbox',
    script: `${DOPPLER_PREFIX} python3 demo-backend/check-inbox.py`,
    group: 'high',
    description: 'Letzte 20 Emails checken',
  },
  // Standard
  {
    id: 'tracking',
    label: 'Create Tracking Sheet',
    script: `${DOPPLER_PREFIX} python3 demo-backend/create-tracking-sheet.py`,
    group: 'medium',
    description: 'Neues Tracking Sheet',
  },
  {
    id: 'update-docs',
    label: 'Update Staged Docs',
    script: `${DOPPLER_PREFIX} python3 demo-backend/update-staged-docs.py`,
    group: 'medium',
    description: 'Template Docs aktualisieren',
  },
  {
    id: 'create-docs',
    label: 'Create Staged Docs',
    script: `${DOPPLER_PREFIX} python3 demo-backend/create-staged-docs.py`,
    group: 'medium',
    description: '12 Docs neu erstellen',
  },
  {
    id: 'painpoint',
    label: 'Create Painpoint Doc',
    script: `${DOPPLER_PREFIX} python3 demo-backend/create-painpoint-doc.py`,
    group: 'medium',
    description: 'Pain-Point-Matrix erstellen',
  },
  {
    id: 'signature',
    label: 'Set Gmail Signature',
    script: `${DOPPLER_PREFIX} python3 demo-backend/set-gmail-signature.py`,
    group: 'medium',
    description: 'Gmail Signatur setzen',
  },
]

export const TERMINAL_CHAINS: TerminalChain[] = [
  {
    id: 'full-reset',
    label: 'Full Reset',
    steps: [
      `${DOPPLER_PREFIX} python3 demo-backend/cleanup-all.py`,
      `${DOPPLER_PREFIX} python3 demo-backend/create-staged-docs.py`,
      `${DOPPLER_PREFIX} python3 demo-backend/create-tracking-sheet.py`,
    ],
    description: 'Cleanup → Docs → Tracking Sheet',
    dangerous: true,
  },
  {
    id: 'auth-refresh',
    label: 'Auth Refresh',
    steps: [
      `${DOPPLER_PREFIX} python3 demo-backend/reauth-google.py`,
      `${DOPPLER_PREFIX} python3 demo-backend/reauth-leadflow.py`,
    ],
    description: 'Google + Leadflow OAuth erneuern',
  },
  {
    id: 'docs-update',
    label: 'Docs Aktualisieren',
    steps: [
      `${DOPPLER_PREFIX} python3 demo-backend/update-staged-docs.py`,
      `${DOPPLER_PREFIX} python3 demo-backend/create-painpoint-doc.py`,
    ],
    description: 'Staged Docs + Painpoint-Matrix',
  },
]
