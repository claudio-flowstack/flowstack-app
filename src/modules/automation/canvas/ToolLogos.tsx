/**
 * Tool Logos -- Brand-accurate SVG logos for popular tools/services
 * Usage: renderNodeIcon(node) returns the appropriate React element
 *
 * Migrated from AI Automation project (ToolLogos.tsx + FunnelLogos.tsx)
 * All 47 SVG logo components included
 */

import React from 'react'

// ── Inline SVG Logo Components ──────────────────────────────────────────────

const s = 20

// ── Google ───────────────────────────────────────────────────────────────────

const GoogleDrive: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 87.3 78" fill="none">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5l16.15-28z" fill="#00AC47"/>
    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 58c.8-1.4 1.2-2.95 1.2-4.5H59.8L73.55 76.8z" fill="#EA4335"/>
    <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2L43.65 25z" fill="#00832D"/>
    <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h36.6c1.6 0 3.15-.45 4.5-1.2L59.8 53z" fill="#2684FC"/>
    <path d="M73.4 26.5 60.65 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.6 25l16.15 28h27.5c0-1.55-.4-3.1-1.2-4.5l-12.65-22z" fill="#FFBA00"/>
  </svg>
)

const Gmail: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill="#f2f2f2"/>
    <path d="M2 6l10 7 10-7" stroke="#EA4335" strokeWidth="0" fill="none"/>
    <path d="M22 6L12 13 2 6v12h2V8.4l8 5.6 8-5.6V18h2V6z" fill="#EA4335" opacity={0.85}/>
    <path d="M2 6l10 7V8.4L4 4H4a2 2 0 00-2 2z" fill="#C5221F" opacity={0.7}/>
    <path d="M22 6L12 13V8.4l8-4.4h0a2 2 0 012 2z" fill="#F44336" opacity={0.6}/>
  </svg>
)

const GoogleSheets: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#0F9D58"/>
    <path d="M14 2v6h6" fill="#87CEAC"/>
    <rect x="7" y="11" width="10" height="8" rx="0.5" fill="white" opacity={0.9}/>
    <line x1="7" y1="14" x2="17" y2="14" stroke="#0F9D58" strokeWidth="0.8"/>
    <line x1="7" y1="16.5" x2="17" y2="16.5" stroke="#0F9D58" strokeWidth="0.8"/>
    <line x1="11.5" y1="11" x2="11.5" y2="19" stroke="#0F9D58" strokeWidth="0.8"/>
  </svg>
)

const GoogleDocs: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#4285F4"/>
    <path d="M14 2v6h6" fill="#A1C2FA"/>
    <line x1="8" y1="13" x2="16" y2="13" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity={0.9}/>
    <line x1="8" y1="16" x2="14" y2="16" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity={0.9}/>
    <line x1="8" y1="19" x2="15" y2="19" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity={0.7}/>
  </svg>
)

const GoogleCalendar: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" fill="#fff"/>
    <rect x="3" y="4" width="18" height="6" rx="2" fill="#4285F4"/>
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4285F4" strokeWidth="1.2" fill="none"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
    <text x="12" y="18.5" textAnchor="middle" fill="#4285F4" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">31</text>
  </svg>
)

// ── Communication ────────────────────────────────────────────────────────────

const Slack: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M6.5 14.5a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5H8v1.5A1.5 1.5 0 016.5 14.5z" fill="#E01E5A"/>
    <path d="M8 14.5a1.5 1.5 0 001.5-1.5V8A1.5 1.5 0 008 6.5 1.5 1.5 0 006.5 8v5a1.5 1.5 0 001.5 1.5z" fill="#E01E5A"/>
    <path d="M8 6.5A1.5 1.5 0 019.5 5 1.5 1.5 0 0111 6.5V8H9.5A1.5 1.5 0 018 6.5z" fill="#36C5F0"/>
    <path d="M8 8a1.5 1.5 0 001.5 1.5H16A1.5 1.5 0 0017.5 8 1.5 1.5 0 0016 6.5H9.5A1.5 1.5 0 008 8z" fill="#36C5F0"/>
    <path d="M17.5 8A1.5 1.5 0 0119 9.5a1.5 1.5 0 01-1.5 1.5H16V9.5A1.5 1.5 0 0117.5 8z" fill="#2EB67D"/>
    <path d="M16 8a1.5 1.5 0 00-1.5 1.5V16a1.5 1.5 0 001.5 1.5 1.5 1.5 0 001.5-1.5V9.5A1.5 1.5 0 0016 8z" fill="#2EB67D"/>
    <path d="M16 17.5a1.5 1.5 0 01-1.5 1.5 1.5 1.5 0 01-1.5-1.5V16h1.5a1.5 1.5 0 011.5 1.5z" fill="#ECB22E"/>
    <path d="M16 16a1.5 1.5 0 00-1.5-1.5H8A1.5 1.5 0 006.5 16 1.5 1.5 0 008 17.5h6.5A1.5 1.5 0 0016 16z" fill="#ECB22E"/>
  </svg>
)

const WhatsApp: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.4A10 10 0 1012 2z" fill="#25D366"/>
    <path d="M9.1 7.6c-.2-.5-.4-.5-.6-.5h-.5a1 1 0 00-.7.3c-.3.3-.9.9-.9 2.1s1 2.5 1.1 2.6c.1.2 1.8 3 4.5 4 2.2.8 2.7.7 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2c-.1-.1-.3-.2-.6-.3s-1.5-.8-1.7-.9c-.3-.1-.4-.1-.6.2l-.8 1c-.2.2-.3.2-.6.1s-1.2-.5-2.2-1.4c-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.4c.1-.2.2-.3.3-.5s.1-.3 0-.4l-.8-1.6z" fill="white"/>
  </svg>
)

const Telegram: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#26A5E4"/>
    <path d="M6.5 11.5l9.2-4.2c.4-.2.8.2.7.6L14.8 15c-.1.3-.5.4-.7.2l-2.3-1.7-1.1 1.1c-.2.2-.5.1-.5-.2v-2l5.5-5c.1-.1 0-.2-.1-.1l-6.8 4.2-2.5-.8c-.3-.1-.3-.5 0-.7z" fill="white"/>
  </svg>
)

const MicrosoftTeams: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="17" cy="7" r="3" fill="#5B5FC7" opacity={0.4}/>
    <rect x="12" y="5" width="9" height="11" rx="1.5" fill="#5B5FC7" opacity={0.6}/>
    <rect x="3" y="7" width="11" height="11" rx="1.5" fill="#5B5FC7"/>
    <text x="8.5" y="16" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif">T</text>
  </svg>
)

// ── CRM ──────────────────────────────────────────────────────────────────────

const HubSpot: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="17" cy="7" r="1.8" fill="#FF7A59"/>
    <path d="M15.2 8.2V12a3.5 3.5 0 11-2.2 1l-2.3-1.6a2.5 2.5 0 110-3.8L13 9a3.5 3.5 0 012.2-.8z" fill="#FF7A59"/>
    <circle cx="12" cy="14.5" r="2.3" fill="#FF7A59"/>
    <circle cx="6" cy="11" r="1.5" fill="#FF7A59"/>
  </svg>
)

const Salesforce: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M10 5.5a4.2 4.2 0 014-1.5c2 0 3.6 1.1 4.3 2.7a3.5 3.5 0 011.2-.2 3.5 3.5 0 010 7H5.5a3 3 0 01-.3-6c.4-1.7 2-3 3.8-3a4 4 0 011 .5z" fill="#00A1E0"/>
  </svg>
)

const Pipedrive: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#017737" opacity={0.15}/>
    <rect x="3" y="3" width="18" height="18" rx="4" stroke="#017737" strokeWidth="1.5" fill="none"/>
    <circle cx="12" cy="9" r="3" stroke="#017737" strokeWidth="1.8" fill="none"/>
    <line x1="12" y1="12" x2="12" y2="19" stroke="#017737" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

// ── Automation ───────────────────────────────────────────────────────────────

const Make: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#6D00CC"/>
    <circle cx="8.5" cy="12" r="2.5" fill="white" opacity={0.9}/>
    <circle cx="15.5" cy="12" r="2.5" fill="white" opacity={0.9}/>
    <rect x="10" y="10.5" width="4" height="3" fill="#6D00CC"/>
    <path d="M10 12h4" stroke="white" strokeWidth="1.5" opacity={0.9}/>
  </svg>
)

const N8n: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#EA4B71"/>
    <circle cx="8" cy="12" r="2.2" fill="white" opacity={0.9}/>
    <circle cx="16" cy="9" r="2.2" fill="white" opacity={0.9}/>
    <circle cx="16" cy="15" r="2.2" fill="white" opacity={0.9}/>
    <line x1="10" y1="11.2" x2="14" y2="9.5" stroke="white" strokeWidth="1.3" opacity={0.8}/>
    <line x1="10" y1="12.8" x2="14" y2="14.5" stroke="white" strokeWidth="1.3" opacity={0.8}/>
  </svg>
)

const Zapier: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#FF4A00"/>
    <path d="M12 5v14M5 12h14M7.8 7.8l8.4 8.4M16.2 7.8l-8.4 8.4" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="3" fill="#FF4A00" stroke="white" strokeWidth="1.2"/>
  </svg>
)

// ── AI ───────────────────────────────────────────────────────────────────────

const OpenAI: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M22.28 9.37a5.87 5.87 0 00-.51-4.85 5.96 5.96 0 00-6.42-2.86A5.9 5.9 0 0010.93.03a5.97 5.97 0 00-5.71 4.14 5.88 5.88 0 00-3.93 2.85 5.96 5.96 0 00.74 6.98 5.87 5.87 0 00.51 4.85 5.96 5.96 0 006.42 2.86A5.9 5.9 0 0013.38 24a5.97 5.97 0 005.71-4.14 5.88 5.88 0 003.93-2.85 5.96 5.96 0 00-.74-6.98v-.66zM13.38 22.34a4.42 4.42 0 01-2.83-1.02l.14-.08 4.7-2.71a.76.76 0 00.39-.67v-6.62l1.99 1.15a.07.07 0 01.04.05v5.49a4.46 4.46 0 01-4.43 4.41zM4.05 18.25a4.41 4.41 0 01-.53-2.97l.14.08 4.7 2.71a.78.78 0 00.77 0l5.74-3.31v2.3a.07.07 0 01-.03.06l-4.75 2.74a4.46 4.46 0 01-6.04-1.61zM3.03 8.06A4.42 4.42 0 015.36 6.1v5.57a.76.76 0 00.38.66l5.74 3.31-1.99 1.15a.07.07 0 01-.07 0L4.67 14.06a4.46 4.46 0 01-1.64-5.99zm16.16 3.76l-5.74-3.31 1.99-1.15a.07.07 0 01.07 0l4.75 2.74a4.44 4.44 0 01-.68 8.01v-5.57a.76.76 0 00-.39-.67v-.05zm1.98-3a4.49 4.49 0 00-.67-.46l-.14-.08-4.7-2.71a.78.78 0 00-.77 0l-5.74 3.31V7.58a.07.07 0 01.03-.06l4.75-2.74a4.46 4.46 0 016.65 4.62l-.41-.58zM9.39 13.32L7.4 12.17a.07.07 0 01-.04-.05V6.63a4.44 4.44 0 017.26-3.41l-.14.08-4.7 2.71a.76.76 0 00-.39.67v6.64zm1.08-2.33l2.56-1.47 2.56 1.47v2.95l-2.56 1.47-2.56-1.47V11z" fill="#10A37F"/>
  </svg>
)

const Claude: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M15.27 4.69a.78.78 0 00-1.45-.08L12 9.22 10.18 4.6a.78.78 0 00-1.45.08L6.05 12l2.68 7.31a.78.78 0 001.45.08L12 14.78l1.82 4.62a.78.78 0 001.45-.08L17.95 12l-2.68-7.31z" fill="#D97706"/>
    <path d="M12 2v4.5M12 17.5V22M4.5 9.5L8 11M16 13l3.5 1.5M4.5 14.5L8 13M16 11l3.5-1.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" opacity={0.5}/>
  </svg>
)

// ── Productivity ─────────────────────────────────────────────────────────────

const Notion: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4 4.5A2.5 2.5 0 016.5 2h8.13a2.5 2.5 0 011.77.73l2.87 2.87A2.5 2.5 0 0120 7.37V19.5a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 19.5V4.5z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity={0.7}/>
    <path d="M7.5 7l3.5 1v8.5l-3.5-1V7z" fill="currentColor" opacity={0.5}/>
    <path d="M11 8l4-1v8.5l-4 1V8z" stroke="currentColor" strokeWidth="1" fill="none" opacity={0.4}/>
  </svg>
)

const Airtable: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M11.5 3.5L3 7.5l8.5 4 8.5-4-8.5-4z" fill="#FCB400"/>
    <path d="M12.5 12.5v8l8.5-4v-8l-8.5 4z" fill="#18BFFF"/>
    <path d="M11.5 12.5v8L3 16.5v-8l8.5 4z" fill="#F82B60"/>
  </svg>
)

// ── Social ───────────────────────────────────────────────────────────────────

const LinkedIn: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#0A66C2"/>
    <path d="M7 10v7M7 7v.01" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M11 17v-4.5a2 2 0 014 0V17" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="11" y1="10" x2="11" y2="17" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
)

const Meta: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 512 512" fill="none">
    <defs>
      <linearGradient id="meta-g" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0081FB"/>
        <stop offset="100%" stopColor="#0064E0"/>
      </linearGradient>
    </defs>
    <path d="M115.2 256c0-66.8 22-119.6 51.2-143.2 14-11.2 29.6-16 45.6-12.8 20 4 38.8 22.8 60 60l24 42c14.4 25.2 26.4 44.4 42 56.8 16.8 13.2 35.6 17.6 58 10 27.6-9.2 47.2-40 58.4-80.4 9.2-33.2 13.6-74 13.6-116.4h-60c0 38-3.6 72-11.2 98.8-8.4 30-20.8 47.6-34 52-7.6 2.4-13.6.4-21.2-5.6-10-8-19.6-22-32.4-44.4l-25.2-44c-24-42.4-48-68-82-74.4-26.4-5.2-51.6 3.2-73.2 20.4C91.6 115.6 56 180.4 56 256s35.6 140.4 72.8 181.2c21.6 17.2 46.8 25.6 73.2 20.4 34-6.4 58-32 82-74.4l25.2-44c12.8-22.4 22.4-36.4 32.4-44.4 7.6-6 13.6-8 21.2-5.6 13.2 4.4 25.6 22 34 52 7.6 26.8 11.2 60.8 11.2 98.8h60c0-42.4-4.4-83.2-13.6-116.4-11.2-40.4-30.8-71.2-58.4-80.4-22.4-7.6-41.2-3.2-58 10-15.6 12.4-27.6 31.6-42 56.8l-24 42c-21.2 37.2-40 56-60 60-16 3.2-31.6-1.6-45.6-12.8-29.2-23.6-51.2-76.4-51.2-143.2z" fill="url(#meta-g)"/>
  </svg>
)

const GitHub: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21.5c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12c0-5.52-4.48-10-10-10z" fill="currentColor" opacity={0.8}/>
  </svg>
)

const Jira: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12.005 2L2 12.005l4.998 4.998L12.005 22l10.005-10.005L17.003 7.003 12.005 2zm0 5.6l4.398 4.398-4.398 4.397-4.398-4.397L12.005 7.6z" fill="#2684FF"/>
  </svg>
)

const TikTok: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M16.6 5.82A4.28 4.28 0 0115.54 3h-3.09v12.4a2.59 2.59 0 01-2.59 2.5c-1.43 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.07 2.49 5.44 5.59 5.44 3.32 0 5.74-2.65 5.74-5.63V9.41A7.35 7.35 0 0019.54 11V7.77c-1.13 0-2.48-.72-2.94-1.95z" fill="currentColor" opacity={0.7}/>
  </svg>
)

const Instagram: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="ig-g" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#F77737"/>
        <stop offset="50%" stopColor="#E1306C"/>
        <stop offset="75%" stopColor="#C13584"/>
        <stop offset="100%" stopColor="#833AB4"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-g)"/>
    <rect x="4.5" y="4.5" width="15" height="15" rx="4" stroke="white" strokeWidth="1.5" fill="none"/>
    <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.5" fill="none"/>
    <circle cx="17" cy="7" r="1.1" fill="white"/>
  </svg>
)

const YouTube: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0000" opacity={0.15}/>
    <rect x="2" y="5" width="20" height="14" rx="4" stroke="#FF0000" strokeWidth="1.5" fill="none"/>
    <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#FF0000" opacity={0.7}/>
  </svg>
)

// ── Ads ──────────────────────────────────────────────────────────────────────

const GoogleAds: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M3.27 16.27l6-10.37a2.12 2.12 0 013.64 0l6 10.37a2.12 2.12 0 01-1.82 3.18H5.09a2.12 2.12 0 01-1.82-3.18z" fill="#FBBC04" opacity={0.25}/>
    <circle cx="17.5" cy="17.5" r="3" fill="#4285F4" opacity={0.6}/>
    <rect x="3" y="14" width="6" height="6" rx="1" fill="#34A853" opacity={0.5}/>
    <path d="M8.5 5.5l4 7" stroke="#EA4335" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

// ── Booking ──────────────────────────────────────────────────────────────────

const Calendly: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#006BFF" strokeWidth="1.5" fill="#006BFF" opacity={0.12}/>
    <path d="M12 7v5l3.5 2" stroke="#006BFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="1" fill="#006BFF"/>
  </svg>
)

// ── Payment ──────────────────────────────────────────────────────────────────

const Stripe: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#635BFF" opacity={0.12}/>
    <rect x="3" y="3" width="18" height="18" rx="4" stroke="#635BFF" strokeWidth="1.5" fill="none"/>
    <path d="M13.5 8.5c-1.5-.5-3-.5-3 1s1.5 1.5 3 2 3 1 3 3-1.5 2-3 1.5" stroke="#635BFF" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="12" y1="7" x2="12" y2="9" stroke="#635BFF" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="12" y1="15" x2="12" y2="17" stroke="#635BFF" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// ── Forms ────────────────────────────────────────────────────────────────────

const Typeform: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" opacity={0.1}/>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity={0.5}/>
    <line x1="7" y1="7" x2="17" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.5}/>
    <circle cx="8" cy="12" r="1.5" fill="currentColor" opacity={0.5}/>
    <line x1="11" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.5}/>
    <circle cx="8" cy="17" r="1.5" fill="currentColor" opacity={0.5}/>
    <line x1="11" y1="17" x2="15" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.5}/>
  </svg>
)

// ── CMS ──────────────────────────────────────────────────────────────────────

const WordPress: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#21759B"/>
    <path d="M3.5 12a8.5 8.5 0 004.6 7.56l-3.9-10.7A8.44 8.44 0 003.5 12zm14.27-1.26c0-.94-.38-1.63-.66-2.1a3.64 3.64 0 00-.58-.93c-.2-.26-.38-.47-.38-.72 0-.28.22-.54.52-.54h.04a8.5 8.5 0 00-12.82-.44h.56c.94 0 2.38-.12 2.38-.12.48-.03.54.68.06.73 0 0-.48.06-1.02.09l3.26 9.69 1.96-5.88-1.4-3.81c-.48-.03-.93-.09-.93-.09-.48-.03-.43-.76.06-.73 0 0 1.47.12 2.35.12.94 0 2.38-.12 2.38-.12.48-.03.54.68.06.73 0 0-.48.06-1.02.09l3.24 9.62.5-1.82c.32-.86.5-1.54.5-2.12z" fill="white" opacity={0.9}/>
    <path d="M12.2 13l-2.7 7.82a8.52 8.52 0 005.24-.14l-.04-.08L12.2 13zm7.4-5.1c.04.27.06.57.06.9 0 .88-.17 1.88-.66 3.12l-2.7 7.82A8.48 8.48 0 0020.5 12c0-1.46-.44-2.82-1.18-3.96l.28-.14z" fill="white" opacity={0.9}/>
  </svg>
)

// ── Analytics ────────────────────────────────────────────────────────────────

const GoogleAnalytics: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="15" y="4" width="4" height="16" rx="2" fill="#F9AB00"/>
    <rect x="10" y="9" width="4" height="11" rx="2" fill="#E37400"/>
    <circle cx="7" cy="18" r="2" fill="#E37400"/>
  </svg>
)

// ── Email ────────────────────────────────────────────────────────────────────

const Mailchimp: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#FFE01B" opacity={0.2}/>
    <circle cx="12" cy="12" r="10" stroke="#FFE01B" strokeWidth="1.5" fill="none"/>
    <path d="M8 16c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#241C15" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <circle cx="9.5" cy="10" r="1.2" fill="#241C15"/>
    <circle cx="14.5" cy="10" r="1.2" fill="#241C15"/>
    <path d="M7 7c1-1.5 2.5-2 5-2s4 .5 5 2" stroke="#241C15" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  </svg>
)

// ── Close CRM ────────────────────────────────────────────────────────────────

const CloseCRM: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#1C2B3A"/>
    <text x="12" y="16.5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="700" fontFamily="Arial, sans-serif">C</text>
  </svg>
)

// ── ClickUp ──────────────────────────────────────────────────────────────────

const ClickUp: React.FC = () => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4.5 14.4l3.1-2.4c1.4 1.8 3 2.7 4.5 2.7s3.1-.9 4.5-2.7l3.1 2.4C17.5 17.3 15 18.7 12.1 18.7s-5.4-1.4-7.6-4.3z" fill="#7B68EE"/>
    <path d="M4.5 10.5l3.1-2.4c1.4 1.8 3 2.7 4.5 2.7s3.1-.9 4.5-2.7l3.1 2.4C17.5 13.4 15 14.8 12.1 14.8s-5.4-1.4-7.6-4.3z" fill="#49CCF9"/>
  </svg>
)

// ── Logo Registry ────────────────────────────────────────────────────────────

export interface ToolLogo {
  id: string
  name: string
  category: string
  component: React.FC
  color: string
}

export const TOOL_LOGOS: Record<string, ToolLogo> = {
  // Google
  'logo-google-drive':     { id: 'logo-google-drive',     name: 'Google Drive',     category: 'Google',        component: GoogleDrive,     color: '#4285F4' },
  'logo-gmail':            { id: 'logo-gmail',            name: 'Gmail',            category: 'Google',        component: Gmail,           color: '#EA4335' },
  'logo-google-sheets':    { id: 'logo-google-sheets',    name: 'Google Sheets',    category: 'Google',        component: GoogleSheets,    color: '#0F9D58' },
  'logo-google-docs':      { id: 'logo-google-docs',      name: 'Google Docs',      category: 'Google',        component: GoogleDocs,      color: '#4285F4' },
  'logo-google-calendar':  { id: 'logo-google-calendar',  name: 'Google Calendar',  category: 'Google',        component: GoogleCalendar,  color: '#4285F4' },

  // Communication
  'logo-slack':            { id: 'logo-slack',            name: 'Slack',            category: 'Communication', component: Slack,           color: '#4A154B' },
  'logo-whatsapp':         { id: 'logo-whatsapp',         name: 'WhatsApp',         category: 'Communication', component: WhatsApp,        color: '#25D366' },
  'logo-telegram':         { id: 'logo-telegram',         name: 'Telegram',         category: 'Communication', component: Telegram,        color: '#26A5E4' },
  'logo-teams':            { id: 'logo-teams',            name: 'Microsoft Teams',  category: 'Communication', component: MicrosoftTeams,  color: '#5B5FC7' },

  // CRM
  'logo-hubspot':          { id: 'logo-hubspot',          name: 'HubSpot',          category: 'CRM',           component: HubSpot,         color: '#FF7A59' },
  'logo-salesforce':       { id: 'logo-salesforce',       name: 'Salesforce',       category: 'CRM',           component: Salesforce,      color: '#00A1E0' },
  'logo-pipedrive':        { id: 'logo-pipedrive',        name: 'Pipedrive',        category: 'CRM',           component: Pipedrive,       color: '#017737' },
  'logo-close':            { id: 'logo-close',            name: 'Close CRM',       category: 'CRM',           component: CloseCRM,        color: '#1C2B3A' },

  // Project Management
  'logo-clickup':          { id: 'logo-clickup',          name: 'ClickUp',          category: 'PM',            component: ClickUp,         color: '#7B68EE' },

  // Automation
  'logo-make':             { id: 'logo-make',             name: 'Make',             category: 'Automation',    component: Make,            color: '#6D00CC' },
  'logo-n8n':              { id: 'logo-n8n',              name: 'n8n',              category: 'Automation',    component: N8n,             color: '#EA4B71' },
  'logo-zapier':           { id: 'logo-zapier',           name: 'Zapier',           category: 'Automation',    component: Zapier,          color: '#FF4A00' },

  // AI
  'logo-openai':           { id: 'logo-openai',           name: 'OpenAI',           category: 'AI',            component: OpenAI,          color: '#10A37F' },
  'logo-claude':           { id: 'logo-claude',           name: 'Claude',           category: 'AI',            component: Claude,          color: '#D97706' },

  // Productivity
  'logo-notion':           { id: 'logo-notion',           name: 'Notion',           category: 'Productivity',  component: Notion,          color: '#000000' },
  'logo-airtable':         { id: 'logo-airtable',         name: 'Airtable',         category: 'Productivity',  component: Airtable,        color: '#18BFFF' },

  // Social
  'logo-linkedin':         { id: 'logo-linkedin',         name: 'LinkedIn',         category: 'Social',        component: LinkedIn,        color: '#0A66C2' },
  'logo-meta':             { id: 'logo-meta',             name: 'Meta',             category: 'Social',        component: Meta,            color: '#0081FB' },
  'logo-tiktok':           { id: 'logo-tiktok',           name: 'TikTok',           category: 'Social',        component: TikTok,          color: '#000000' },
  'logo-instagram':        { id: 'logo-instagram',        name: 'Instagram',        category: 'Social',        component: Instagram,       color: '#E4405F' },
  'logo-youtube':          { id: 'logo-youtube',          name: 'YouTube',          category: 'Social',        component: YouTube,         color: '#FF0000' },

  // Dev
  'logo-github':           { id: 'logo-github',           name: 'GitHub',           category: 'Dev',           component: GitHub,          color: '#333333' },
  'logo-jira':             { id: 'logo-jira',             name: 'Jira',             category: 'Dev',           component: Jira,            color: '#2684FF' },

  // Payment
  'logo-stripe':           { id: 'logo-stripe',           name: 'Stripe',           category: 'Payment',       component: Stripe,          color: '#635BFF' },

  // Booking
  'logo-calendly':         { id: 'logo-calendly',         name: 'Calendly',         category: 'Booking',       component: Calendly,        color: '#006BFF' },

  // Forms
  'logo-typeform':         { id: 'logo-typeform',         name: 'Typeform',         category: 'Forms',         component: Typeform,        color: '#262627' },

  // CMS
  'logo-wordpress':        { id: 'logo-wordpress',        name: 'WordPress',        category: 'CMS',           component: WordPress,       color: '#21759B' },

  // Analytics
  'logo-google-analytics': { id: 'logo-google-analytics', name: 'Google Analytics', category: 'Analytics',     component: GoogleAnalytics, color: '#F9AB00' },

  // Ads
  'logo-google-ads':       { id: 'logo-google-ads',       name: 'Google Ads',       category: 'Ads',           component: GoogleAds,       color: '#4285F4' },

  // Email
  'logo-mailchimp':        { id: 'logo-mailchimp',        name: 'Mailchimp',        category: 'Email',         component: Mailchimp,       color: '#FFE01B' },
}

// ── Utility functions ────────────────────────────────────────────────────────

export function isToolLogo(icon: string): boolean {
  return icon.startsWith('logo-')
}

export function getToolLogo(icon: string): ToolLogo | undefined {
  return TOOL_LOGOS[icon]
}

export function getToolLogosByCategory(): Record<string, ToolLogo[]> {
  const grouped: Record<string, ToolLogo[]> = {}
  for (const logo of Object.values(TOOL_LOGOS)) {
    const existing = grouped[logo.category]
    if (existing) {
      existing.push(logo)
    } else {
      grouped[logo.category] = [logo]
    }
  }
  return grouped
}

/**
 * Renders the appropriate icon for a canvas node.
 *
 * Priority order:
 * 1. Custom `logoUrl` (external image)
 * 2. `logo-*` prefix (inline SVG from TOOL_LOGOS)
 * 3. `fallbackIcon` (Lucide icon or any React node)
 */
export function renderNodeIcon(
  icon: string,
  logoUrl?: string,
  fallbackIcon?: React.ReactNode,
  iconSize?: number,
): React.ReactNode {
  const size = iconSize ?? 20

  // Priority 1: custom logo URL
  if (logoUrl) {
    return React.createElement('img', {
      src: logoUrl,
      alt: icon,
      width: size,
      height: size,
      style: { objectFit: 'contain' as const },
      draggable: false,
    })
  }

  // Priority 2: built-in tool logo
  const toolLogo = TOOL_LOGOS[icon]
  if (toolLogo) {
    return React.createElement(toolLogo.component)
  }

  // Priority 3: fallback (typically a Lucide icon)
  if (fallbackIcon) {
    return fallbackIcon
  }

  return null
}
