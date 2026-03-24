export type Language = 'de' | 'en'

const translations: Record<string, Record<Language, string>> = {
  // Sidebar
  'sidebar.overview': { de: 'Übersicht', en: 'Overview' },
  'sidebar.clients': { de: 'Kunden', en: 'Clients' },
  'sidebar.settings': { de: 'Einstellungen', en: 'Settings' },
  'sidebar.allClients': { de: 'Alle Kunden', en: 'All Clients' },
  'sidebar.newClient': { de: 'Neuer Kunde', en: 'New Client' },
  'sidebar.brand': { de: 'Kunden Hub', en: 'Client Hub' },

  // Dashboard
  'dashboard.title': { de: 'Übersicht', en: 'Overview' },
  'dashboard.activeClients': { de: 'Aktive Kunden', en: 'Active Clients' },
  'dashboard.avgLeads': { de: 'Ø Leads/Kunde', en: 'Avg Leads/Client' },
  'dashboard.avgCpl': { de: 'Ø CPL', en: 'Avg CPL' },
  'dashboard.pendingApprovals': { de: 'Offene Freigaben', en: 'Pending Approvals' },
  'dashboard.urgentAlerts': { de: 'Dringende Meldungen', en: 'Urgent Alerts' },
  'dashboard.openApprovals': { de: 'Offene Freigaben', en: 'Open Approvals' },
  'dashboard.clientTable': { de: 'Kunden', en: 'Clients' },
  'dashboard.noClients': { de: 'Noch keine Kunden angelegt', en: 'No clients yet' },
  'dashboard.noClientsDesc': { de: 'Lege deinen ersten Kunden an, um loszulegen.', en: 'Create your first client to get started.' },
  'dashboard.leadsOverTime': { de: 'Leads über Zeit', en: 'Leads Over Time' },
  'dashboard.spendPerWeek': { de: 'Spend pro Woche', en: 'Spend Per Week' },

  // Clients
  'clients.title': { de: 'Kunden', en: 'Clients' },
  'clients.newClient': { de: 'Neuer Kunde', en: 'New Client' },
  'clients.search': { de: 'Kunde suchen...', en: 'Search clients...' },
  'clients.allStatuses': { de: 'Alle Status', en: 'All Statuses' },
  'clients.noResults': { de: 'Keine Kunden gefunden', en: 'No clients found' },

  // Client Detail
  'client.back': { de: 'Zurück', en: 'Back' },
  'client.notFound': { de: 'Kunde nicht gefunden', en: 'Client not found' },
  'client.pipeline': { de: 'Pipeline', en: 'Pipeline' },
  'client.deliverables': { de: 'Inhalte', en: 'Deliverables' },
  'client.performance': { de: 'Performance', en: 'Performance' },
  'client.connections': { de: 'Verbindungen', en: 'Connections' },
  'client.timeline': { de: 'Zeitstrahl', en: 'Timeline' },

  // Client Status
  'status.qualifying': { de: 'Qualifizierung', en: 'Qualifying' },
  'status.onboarding': { de: 'Onboarding', en: 'Onboarding' },
  'status.strategy': { de: 'Strategie', en: 'Strategy' },
  'status.copy': { de: 'Texte', en: 'Copy' },
  'status.funnel': { de: 'Funnel', en: 'Funnel' },
  'status.campaigns': { de: 'Kampagnen', en: 'Campaigns' },
  'status.review': { de: 'Review', en: 'Review' },
  'status.live': { de: 'Live', en: 'Live' },
  'status.paused': { de: 'Pausiert', en: 'Paused' },
  'status.churned': { de: 'Beendet', en: 'Churned' },

  // Deliverable Status
  'delStatus.generating': { de: 'Wird generiert...', en: 'Generating...' },
  'delStatus.draft': { de: 'Entwurf', en: 'Draft' },
  'delStatus.in_review': { de: 'In Prüfung', en: 'In Review' },
  'delStatus.approved': { de: 'Freigegeben', en: 'Approved' },
  'delStatus.live': { de: 'Live', en: 'Live' },
  'delStatus.rejected': { de: 'Abgelehnt', en: 'Rejected' },
  'delStatus.manually_edited': { de: 'Manuell bearbeitet', en: 'Manually Edited' },
  'delStatus.outdated': { de: 'Veraltet', en: 'Outdated' },
  'delStatus.blocked': { de: 'Blockiert', en: 'Blocked' },

  // Phases
  'phase.strategy': { de: 'Strategie', en: 'Strategy' },
  'phase.copy': { de: 'Texte', en: 'Copy' },
  'phase.funnel': { de: 'Funnel', en: 'Funnel' },
  'phase.campaigns': { de: 'Kampagnen', en: 'Campaigns' },

  // Actions
  'action.view': { de: 'Ansehen', en: 'View' },
  'action.edit': { de: 'Bearbeiten', en: 'Edit' },
  'action.approve': { de: 'Freigeben', en: 'Approve' },
  'action.reject': { de: 'Ablehnen', en: 'Reject' },
  'action.submitReview': { de: 'Zur Freigabe', en: 'Submit for Review' },
  'action.save': { de: 'Speichern', en: 'Save' },
  'action.reset': { de: 'Zurücksetzen', en: 'Reset' },
  'action.cancel': { de: 'Abbrechen', en: 'Cancel' },
  'action.create': { de: 'Anlegen', en: 'Create' },
  'action.connect': { de: 'Verbinden', en: 'Connect' },
  'action.disconnect': { de: 'Trennen', en: 'Disconnect' },
  'action.open': { de: 'Öffnen', en: 'Open' },
  'action.done': { de: 'Erledigt', en: 'Done' },
  'action.approveAll': { de: 'Alle freigeben', en: 'Approve All' },
  'action.approveAllDrafts': { de: 'Alle Entwürfe freigeben', en: 'Approve All Drafts' },
  'action.resetPhase': { de: 'Phase zurücksetzen', en: 'Reset Phase' },
  'action.requestChanges': { de: 'Änderungen anfordern', en: 'Request Changes' },

  // Deliverable titles
  'del.zielgruppen_avatar': { de: 'Zielgruppen-Avatar', en: 'Target Audience Avatar' },
  'del.arbeitgeber_avatar': { de: 'Arbeitgeber-Avatar', en: 'Employer Avatar' },
  'del.messaging_matrix': { de: 'Messaging-Matrix', en: 'Messaging Matrix' },
  'del.creative_briefing': { de: 'Creative Briefing', en: 'Creative Briefing' },
  'del.marken_richtlinien': { de: 'Marken-Richtlinien', en: 'Brand Guidelines' },
  'del.lp_text': { de: 'Landingpage-Texte', en: 'Landing Page Copy' },
  'del.form_text': { de: 'Formularseite-Texte', en: 'Form Page Copy' },
  'del.danke_text': { de: 'Dankeseite-Texte', en: 'Thank You Page Copy' },
  'del.anzeigen_haupt': { de: 'Anzeigentexte Hauptkampagne', en: 'Main Campaign Ad Copy' },
  'del.anzeigen_retargeting': { de: 'Anzeigentexte Retargeting', en: 'Retargeting Ad Copy' },
  'del.anzeigen_warmup': { de: 'Anzeigentexte Warmup', en: 'Warmup Ad Copy' },
  'del.videoskript': { de: 'Videoskript', en: 'Video Script' },
  'del.landing_page': { de: 'Landingpage', en: 'Landing Page' },
  'del.formular_page': { de: 'Formularseite', en: 'Form Page' },
  'del.danke_page': { de: 'Dankeseite', en: 'Thank You Page' },
  'del.initial_campaign': { de: 'Initial-Kampagne', en: 'Initial Campaign' },
  'del.retargeting_campaign': { de: 'Retargeting-Kampagne', en: 'Retargeting Campaign' },
  'del.warmup_campaign': { de: 'Warmup-Kampagne', en: 'Warmup Campaign' },

  // Editor
  'editor.title': { de: 'Bearbeiten', en: 'Edit' },
  'editor.preview': { de: 'Vorschau', en: 'Preview' },
  'editor.saved': { de: 'Gespeichert', en: 'Saved' },
  'editor.submitted': { de: 'Zur Prüfung eingereicht', en: 'Submitted for Review' },
  'editor.version': { de: 'Version', en: 'Version' },
  'editor.versionHistory': { de: 'Versionshistorie', en: 'Version History' },
  'editor.compliance': { de: 'Compliance', en: 'Compliance' },
  'editor.compliancePassed': { de: 'Bestanden', en: 'Passed' },
  'editor.complianceFailed': { de: 'Fehlgeschlagen', en: 'Failed' },
  'editor.compliancePending': { de: 'Ausstehend', en: 'Pending' },
  'editor.editSection': { de: 'Bearbeiten', en: 'Edit' },
  'editor.blocked': { de: 'Dieses Dokument ist blockiert und kann nicht bearbeitet werden.', en: 'This deliverable is blocked and cannot be edited.' },
  'editor.primaryText': { de: 'Primärtext', en: 'Primary Text' },
  'editor.primaryTextPlaceholder': { de: 'Haupttext der Anzeige...', en: 'Main ad text...' },
  'editor.headline': { de: 'Überschrift', en: 'Headline' },
  'editor.headlinePlaceholder': { de: 'Anzeigen-Überschrift', en: 'Ad headline' },
  'editor.description': { de: 'Beschreibung', en: 'Description' },
  'editor.descriptionPlaceholder': { de: 'Kurze Beschreibung', en: 'Short description' },
  'editor.ctaButton': { de: 'CTA-Button', en: 'CTA Button' },
  'editor.targetUrl': { de: 'Ziel-URL', en: 'Target URL' },
  'editor.image': { de: 'Bild', en: 'Image' },
  'editor.imageUploadHint': { de: 'Bild auswählen oder hochladen', en: 'Select or upload image' },
  'editor.docTitle': { de: 'Titel', en: 'Title' },
  'editor.docTitlePlaceholder': { de: 'Dokumenttitel', en: 'Document title' },
  'editor.sectionHeading': { de: 'Abschnitt-Überschrift', en: 'Section Heading' },
  'editor.sectionHeadingPlaceholder': { de: 'Überschrift...', en: 'Heading...' },
  'editor.sectionContent': { de: 'Inhalt', en: 'Content' },
  'editor.sectionContentPlaceholder': { de: 'Abschnitt-Inhalt...', en: 'Section content...' },
  'editor.addSection': { de: 'Abschnitt hinzufügen', en: 'Add Section' },
  'editor.campaignName': { de: 'Kampagnenname', en: 'Campaign Name' },
  'editor.campaignNamePlaceholder': { de: 'Name der Kampagne', en: 'Campaign name' },
  'editor.budgetPerDay': { de: 'Budget/Tag (\u20AC)', en: 'Budget/Day (\u20AC)' },
  'editor.audience': { de: 'Zielgruppe', en: 'Target Audience' },
  'editor.audiencePlaceholder': { de: 'Zielgruppe beschreiben...', en: 'Describe target audience...' },
  'editor.placement': { de: 'Placement', en: 'Placement' },

  // Connections
  'conn.summary': { de: '{connected}/{total} Services verbunden', en: '{connected}/{total} Services connected' },
  'conn.connectedSince': { de: 'Verbunden seit', en: 'Connected since' },
  'conn.notRequired': { de: 'Optional', en: 'Optional' },
  'conn.errorExpired': { de: 'Token abgelaufen — Re-Autorisierung nötig', en: 'Token expired — re-authorization needed' },

  // Timeline
  'timeline.all': { de: 'Alle', en: 'All' },
  'timeline.approvals': { de: 'Freigaben', en: 'Approvals' },
  'timeline.alerts': { de: 'Meldungen', en: 'Alerts' },
  'timeline.system': { de: 'System', en: 'System' },

  // Settings
  'settings.title': { de: 'Einstellungen', en: 'Settings' },
  'settings.profile': { de: 'Profil', en: 'Profile' },
  'settings.team': { de: 'Team', en: 'Team' },
  'settings.notifications': { de: 'Benachrichtigungen', en: 'Notifications' },
  'settings.integrations': { de: 'Integrationen', en: 'Integrations' },
  'settings.branding': { de: 'Branding', en: 'Branding' },
  'settings.danger': { de: 'Gefahrenzone', en: 'Danger Zone' },
  'settings.slackAlerts': { de: 'Slack-Benachrichtigungen', en: 'Slack Notifications' },
  'settings.emailAlerts': { de: 'Email-Benachrichtigungen', en: 'Email Notifications' },
  'settings.zeroLeadAlert': { de: 'Alert bei 0 Leads > 48h', en: 'Alert on 0 Leads > 48h' },
  'settings.weeklyReport': { de: 'Wöchentlicher Report', en: 'Weekly Report' },
  'settings.agencyName': { de: 'Agenturname', en: 'Agency Name' },
  'settings.logo': { de: 'Logo', en: 'Logo' },
  'settings.invite': { de: 'Einladen', en: 'Invite' },
  'settings.deleteAll': { de: 'Alle Daten löschen', en: 'Delete All Data' },
  'settings.deleteConfirm': { de: 'Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden.', en: 'Are you sure? This action cannot be undone.' },

  // Dialogs
  'dialog.newClient': { de: 'Neuer Kunde', en: 'New Client' },
  'dialog.companyName': { de: 'Firmenname', en: 'Company Name' },
  'dialog.contactPerson': { de: 'Ansprechpartner', en: 'Contact Person' },
  'dialog.email': { de: 'E-Mail', en: 'Email' },
  'dialog.phone': { de: 'Telefon', en: 'Phone' },
  'dialog.industry': { de: 'Branche', en: 'Industry' },
  'dialog.accountManager': { de: 'Account Manager', en: 'Account Manager' },
  'dialog.rejectTitle': { de: 'Dokument ablehnen', en: 'Reject Deliverable' },
  'dialog.commentRequired': { de: 'Kommentar (min. 10 Zeichen)', en: 'Comment (min. 10 characters)' },
  'dialog.confirmTitle': { de: 'Bist du sicher?', en: 'Are you sure?' },
  'dialog.confirmApproveAll': { de: '{count} Dokumente werden freigegeben. Fortfahren?', en: '{count} deliverables will be approved. Continue?' },
  'dialog.confirmApprove': { de: 'Wirklich freigeben?', en: 'Really approve?' },
  'dialog.confirmReject': { de: 'Wirklich ablehnen?', en: 'Really reject?' },
  'dialog.confirmSubmit': { de: 'Zur Prüfung einreichen?', en: 'Submit for review?' },
  'dialog.yesApprove': { de: 'Ja, freigeben', en: 'Yes, approve' },
  'dialog.yesReject': { de: 'Ja, ablehnen', en: 'Yes, reject' },
  'dialog.yesSubmit': { de: 'Ja, einreichen', en: 'Yes, submit' },

  // Table headers
  'table.client': { de: 'Kunde', en: 'Client' },
  'table.phase': { de: 'Phase', en: 'Phase' },
  'table.leads': { de: 'Leads', en: 'Leads' },
  'table.cpl': { de: 'CPL', en: 'CPL' },
  'table.spend': { de: 'Spend', en: 'Spend' },
  'table.status': { de: 'Status', en: 'Status' },
  'table.impressions': { de: 'Impressionen', en: 'Impressions' },
  'table.clicks': { de: 'Klicks', en: 'Clicks' },
  'table.ctr': { de: 'CTR', en: 'CTR' },

  // Industries
  'industry.healthcare': { de: 'Pflege/Gesundheit', en: 'Healthcare' },
  'industry.it': { de: 'IT/Software', en: 'IT/Software' },
  'industry.crafts': { de: 'Handwerk', en: 'Crafts' },
  'industry.marketing': { de: 'Marketing/Agentur', en: 'Marketing/Agency' },
  'industry.coaching': { de: 'Coaching/Beratung', en: 'Coaching/Consulting' },
  'industry.solar': { de: 'Solar/Energie', en: 'Solar/Energy' },
  'industry.recruiting': { de: 'Recruiting/HR', en: 'Recruiting/HR' },
  'industry.other': { de: 'Sonstige', en: 'Other' },

  // Misc
  'misc.waitingFor': { de: 'Wartet auf', en: 'Waiting for' },
  'misc.noPerformanceData': { de: 'Noch keine Performance-Daten', en: 'No performance data yet' },
  'misc.sponsored': { de: 'Gesponsert', en: 'Sponsored' },
  'misc.applyNow': { de: 'Jetzt bewerben', en: 'Apply Now' },
  'misc.like': { de: 'Gefällt mir', en: 'Like' },
  'misc.comment': { de: 'Kommentieren', en: 'Comment' },
  'misc.share': { de: 'Teilen', en: 'Share' },
  'misc.language': { de: 'Sprache', en: 'Language' },
  'misc.german': { de: 'Deutsch', en: 'German' },
  'misc.english': { de: 'Englisch', en: 'English' },
  'misc.selectDeliverable': { de: 'Dokument auswählen', en: 'Select a deliverable' },
  'misc.selectDeliverableDesc': { de: 'Wähle ein Dokument aus der Liste, um die Vorschau zu sehen.', en: 'Select a deliverable from the list to see its preview.' },
  'misc.servicesConnected': { de: '{connected}/{total} Services verbunden', en: '{connected}/{total} Services connected' },
  'misc.confirmResetPhase': { de: 'Phase "{phase}" wirklich zurücksetzen? Alle Dokumente werden auf Entwurf gesetzt.', en: 'Really reset phase "{phase}"? All deliverables will be set to draft.' },
  'misc.open': { de: 'Offene', en: 'Open' },
  'misc.ready': { de: 'Bereit', en: 'Ready' },
  'misc.blocked': { de: 'Blockiert', en: 'Blocked' },
  'misc.campaignDetails': { de: 'Kampagnen-Details', en: 'Campaign Details' },
  'misc.campaignType': { de: 'Kampagnentyp', en: 'Campaign Type' },
  'misc.campaignContent': { de: 'Konfiguration wird aus Strategie-Dokumenten generiert.', en: 'Configuration is generated from strategy documents.' },
  'misc.noVersionHistory': { de: 'Erste Version', en: 'First version' },
  'misc.current': { de: 'Aktuell', en: 'Current' },
  'misc.initial': { de: 'Erstellt', en: 'Created' },
  'misc.leadsOverTime': { de: 'Leads über Zeit', en: 'Leads Over Time' },
  'misc.spendPerWeek': { de: 'Spend pro Woche', en: 'Spend Per Week' },

  // Onboarding Wizard
  'wizard.title': { de: 'Neuen Kunden anlegen', en: 'Create New Client' },
  'wizard.step': { de: 'Schritt {current} von {total}', en: 'Step {current} of {total}' },
  'wizard.firmendaten': { de: 'Firmendaten', en: 'Company Data' },
  'wizard.step2Title': { de: 'Paket & Konditionen', en: 'Package & Terms' },
  'wizard.projektDetails': { de: 'Projekt-Details', en: 'Project Details' },
  'wizard.summary': { de: 'Zusammenfassung', en: 'Summary' },

  // Step 2: Paket & Konditionen
  'wizard.package': { de: 'Gebuchtes Paket', en: 'Booked Package' },
  'wizard.packagePlaceholder': { de: 'Paket auswählen...', en: 'Select package...' },
  'wizard.price': { de: 'Monatlicher Preis', en: 'Monthly Price' },
  'wizard.payment': { de: 'Zahlungsweise', en: 'Payment Frequency' },
  'wizard.paymentPlaceholder': { de: 'Zahlungsweise auswählen...', en: 'Select payment frequency...' },
  'wizard.paymentMonthly': { de: 'Monatlich', en: 'Monthly' },
  'wizard.paymentQuarterly': { de: 'Quartalsweise', en: 'Quarterly' },
  'wizard.paymentBiannual': { de: 'Halbjährlich', en: 'Biannually' },
  'wizard.paymentYearly': { de: 'Jährlich', en: 'Yearly' },
  'wizard.duration': { de: 'Vertragslaufzeit', en: 'Contract Duration' },
  'wizard.durationPlaceholder': { de: 'Laufzeit auswählen...', en: 'Select duration...' },
  'wizard.duration3': { de: '3 Monate', en: '3 Months' },
  'wizard.duration6': { de: '6 Monate', en: '6 Months' },
  'wizard.duration12': { de: '12 Monate', en: '12 Months' },
  'wizard.durationUnlimited': { de: 'Unbefristet', en: 'Unlimited' },
  'wizard.startDate': { de: 'Startdatum', en: 'Start Date' },

  // Step 3: Projekt-Details
  'wizard.branche': { de: 'Branche', en: 'Industry' },
  'wizard.branchePlaceholder': { de: 'Branche auswählen...', en: 'Select industry...' },
  'wizard.zielgruppe': { de: 'Zielgruppe', en: 'Target Audience' },
  'wizard.zielgruppePlaceholder': { de: 'z.B. Pflegekräfte 25-45 in NRW', en: 'e.g. Nurses 25-45 in NRW' },
  'wizard.managerPlaceholder': { de: 'Manager auswählen...', en: 'Select manager...' },
  'wizard.projectNotes': { de: 'Notizen zum Projekt', en: 'Project Notes' },
  'wizard.projectNotesPlaceholder': { de: 'Optionale Notizen zum Projekt...', en: 'Optional project notes...' },

  // Navigation
  'wizard.back': { de: 'Zurück', en: 'Back' },
  'wizard.next': { de: 'Weiter', en: 'Next' },
  'wizard.create': { de: 'Anlegen', en: 'Create' },
  'wizard.createClient': { de: 'Kunde anlegen', en: 'Create Client' },

  // Legacy keys kept for compatibility
  'wizard.zugaenge': { de: 'Zugänge verbinden', en: 'Connect Accounts' },
  'wizard.kickoff': { de: 'Kickoff planen', en: 'Plan Kickoff' },
  'wizard.metaAdAccount': { de: 'Meta Ad Account ID', en: 'Meta Ad Account ID' },
  'wizard.googleDrive': { de: 'Google Drive', en: 'Google Drive' },
  'wizard.driveAutoCreate': { de: 'Ordner automatisch erstellen', en: 'Create folder automatically' },
  'wizard.slackChannel': { de: 'Slack Channel', en: 'Slack Channel' },
  'wizard.clickup': { de: 'ClickUp', en: 'ClickUp' },
  'wizard.clickupAutoCreate': { de: 'Projekt automatisch erstellen', en: 'Create project automatically' },
  'wizard.closeCrm': { de: 'Close CRM', en: 'Close CRM' },
  'wizard.closeAutoCreate': { de: 'Lead automatisch anlegen', en: 'Create lead automatically' },
  'wizard.datum': { de: 'Datum', en: 'Date' },
  'wizard.uhrzeit': { de: 'Uhrzeit', en: 'Time' },
  'wizard.notizen': { de: 'Notizen zum Kickoff', en: 'Kickoff Notes' },
  'wizard.budget': { de: 'Monatliches Budget', en: 'Monthly Budget' },
  'wizard.serviceArt': { de: 'Service-Art', en: 'Service Type' },
  'wizard.service.recruiting': { de: 'Recruiting', en: 'Recruiting' },
  'wizard.service.marketing': { de: 'Marketing', en: 'Marketing' },
  'wizard.service.webdesign': { de: 'Webdesign', en: 'Web Design' },
  'wizard.service.fullService': { de: 'Full-Service', en: 'Full Service' },

  // Tasks Tab
  'tasks.title': { de: 'Aufgaben', en: 'Tasks' },
  'tasks.all': { de: 'Alle', en: 'All' },
  'tasks.open': { de: 'Offen', en: 'Open' },
  'tasks.done': { de: 'Erledigt', en: 'Done' },
  'tasks.newTask': { de: 'Neue Aufgabe', en: 'New Task' },
  'tasks.taskTitle': { de: 'Aufgabe', en: 'Task' },
  'tasks.assignee': { de: 'Zuständig', en: 'Assignee' },
  'tasks.dueDate': { de: 'Fällig am', en: 'Due Date' },
  'tasks.priority': { de: 'Priorität', en: 'Priority' },
  'tasks.priority.urgent': { de: 'Dringend', en: 'Urgent' },
  'tasks.priority.high': { de: 'Hoch', en: 'High' },
  'tasks.priority.normal': { de: 'Normal', en: 'Normal' },
  'tasks.priority.low': { de: 'Niedrig', en: 'Low' },
  'tasks.noTasks': { de: 'Keine Aufgaben vorhanden', en: 'No tasks available' },
  'tasks.overdue': { de: 'Überfällig', en: 'Overdue' },

  // Notes Tab
  'notes.title': { de: 'Notizen', en: 'Notes' },
  'notes.pinned': { de: 'Angepinnt', en: 'Pinned' },
  'notes.allNotes': { de: 'Alle Notizen', en: 'All Notes' },
  'notes.newNote': { de: 'Neue Notiz schreiben...', en: 'Write a new note...' },
  'notes.save': { de: 'Speichern', en: 'Save' },
  'notes.edit': { de: 'Bearbeiten', en: 'Edit' },
  'notes.delete': { de: 'Löschen', en: 'Delete' },
  'notes.noNotes': { de: 'Noch keine Notizen', en: 'No notes yet' },
  'notes.pin': { de: 'Anpinnen', en: 'Pin' },
  'notes.unpin': { de: 'Lösen', en: 'Unpin' },

  // Calendar Tab
  'calendar.title': { de: 'Termine', en: 'Appointments' },
  'calendar.upcoming': { de: 'Anstehend', en: 'Upcoming' },
  'calendar.past': { de: 'Vergangen', en: 'Past' },
  'calendar.newEvent': { de: 'Neuer Termin', en: 'New Appointment' },
  'calendar.eventTitle': { de: 'Titel', en: 'Title' },
  'calendar.date': { de: 'Datum', en: 'Date' },
  'calendar.time': { de: 'Uhrzeit', en: 'Time' },
  'calendar.type': { de: 'Typ', en: 'Type' },
  'calendar.participants': { de: 'Teilnehmer', en: 'Participants' },
  'calendar.type.kickoff': { de: 'Kickoff', en: 'Kickoff' },
  'calendar.type.review': { de: 'Review', en: 'Review' },
  'calendar.type.launch': { de: 'Launch', en: 'Launch' },
  'calendar.type.strategy': { de: 'Strategie', en: 'Strategy' },
  'calendar.noEvents': { de: 'Keine Termine vorhanden', en: 'No appointments available' },

  // Client Detail extra tabs
  'client.tasks': { de: 'Aufgaben', en: 'Tasks' },
  'client.notes': { de: 'Notizen', en: 'Notes' },
  'client.calendar': { de: 'Termine', en: 'Appointments' },

  // Settings i18n fixes
  'settings.name': { de: 'Name', en: 'Name' },
  'settings.role': { de: 'Rolle', en: 'Role' },
  'settings.initials': { de: 'CD', en: 'CD' },
  'settings.comingSoon': { de: 'Kommt bald', en: 'Coming soon' },
  'settings.connected': { de: 'Verbunden', en: 'Connected' },
  'settings.notConnected': { de: 'Nicht verbunden', en: 'Not connected' },
  'settings.configure': { de: 'Konfigurieren', en: 'Configure' },
  'settings.uploadLogo': { de: 'Logo hochladen (PNG, JPG, SVG)', en: 'Upload logo (PNG, JPG, SVG)' },
  'settings.primaryColor': { de: 'Primärfarbe', en: 'Primary Color' },
  'settings.brandColor': { de: 'Brand-500', en: 'Brand-500' },
  'settings.dataDeleted': { de: 'Alle Daten wurden (simuliert) gelöscht.', en: 'All data has been (simulated) deleted.' },

  // Version History
  'version.generated': { de: 'KI generiert', en: 'AI Generated' },
  'version.manualEdit': { de: 'Manuell bearbeitet', en: 'Manually Edited' },
  'version.regenerated': { de: 'Neu generiert', en: 'Regenerated' },
  'version.createdByAi': { de: 'KI', en: 'AI' },
  'version.createdBySystem': { de: 'System', en: 'System' },
  'version.show': { de: 'Anzeigen', en: 'Show' },
  'version.hide': { de: 'Ausblenden', en: 'Hide' },
  'version.restore': { de: 'Wiederherstellen', en: 'Restore' },
  'version.confirmRestore': { de: 'Bestätigen', en: 'Confirm' },
  'version.showDiff': { de: 'Änderungen', en: 'Changes' },
  'version.hideDiff': { de: 'Diff ausblenden', en: 'Hide Diff' },
  'version.diffTitle': { de: 'Änderungen zur vorherigen Version', en: 'Changes from previous version' },

  // Comments
  'comment.title': { de: 'Kommentare', en: 'Comments' },
  'comment.placeholder': { de: 'Kommentar hinzufügen...', en: 'Add a comment...' },
  'comment.send': { de: 'Senden', en: 'Send' },

  // Regenerate
  'regenerate.button': { de: 'Neu generieren', en: 'Regenerate' },
  'regenerate.confirmTitle': { de: 'Neu generieren?', en: 'Regenerate?' },
  'regenerate.confirmText': { de: 'Dokument wird neu von der KI generiert. Aktuelle Änderungen gehen verloren. Fortfahren?', en: 'Deliverable will be regenerated by AI. Current changes will be lost. Continue?' },
  'regenerate.confirm': { de: 'Ja, neu generieren', en: 'Yes, regenerate' },
  'regenerate.feedbackPlaceholder': { de: 'Was soll anders sein? (optional)', en: 'What should be different? (optional)' },
  'regenerate.toast': { de: 'Neu generiert', en: 'Regenerated' },
  'regenerate.noContent': { de: 'Regenerierung abgeschlossen, aber kein Inhalt empfangen', en: 'Regeneration completed, but no content received' },

  // Delete client
  'delete.confirmTitle': { de: 'Kunde löschen?', en: 'Delete client?' },
  'delete.confirmText': { de: 'Kunde {{company}} wirklich löschen? Alle Daten werden entfernt.', en: 'Really delete client {{company}}? All data will be removed.' },
  'delete.confirm': { de: 'Ja, löschen', en: 'Yes, delete' },
  'toast.clientDeleted': { de: 'Kunde gelöscht', en: 'Client deleted' },
  'toast.deleteFailed': { de: 'Löschen fehlgeschlagen', en: 'Delete failed' },

  // Toast notifications
  'toast.saved': { de: 'Gespeichert', en: 'Saved' },
  'toast.saveFailed': { de: 'Speichern fehlgeschlagen', en: 'Save failed' },
  'toast.approved': { de: 'Freigegeben', en: 'Approved' },
  'toast.rejected': { de: 'Abgelehnt', en: 'Rejected' },
  'toast.submitted': { de: 'Zur Freigabe eingereicht', en: 'Submitted for review' },
  'toast.actionFailed': { de: 'Aktion fehlgeschlagen', en: 'Action failed' },
  'toast.regenerateFailed': { de: 'Neu-Generierung fehlgeschlagen', en: 'Regeneration failed' },
  'toast.restored': { de: 'Version wiederhergestellt', en: 'Version restored' },
  'toast.restoreFailed': { de: 'Wiederherstellung fehlgeschlagen', en: 'Restore failed' },
  'toast.changesRequested': { de: 'Änderungen angefordert', en: 'Changes requested' },
  'toast.bulkApproved': { de: 'Alle freigegeben', en: 'All approved' },
  'toast.adSaved': { de: 'Ad gespeichert', en: 'Ad saved' },
  'toast.adSavedMeta': { de: 'Änderungen wurden zu Meta gepusht', en: 'Changes pushed to Meta' },
  'toast.adSaveFailed': { de: 'Ad-Speichern fehlgeschlagen', en: 'Ad save failed' },

  // Actions
  'action.saveAndPush': { de: 'Speichern & zu Meta pushen', en: 'Save & push to Meta' },

  // Editor loading
  'editor.loading': { de: 'Inhalt wird geladen...', en: 'Loading content...' },
  'action.saving': { de: 'Speichern...', en: 'Saving...' },

  // AI Assistant
  'ai.title': { de: 'KI-Assistent', en: 'AI Assistant' },
  'ai.placeholder': { de: 'Frage stellen...', en: 'Ask a question...' },
  'ai.welcome': { de: 'Hallo! Ich bin dein KI-Assistent. Frag mich alles über deine Kunden, Deliverables oder Performance.', en: 'Hello! I am your AI assistant. Ask me anything about your clients, deliverables or performance.' },
  'ai.responseLeads': { de: 'Müller Pflege hat aktuell 42 Leads bei einem CPL von 67,79\u20AC. Die Performance ist stabil.', en: 'Müller Pflege currently has 42 leads at a CPL of \u20AC67.79. Performance is stable.' },
  'ai.responseWeber': { de: 'Weber IT Solutions ist in der Texte-Phase. 3 von 5 Strategie-Docs sind freigegeben. Das Creative Briefing wartet auf Prüfung.', en: 'Weber IT Solutions is in the copy phase. 3 of 5 strategy docs are approved. The creative briefing is waiting for review.' },
  'ai.responseSchmidt': { de: 'Schmidt Handwerk ist pausiert. Grund: Meta Ad Account eingeschränkt + keine Kundenreaktion seit 14 Tagen.', en: 'Schmidt Handwerk is paused. Reason: Meta Ad Account restricted + no client response for 14 days.' },
  'ai.responseApprovals': { de: 'Aktuell sind 5 Deliverables zur Freigabe offen: 3x bei Weber IT, 2x bei Schmidt Handwerk.', en: 'Currently 5 deliverables are pending approval: 3x at Weber IT, 2x at Schmidt Handwerk.' },
  'ai.responseDefault': { de: 'Ich habe das verstanden. Lass mich die relevanten Informationen zusammenstellen... Für detaillierte Analysen wende dich an das Dashboard.', en: 'I understand. Let me compile the relevant information... For detailed analyses, check the dashboard.' },

  // Report
  'report.create': { de: 'Report erstellen', en: 'Create Report' },
  'report.generating': { de: 'Report wird erstellt...', en: 'Generating report...' },
  'report.ready': { de: 'Report fertig!', en: 'Report ready!' },
  'report.download': { de: 'Report öffnen', en: 'Open Report' },
  'report.title': { de: 'Kundenreport', en: 'Client Report' },
  'report.contact': { de: 'Ansprechpartner', en: 'Contact' },
  'report.kpis': { de: 'Kennzahlen', en: 'KPIs' },
  'report.deliverables': { de: 'Dokument-Status', en: 'Deliverable Status' },
  'report.metric': { de: 'Kennzahl', en: 'Metric' },
  'report.count': { de: 'Anzahl', en: 'Count' },
  'report.approved': { de: 'Freigegeben / Live', en: 'Approved / Live' },
  'report.inReview': { de: 'In Prüfung', en: 'In Review' },
  'report.blocked': { de: 'Blockiert', en: 'Blocked' },
  'report.total': { de: 'Gesamt', en: 'Total' },
  'report.timeline': { de: 'Letzte Aktivitäten', en: 'Recent Activity' },
  'report.noEvents': { de: 'Keine Aktivitäten vorhanden', en: 'No activities available' },
  'report.generatedAt': { de: 'Erstellt am', en: 'Generated at' },

  // Client Detail extra tabs (communication + files)
  'client.communication': { de: 'Kommunikation', en: 'Communication' },
  'client.files': { de: 'Dateien', en: 'Files' },

  // Communication Tab
  'comm.all': { de: 'Alle', en: 'All' },
  'comm.slack': { de: 'Slack', en: 'Slack' },
  'comm.email': { de: 'Email', en: 'Email' },
  'comm.calls': { de: 'Anrufe', en: 'Calls' },
  'comm.sendMessage': { de: 'Nachricht senden', en: 'Send Message' },
  'comm.channel': { de: 'Kanal', en: 'Channel' },
  'comm.message': { de: 'Nachricht', en: 'Message' },
  'comm.messagePlaceholder': { de: 'Nachricht eingeben...', en: 'Enter message...' },
  'comm.send': { de: 'Senden', en: 'Send' },
  'comm.noMessages': { de: 'Keine Nachrichten vorhanden', en: 'No messages available' },

  // Files Tab
  'files.root': { de: 'Dateien', en: 'Files' },
  'files.name': { de: 'Name', en: 'Name' },
  'files.size': { de: 'Größe', en: 'Size' },
  'files.modified': { de: 'Geändert', en: 'Modified' },
  'files.action': { de: 'Aktion', en: 'Action' },
  'files.upload': { de: 'Hochladen', en: 'Upload' },
  'files.uploadArea': { de: 'Dateien hierher ziehen oder klicken zum Hochladen', en: 'Drag files here or click to upload' },
  'files.empty': { de: 'Ordner ist leer', en: 'Folder is empty' },

  // Deliverable Selector
  'deliverables.selectLabel': { de: 'Dokument auswählen', en: 'Select deliverable' },
  'deliverables.progress': { de: '{done}/{total} freigegeben', en: '{done}/{total} approved' },

  // Placement labels
  'placement.feed': { de: 'Feed', en: 'Feed' },
  'placement.story': { de: 'Story', en: 'Story' },
  'placement.reel': { de: 'Reel', en: 'Reel' },

  // Variant labels
  'variant.xOfY': { de: 'Variante {x} von {y}', en: 'Variant {x} of {y}' },

  // Ad Preview misc
  'misc.learnMore': { de: 'Mehr erfahren', en: 'Learn More' },

  // Platform names (Ad Preview)
  'platform.facebook': { de: 'Facebook', en: 'Facebook' },
  'platform.instagram': { de: 'Instagram', en: 'Instagram' },
  'platform.google': { de: 'Google', en: 'Google' },
  'platform.linkedin': { de: 'LinkedIn', en: 'LinkedIn' },
  'platform.tiktok': { de: 'TikTok', en: 'TikTok' },
  'platform.igLikes': { de: 'Gefällt 128 Mal', en: '128 likes' },
  'platform.linkedinSponsored': { de: 'Gesponsert · Beworben', en: 'Sponsored · Promoted' },
  'platform.linkedinSend': { de: 'Senden', en: 'Send' },
  'platform.googleAd': { de: 'Anzeige', en: 'Ad' },
  'platform.googleDesc': { de: 'Beschreibung der Werbeanzeige. Klicke hier um mehr zu erfahren.', en: 'Ad description. Click here to learn more.' },
  'platform.googleDiscover': { de: 'Jetzt entdecken', en: 'Discover now' },

  // Pipeline Detail (Task 1)
  'pipeline.currentPhase': { de: 'Aktuelle Phase', en: 'Current Phase' },
  'pipeline.progress': { de: 'Fortschritt', en: 'Progress' },
  'pipeline.of': { de: 'von', en: 'of' },
  'pipeline.completed': { de: 'fertig', en: 'completed' },
  'pipeline.estimatedCompletion': { de: 'Geschätzte Fertigstellung', en: 'Estimated Completion' },
  'pipeline.responsible': { de: 'Verantwortlich', en: 'Responsible' },
  'pipeline.openTasks': { de: 'Offene Aufgaben', en: 'Open Tasks' },
  'pipeline.phaseOverview': { de: 'Phasen-Übersicht', en: 'Phase Overview' },
  'pipeline.done': { de: 'erledigt', en: 'done' },
  'pipeline.timeline': { de: 'Zeitleiste', en: 'Timeline' },
  'pipeline.completedSuffix': { de: 'abgeschlossen', en: 'completed' },
  'pipeline.inProgressSuffix': { de: 'in Arbeit', en: 'in progress' },
  'pipeline.planned': { de: 'geplant', en: 'planned' },

  // Pipeline Kanban (Task 2)
  'kanban.title': { de: 'Pipeline-Übersicht', en: 'Pipeline Overview' },

  // Team Capacity (Task 3)
  'team.title': { de: 'Team-Auslastung', en: 'Team Capacity' },
  'team.clients': { de: 'Kunden', en: 'Clients' },
  'team.openTasks': { de: 'offene Tasks', en: 'open tasks' },
  'team.noData': { de: 'Keine Teamdaten vorhanden', en: 'No team data available' },

  // Revenue Tracker (Task 4)
  'revenue.title': { de: 'Umsatz-Übersicht', en: 'Revenue Overview' },
  'revenue.month': { de: 'Monat', en: 'month' },
  'revenue.yearTotal': { de: 'Gesamt 2026', en: 'Total 2026' },
  'revenue.openInvoices': { de: 'Offene Rechnungen', en: 'Open Invoices' },

  // Activity Feed (Task 5)
  'activity.title': { de: 'Letzte Aktivitäten', en: 'Recent Activity' },
  'activity.justNow': { de: 'gerade eben', en: 'just now' },
  'activity.minutesAgo': { de: 'vor {n} Min', en: '{n} min ago' },
  'activity.hoursAgo': { de: 'vor {n} Std', en: '{n}h ago' },
  'activity.daysAgo': { de: 'vor {n} Tagen', en: '{n} days ago' },
  'activity.noEvents': { de: 'Keine Aktivitäten', en: 'No activities' },

  // Onboarding Animation (Task 6)
  'wizard.settingUp': { de: 'Kunde wird eingerichtet...', en: 'Setting up client...' },
  'wizard.setupCrm': { de: 'Close CRM Lead erstellt', en: 'Close CRM Lead created' },
  'wizard.setupDrive': { de: 'Google Drive Ordner erstellt', en: 'Google Drive folder created' },
  'wizard.setupSlack': { de: 'Slack Channel erstellt', en: 'Slack Channel created' },
  'wizard.setupClickup': { de: 'ClickUp Projekt erstellt', en: 'ClickUp project created' },
  'wizard.setupKickoff': { de: 'Kickoff-Termin erstellt', en: 'Kickoff appointment created' },
  'wizard.setupEmail': { de: 'Willkommens-Email gesendet', en: 'Welcome email sent' },
  'wizard.setupDone': { de: 'Alles bereit! Weiterleitung...', en: 'All set! Redirecting...' },
  'wizard.setupPartial': { de: 'Setup abgeschlossen (mit Fehlern). Weiterleitung...', en: 'Setup completed (with errors). Redirecting...' },
  'wizard.stepFailed': { de: 'Fehlgeschlagen', en: 'Failed' },
  'wizard.settingUp': { de: 'System wird eingerichtet...', en: 'Setting up system...' },
  'wizard.deleteClient': { de: 'Client löschen', en: 'Delete client' },
  'wizard.deleteConfirm': { de: 'Sind Sie sicher? Alle erstellten Ressourcen (CRM, Slack, ClickUp, Drive) werden gelöscht.', en: 'Are you sure? All created resources (CRM, Slack, ClickUp, Drive) will be deleted.' },
  'wizard.deleteSuccess': { de: 'Client und Ressourcen gelöscht', en: 'Client and resources deleted' },

  // Notifications (Task 7)
  'notification.mockLead': { de: 'Neuer Lead bei Müller Pflege!', en: 'New lead at Müller Pflege!' },
  'notification.mockLeadDesc': { de: 'Ein neuer Bewerber hat das Formular ausgefüllt.', en: 'A new applicant has filled out the form.' },

  // AI Suggestions (Task 8)
  'ai.sugTitle': { de: 'KI-Vorschläge', en: 'AI Suggestions' },
  'ai.sugDone': { de: 'Umgesetzt', en: 'Implemented' },
  'ai.sugIgnore': { de: 'Ignorieren', en: 'Ignore' },
  'ai.sugLater': { de: 'Später', en: 'Later' },
  'ai.sug1Client': { de: 'Weber IT', en: 'Weber IT' },
  'ai.sug1Title': { de: 'CPL steigt seit 3 Tagen', en: 'CPL rising for 3 days' },
  'ai.sug1Action': { de: 'Budget von RT auf Initial shiften', en: 'Shift budget from RT to Initial' },
  'ai.sug1Primary': { de: 'Umsetzen', en: 'Apply' },
  'ai.sug2Client': { de: 'Müller Pflege', en: 'Müller Pflege' },
  'ai.sug2Title': { de: 'Creative Fatigue erkannt', en: 'Creative Fatigue detected' },
  'ai.sug2Action': { de: 'Neue Ad-Varianten generieren', en: 'Generate new ad variants' },
  'ai.sug2Primary': { de: 'Generieren', en: 'Generate' },
  'ai.sug3Client': { de: 'Schmidt HW', en: 'Schmidt HW' },
  'ai.sug3Title': { de: 'Keine Reaktion seit 14 Tagen', en: 'No response for 14 days' },
  'ai.sug3Action': { de: 'Follow-up Email senden', en: 'Send follow-up email' },
  'ai.sug3Primary': { de: 'Email senden', en: 'Send Email' },

  // User Dropdown
  'user.profile': { de: 'Profil', en: 'Profile' },
  'user.settings': { de: 'Einstellungen', en: 'Settings' },
  'user.logout': { de: 'Abmelden', en: 'Sign Out' },
  'user.logoutMessage': { de: 'Du wurdest abgemeldet (simuliert).', en: 'You have been signed out (simulated).' },

  // Notifications
  'notification.title': { de: 'Benachrichtigungen', en: 'Notifications' },
  'notification.markAllRead': { de: 'Alle gelesen', en: 'Mark all read' },
  'notification.approvalNeeded': { de: 'Freigabe erforderlich', en: 'Approval needed' },
  'notification.empty': { de: 'Keine Benachrichtigungen', en: 'No notifications' },

  // Search
  'search.placeholder': { de: 'Kunde suchen...', en: 'Search clients...' },
  'search.noResults': { de: 'Keine Ergebnisse', en: 'No results' },

  // Connections Modal
  'conn.enterDetails': { de: 'Gib die Verbindungsdaten ein.', en: 'Enter connection details.' },
  'conn.confirmDisconnect': { de: 'Verbindung trennen?', en: 'Disconnect?' },
  'conn.willBeDisconnected': { de: 'wird getrennt. Bist du sicher?', en: 'will be disconnected. Are you sure?' },
  'conn.reconnect': { de: 'Neu verbinden', en: 'Reconnect' },
  'conn.folderName': { de: 'Ordner-Name', en: 'Folder Name' },
  'conn.autoCreateFolder': { de: 'Ordner automatisch erstellen', en: 'Create folder automatically' },

  // Loading
  'loading.title': { de: 'Laden...', en: 'Loading...' },

  // Breadcrumbs
  'breadcrumb.overview': { de: 'Übersicht', en: 'Overview' },
  'breadcrumb.clients': { de: 'Kunden', en: 'Clients' },
  'breadcrumb.onboarding': { de: 'Onboarding', en: 'Onboarding' },
  'breadcrumb.settings': { de: 'Einstellungen', en: 'Settings' },

  // Dashboard KPI Cards (redesign)
  'dashboard.totalLeads': { de: 'Gesamt Leads', en: 'Total Leads' },
  'dashboard.mrr': { de: 'MRR', en: 'MRR' },

  // Performance Tab
  'perf.platform': { de: 'Plattform', en: 'Platform' },
  'perf.total': { de: 'Gesamt', en: 'Total' },
  'perf.qualifiedApplicants': { de: 'Qualifizierte Bewerber', en: 'Qualified Applicants' },
  'perf.interviews': { de: 'Vorstellungsgespräche', en: 'Interviews' },
  'perf.hires': { de: 'Einstellungen', en: 'Hires' },
  'perf.costPerApplication': { de: 'Kosten pro Bewerbung', en: 'Cost per Application' },
  'perf.costPerHire': { de: 'Kosten pro Einstellung', en: 'Cost per Hire' },
  'perf.costPerInterview': { de: 'Kosten pro Vorstellungsgespräch', en: 'Cost per Interview' },
  'perf.funnelType': { de: 'Funnel-Typ', en: 'Funnel Type' },
  'perf.funnelRecruiting': { de: 'Recruiting', en: 'Recruiting' },
  'perf.funnelKundengewinnung': { de: 'Kundengewinnung', en: 'Customer Acquisition' },
  'perf.conversionFunnel': { de: 'Conversion-Funnel', en: 'Conversion Funnel' },
  'perf.stageImpressions': { de: 'Impressionen', en: 'Impressions' },
  'perf.stageClicks': { de: 'Klicks', en: 'Clicks' },
  'perf.stageApplications': { de: 'Bewerbungen', en: 'Applications' },
  'perf.stageQualified': { de: 'Qualifiziert', en: 'Qualified' },
  'perf.stageInterviews': { de: 'Vorstellungsgespräche', en: 'Interviews' },
  'perf.stageHires': { de: 'Eingestellt', en: 'Hired' },
  'perf.stageLeads': { de: 'Leads', en: 'Leads' },
  'perf.stageQualifiedLeads': { de: 'Qualifizierte Leads', en: 'Qualified Leads' },
  'perf.stageAppointments': { de: 'Termin gebucht', en: 'Booked' },
  'perf.stageDeals': { de: 'Abschluss', en: 'Closed' },
  'perf.costPerQualifiedLead': { de: 'Kosten pro qualifizierten Lead', en: 'Cost per Qualified Lead' },
  'perf.costPerAppointment': { de: 'Kosten pro Termin', en: 'Cost per Appointment' },
  'perf.costPerDeal': { de: 'Kosten pro Abschluss', en: 'Cost per Deal' },
  'perf.ltv': { de: 'Customer Lifetime Value', en: 'Customer Lifetime Value' },
  'perf.ltvRatio': { de: 'LTV/CAC Verhältnis', en: 'LTV/CAC Ratio' },
  'perf.cplOverTime': { de: 'Kosten pro Ergebnis', en: 'Cost per Result' },
  'perf.conversionOverTime': { de: 'Conversion Rate', en: 'Conversion Rate' },
  'perf.last30Days': { de: 'Letzte 30 Tage', en: 'Last 30 Days' },
  'perf.keyInsights': { de: 'Key Insights', en: 'Key Insights' },
  'perf.bestPlatform': { de: 'Beste Plattform', en: 'Best Platform' },
  'perf.conversionRate': { de: 'Conversion Rate', en: 'Conversion Rate' },
  'perf.avgCostResult': { de: 'Kosten pro Ergebnis', en: 'Cost per Result' },
  'perf.stepCr': { de: 'Schritt-CR', en: 'Step CR' },
  'perf.totalCr': { de: 'Gesamt-CR', en: 'Total CR' },

  // Client Card (redesign)
  'clients.perMonth': { de: '/Mo', en: '/mo' },

  // Pipeline Detail (timeline + checklist redesign)
  'pipeline.zeitstrahl': { de: 'Zeitstrahl', en: 'Timeline' },
  'pipeline.daysLabel': { de: '{n} Tage', en: '{n} days' },
  'pipeline.dayLabel': { de: '{n} Tag', en: '{n} day' },
  'pipeline.inArbeit': { de: 'in Arbeit', en: 'in progress' },
  'pipeline.geplant': { de: 'geplant', en: 'planned' },
  'pipeline.abgeschlossen': { de: 'abgeschlossen', en: 'completed' },
  'pipeline.projectDay': { de: 'Tag {current} von geschätzt {total}', en: 'Day {current} of estimated {total}' },
  'pipeline.onTrack': { de: 'Im Zeitplan', en: 'On Track' },
  'pipeline.delayed': { de: 'Verzögert', en: 'Delayed' },
  'pipeline.checklist': { de: 'Checkliste', en: 'Checklist' },
  'pipeline.currentPhaseLabel': { de: 'Aktuelle Phase: {phase}', en: 'Current Phase: {phase}' },
  'pipeline.progressPercent': { de: 'Fortschritt: {done}/{total} ({percent}%)', en: 'Progress: {done}/{total} ({percent}%)' },
  'pipeline.estDone': { de: 'Geschätzt fertig: {date}', en: 'Estimated done: {date}' },
  'pipeline.responsiblePerson': { de: 'Verantwortlich: {name}', en: 'Responsible: {name}' },

  // Deliverable Selector - arrow navigation
  'deliverables.prev': { de: 'Vorheriges Dokument', en: 'Previous deliverable' },
  'deliverables.next': { de: 'Nächstes Dokument', en: 'Next deliverable' },
  'deliverables.approvedShort': { de: 'freigegeben', en: 'approved' },

  // Google Docs Preview
  'gdoc.file': { de: 'Datei', en: 'File' },
  'gdoc.edit': { de: 'Bearbeiten', en: 'Edit' },
  'gdoc.view': { de: 'Ansicht', en: 'View' },
  'gdoc.insert': { de: 'Einfügen', en: 'Insert' },
  'gdoc.format': { de: 'Format', en: 'Format' },
  'gdoc.pageOf': { de: 'von', en: 'of' },

  // Website Preview
  'web.aboutUs': { de: 'Über uns', en: 'About Us' },
  'web.contact': { de: 'Kontakt', en: 'Contact' },
  'web.benefit1': { de: 'Top Benefits', en: 'Top Benefits' },
  'web.benefit2': { de: 'Starkes Team', en: 'Strong Team' },
  'web.benefit3': { de: 'Karriere', en: 'Career' },
  'web.privacy': { de: 'Datenschutz', en: 'Privacy' },
  'web.imprint': { de: 'Impressum', en: 'Imprint' },

  // Connection extra labels
  'conn.folderUrl': { de: 'Ordner-URL', en: 'Folder URL' },
  'conn.projectUrl': { de: 'Projekt-URL', en: 'Project URL' },

  // Content Review Categories
  'category.documents': { de: 'Dokumente', en: 'Documents' },
  'category.metaAds': { de: 'Meta Ads (FB/IG)', en: 'Meta Ads (FB/IG)' },
  'category.googleAds': { de: 'Google Ads', en: 'Google Ads' },
  'category.linkedinAds': { de: 'LinkedIn Ads', en: 'LinkedIn Ads' },
  'category.tiktokAds': { de: 'TikTok Ads', en: 'TikTok Ads' },
  'category.websiteTexts': { de: 'Website-Texte', en: 'Website Texts' },

  // Approval Bar
  'approval.approve': { de: 'Freigeben', en: 'Approve' },
  'approval.requestChanges': { de: 'Änderungen anfordern', en: 'Request Changes' },
  'approval.confirmApprove': { de: 'Wirklich freigeben?', en: 'Really approve?' },
  'approval.confirmChanges': { de: 'Wirklich Änderungen anfordern?', en: 'Really request changes?' },
  'approval.bulkApprove': { de: 'Alle freigeben ({count})', en: 'Approve all ({count})' },
  'approval.comment': { de: 'Kommentar', en: 'Comment' },
  'approval.commentPlaceholder': { de: 'Beschreibe die gewünschten Änderungen...', en: 'Describe the requested changes...' },
  'approval.approved': { de: 'Freigegeben', en: 'Approved' },
  'approval.changesRequested': { de: 'Änderungen angefordert', en: 'Changes Requested' },
  'approval.version': { de: 'Version {v}', en: 'Version {v}' },
  'approval.unsavedChanges': { de: 'Ungespeicherte Änderungen', en: 'Unsaved changes' },

  // Content Review Panel
  'review.noItems': { de: 'Keine Elemente in dieser Kategorie', en: 'No items in this category' },
  'review.noItemsDesc': { de: 'Es gibt noch keine Dokumente für diese Kategorie.', en: 'There are no deliverables for this category yet.' },
  'review.docPlaceholder': { de: 'Dokument-Vorschau', en: 'Document Preview' },
  'review.websitePlaceholder': { de: 'Website-Text Vorschau', en: 'Website Text Preview' },
  'review.positionOf': { de: '{current}/{total}', en: '{current}/{total}' },

  // Doc Review View
  'docReview.file': { de: 'Datei', en: 'File' },
  'docReview.edit': { de: 'Bearbeiten', en: 'Edit' },
  'docReview.view': { de: 'Ansicht', en: 'View' },
  'docReview.insert': { de: 'Einfügen', en: 'Insert' },
  'docReview.format': { de: 'Format', en: 'Format' },
  'docReview.tools': { de: 'Tools', en: 'Tools' },
  'docReview.extensions': { de: 'Erweiterungen', en: 'Extensions' },
  'docReview.help': { de: 'Hilfe', en: 'Help' },
  'docReview.editMode': { de: 'Bearbeiten', en: 'Edit' },
  'docReview.previewMode': { de: 'Vorschau', en: 'Preview' },
  'docReview.pageOf': { de: 'von', en: 'of' },

  // Website Text Review View
  'websiteText.heroSection': { de: 'Hero Section', en: 'Hero Section' },
  'websiteText.benefits': { de: 'Benefits', en: 'Benefits' },
  'websiteText.teamSection': { de: 'Team-Section', en: 'Team Section' },
  'websiteText.testimonials': { de: 'Testimonials', en: 'Testimonials' },
  'websiteText.ctaSection': { de: 'CTA-Section', en: 'CTA Section' },
  'websiteText.headline': { de: 'Überschrift', en: 'Headline' },
  'websiteText.subheadline': { de: 'Unterüberschrift', en: 'Subheadline' },
  'websiteText.ctaText': { de: 'CTA-Text', en: 'CTA Text' },
  'websiteText.benefit': { de: 'Benefit', en: 'Benefit' },
  'websiteText.quote': { de: 'Zitat', en: 'Quote' },
  'websiteText.description': { de: 'Beschreibung', en: 'Description' },
  'websiteText.entries': { de: 'Einträge', en: 'entries' },
  'websiteText.field': { de: 'Feld', en: 'Field' },
  'websiteText.structuredView': { de: 'Strukturierte Ansicht', en: 'Structured View' },

  // Links Tab
  'client.links': { de: 'Links', en: 'Links' },
  'links.infrastructure': { de: 'Infrastruktur', en: 'Infrastructure' },
  'links.documents': { de: 'Dokumente', en: 'Documents' },
  'links.campaigns': { de: 'Kampagnen', en: 'Campaigns' },
  'links.funnel': { de: 'Funnel', en: 'Funnel' },
  'links.noLinks': { de: 'Keine Links verfügbar', en: 'No links available' },
  'links.noLinksDesc': { de: 'Es wurden noch keine externen Links für diesen Kunden generiert.', en: 'No external links have been generated for this client yet.' },
  'links.closeLead': { de: 'Close Lead', en: 'Close Lead' },
  'links.driveFolder': { de: 'Google Drive Ordner', en: 'Google Drive Folder' },
  'links.slackChannel': { de: 'Slack Channel', en: 'Slack Channel' },
  'links.clickupProject': { de: 'ClickUp Projekt', en: 'ClickUp Project' },
  'links.kickoffMeet': { de: 'Google Meet / Kickoff', en: 'Google Meet / Kickoff' },
  'links.overviewSheet': { de: 'Google Sheets Übersicht', en: 'Google Sheets Overview' },
  'links.metaAdsManager': { de: 'Meta Ads Manager', en: 'Meta Ads Manager' },
  'links.campaignIds': { de: 'Kampagnen-IDs', en: 'Campaign IDs' },
  'links.landingPage': { de: 'Landingpage', en: 'Landing Page' },
  'links.formPage': { de: 'Formularseite', en: 'Form Page' },
  'links.thankYouPage': { de: 'Dankeseite', en: 'Thank You Page' },

  // Campaign Breakdown
  'perf.campaignBreakdown': { de: 'Kampagnen-Aufschlüsselung', en: 'Campaign Breakdown' },
  'perf.campaign': { de: 'Kampagne', en: 'Campaign' },
  'perf.campaignInitial': { de: 'Initial', en: 'Initial' },
  'perf.campaignRetargeting': { de: 'Retargeting', en: 'Retargeting' },
  'perf.campaignWarmup': { de: 'Warmup', en: 'Warmup' },
  'perf.noData': { de: 'Keine Performance-Daten', en: 'No performance data' },
  'perf.noDataDesc': { de: 'Es liegen noch keine Kampagnen-Daten vor. Sobald Kampagnen live sind, erscheinen hier die Ergebnisse.', en: 'No campaign data available yet. Once campaigns are live, results will appear here.' },
  'perf.leadsOverTime': { de: 'Leads über Zeit', en: 'Leads Over Time' },

  // Alerts
  'alert.failedNodes': { de: '{count} fehlgeschlagene Schritte', en: '{count} failed steps' },
  'alert.failedNode': { de: 'Schritt fehlgeschlagen', en: 'Step failed' },
  'alert.dismiss': { de: 'Verwerfen', en: 'Dismiss' },
  'alert.nodeError': { de: 'Fehler bei "{node}": {error}', en: 'Error at "{node}": {error}' },

  // Auto-Save Indicator (1.1)
  'docReview.saved': { de: 'Gespeichert', en: 'Saved' },
  'docReview.unsaved': { de: 'Ungespeicherte Änderungen', en: 'Unsaved changes' },

  // Category-specific Empty States (1.2)
  'empty.googleAds': { de: 'Noch keine Google Ads erstellt. Die KI generiert diese im nächsten Schritt.', en: 'No Google Ads created yet. AI will generate them in the next step.' },
  'empty.linkedinAds': { de: 'Noch keine LinkedIn Ads erstellt. Die KI generiert diese im nächsten Schritt.', en: 'No LinkedIn Ads created yet. AI will generate them in the next step.' },
  'empty.tiktokAds': { de: 'Noch keine TikTok Ads erstellt. Die KI generiert diese im nächsten Schritt.', en: 'No TikTok Ads created yet. AI will generate them in the next step.' },
  'empty.metaAds': { de: 'Noch keine Meta Ads vorhanden. Inhalte werden nach Strategie-Freigabe generiert.', en: 'No Meta Ads yet. Content will be generated after strategy approval.' },
  'empty.documents': { de: 'Noch keine Dokumente in dieser Kategorie.', en: 'No documents in this category yet.' },
  'empty.websiteTexts': { de: 'Noch keine Website-Texte erstellt. Diese werden nach der Strategie-Phase generiert.', en: 'No website texts yet. These will be generated after the strategy phase.' },

  // Dashboard Trends (1.5)
  'dashboard.trendUp': { de: '+{value}% vs. Vormonat', en: '+{value}% vs. last month' },
  'dashboard.trendDown': { de: '-{value}% vs. Vormonat', en: '-{value}% vs. last month' },

  // AI Assistant expanded responses (2.4)
  'ai.responseMueller': { de: 'Müller Pflege GmbH performt gut: 47 Leads bei einem CPL von 90,44\u20AC. Der Recruiting-Funnel zeigt 28 qualifizierte Bewerber, 12 Vorstellungsgespräche und 5 Einstellungen. Die Kosten pro Einstellung liegen bei 850,16\u20AC. Alle 18 Deliverables sind live.', en: 'Müller Pflege GmbH is performing well: 47 leads at a CPL of \u20AC90.44. The recruiting funnel shows 28 qualified applicants, 12 interviews and 5 hires. Cost per hire is \u20AC850.16. All 18 deliverables are live.' },
  'ai.responseKosten': { de: 'Überblick Kosten:\n- Müller Pflege: 4.250,80\u20AC Gesamtspend (CPL 90,44\u20AC)\n- Meta: 3.200\u20AC (CPL 84,21\u20AC) - performt besser\n- Google: 1.050,80\u20AC (CPL 116,76\u20AC)\nMeta liefert das bessere Ergebnis pro Lead.', en: 'Cost overview:\n- Müller Pflege: \u20AC4,250.80 total spend (CPL \u20AC90.44)\n- Meta: \u20AC3,200 (CPL \u20AC84.21) - better performance\n- Google: \u20AC1,050.80 (CPL \u20AC116.76)\nMeta delivers better cost per lead.' },
  'ai.responseKampagne': { de: 'Kampagnen-Status:\n- Müller Pflege: 3 Kampagnen live (Initial, Retargeting, Warmup)\n- Weber IT: Kampagnen blockiert, warten auf Funnel-Freigabe\n- Schmidt HW: Pausiert wegen Ghost-Detection\nEmpfehlung: Weber IT Texte freigeben, um Kampagnen zu entsperren.', en: 'Campaign status:\n- Müller Pflege: 3 campaigns live (Initial, Retargeting, Warmup)\n- Weber IT: Campaigns blocked, waiting for funnel approval\n- Schmidt HW: Paused due to ghost detection\nRecommendation: Approve Weber IT copy to unblock campaigns.' },
  'ai.responseStatus': { de: 'Status aller Kunden:\n- Müller Pflege: Live, alle Systeme aktiv, 47 Leads\n- Weber IT: Texte-Phase, 5 Dokumente zur Freigabe offen\n- Schmidt HW: Pausiert seit 18.03., keine Reaktion seit 14 Tagen\nPriorität: Weber IT Freigaben bearbeiten.', en: 'All clients status:\n- Müller Pflege: Live, all systems active, 47 leads\n- Weber IT: Copy phase, 5 documents pending approval\n- Schmidt HW: Paused since 03/18, no response for 14 days\nPriority: Process Weber IT approvals.' },
  'ai.responseFunnel': { de: 'Recruiting-Funnel Müller Pflege:\n125.000 Impressionen → 3.200 Klicks (CTR 2,56%) → 47 Leads → 28 Qualifiziert (59,6%) → 12 Interviews (42,9%) → 5 Einstellungen (41,7%)\nDie Conversion von Qualifiziert zu Interview könnte verbessert werden.', en: 'Recruiting funnel Müller Pflege:\n125,000 impressions → 3,200 clicks (CTR 2.56%) → 47 leads → 28 qualified (59.6%) → 12 interviews (42.9%) → 5 hires (41.7%)\nConversion from qualified to interview could be improved.' },
  'ai.responseBudget': { de: 'Budget-Verteilung aktuell:\n- Meta: 3.200\u20AC (75,3%) - 38 Leads, CPL 84,21\u20AC\n- Google: 1.050,80\u20AC (24,7%) - 9 Leads, CPL 116,76\u20AC\nMeta hat 28% niedrigeren CPL. Empfehlung: Budget-Anteil zu Meta verschieben.', en: 'Current budget allocation:\n- Meta: \u20AC3,200 (75.3%) - 38 leads, CPL \u20AC84.21\n- Google: \u20AC1,050.80 (24.7%) - 9 leads, CPL \u20AC116.76\nMeta has 28% lower CPL. Recommendation: Shift more budget to Meta.' },
  'ai.responseRoi': { de: 'ROI-Betrachtung Müller Pflege:\n- Monatspreis: 3.500\u20AC\n- 5 Einstellungen bei ca. 850\u20AC pro Hire\n- Branchenüblich liegt der CPH bei 1.500-3.000\u20AC\n- Wir liegen 43% unter dem Branchendurchschnitt.\nKlarer Mehrwert für den Kunden.', en: 'ROI analysis Müller Pflege:\n- Monthly fee: \u20AC3,500\n- 5 hires at ~\u20AC850 per hire\n- Industry average CPH is \u20AC1,500-3,000\n- We are 43% below industry average.\nClear value for the client.' },
  'ai.responsePlattform': { de: 'Plattform-Vergleich:\n- Meta (FB/IG): CTR 2,55%, CR 1,52%, CPL 84,21\u20AC\n- Google Ads: CTR 2,59%, CR 1,29%, CPL 116,76\u20AC\nMeta hat die höhere Conversion Rate und den niedrigeren CPL. Google hat leicht höhere CTR aber konvertiert schlechter.', en: 'Platform comparison:\n- Meta (FB/IG): CTR 2.55%, CR 1.52%, CPL \u20AC84.21\n- Google Ads: CTR 2.59%, CR 1.29%, CPL \u20AC116.76\nMeta has higher conversion rate and lower CPL. Google has slightly higher CTR but converts worse.' },

  // Errors Tab
  'client.errors': { de: 'Fehler', en: 'Errors' },

  // Keyboard shortcuts (3.1)
  'shortcut.approve': { de: '\u2318+Enter = Freigeben', en: '\u2318+Enter = Approve' },
}

export function createT(lang: Language) {
  return function t(key: string, params?: Record<string, string | number>): string {
    const entry = translations[key]
    if (!entry) return key
    let text = entry[lang] ?? entry.de ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }
}
