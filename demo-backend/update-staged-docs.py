#!/usr/bin/env python3
"""
Update 12 existing Google Docs with clean, well-structured content.
Uses native HTML tags (h1, h2, h3, table, b, i, ul, ol) that Google Docs renders natively.
"""
import subprocess, json, sys, time
from datetime import datetime
import httpx

# Dynamic date for docs — always "today"
_TODAY = datetime.now().strftime("%d.%m.%Y")
_QUARTER = f"Q{(datetime.now().month - 1) // 3 + 1} {datetime.now().year}"

DOPPLER_PATH = "/Users/claudiodifranco/.local/bin/doppler"

DOCS = {
    "02": "1TOLqoqvEYy_DTxMb1zSUeq-cmXmNHmmUQe9EG2B1vEY",
    "03": "1de1XU5ykeIw36kKSiorQqzPAGkHfsceflnTCBpVY26Q",
    "04": "1HLMrDn_p1aqL7nnfB09e0mPakj-m0BSIhQwTdkoX03E",
    "05": "1sxB6R6l4DUn10hYEhY5xCEkNxZ4dvE9EUFvgT0hmCz8",
    "06": "1Xp0y_liDQ43AMdH3cjEwxdo9ZSZOP1AlVr8r-pn2Cps",
    "07": "1CEZAzrioyaqn7PMfc0ARadG1Jw5ic-uXTV4tE1aX2PU",
    "08": "1Qe0zXGHVcABIEMTZUn4tMttloGfa14bpCtKU3L95-Qw",
    "09": "13M6owsnBTr6OAElN0LvhF5Oz_Ky4l0OdvhSb2dhfQ7g",
    "10": "1lf2U2ZI47-Oz8eTW8OKziGwN_Z_SAssS8DiJAiiJ5SQ",
    "11": "1ITRWWBL9tY-2AUi4CIB6wbPqbk6CGcv5UB6ePtH87j0",
    "12": "1UhYIjW_acVN34w3mmmj1X9v20NWXVH93YRM2LCaxjuE",
    "13": "171Eg7V8jKGOYrqdYOLUM6DvfDodet_mxPrUB5DmMqEs",
}

# ── Credentials ─────────────────────────────────────────────────

def get_credentials():
    result = subprocess.run(
        [DOPPLER_PATH, "secrets", "get", "FLOWSTACK_GOOGLE_OAUTH_TOKEN", "--plain",
         "--project", "fulfillment-automation", "--config", "dev_claudio"],
        capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR: Doppler failed: {result.stderr}"); sys.exit(1)
    creds = json.loads(result.stdout)
    return {"token": creds["token"], "refresh_token": creds["refresh_token"],
            "client_id": creds["client_id"], "client_secret": creds["client_secret"]}

def refresh_token(creds):
    resp = httpx.post("https://oauth2.googleapis.com/token", data={
        "client_id": creds["client_id"], "client_secret": creds["client_secret"],
        "refresh_token": creds["refresh_token"], "grant_type": "refresh_token"}, timeout=15)
    if resp.status_code == 200:
        creds["token"] = resp.json().get("access_token", creds["token"])
    return creds

def ensure_valid_token(creds):
    resp = httpx.get("https://www.googleapis.com/drive/v3/about?fields=user",
        headers={"Authorization": f"Bearer {creds['token']}"}, timeout=10)
    if resp.status_code == 401: creds = refresh_token(creds)
    return creds

def update_doc(token, file_id, html_content, retries=2):
    for attempt in range(retries + 1):
        try:
            resp = httpx.patch(
                f"https://www.googleapis.com/upload/drive/v3/files/{file_id}?uploadType=media",
                headers={"Authorization": f"Bearer {token}",
                         "Content-Type": "text/html; charset=UTF-8"},
                content=html_content.encode("utf-8"), timeout=45)
            if resp.status_code == 200: return "updated"
            print(f"    WARN {attempt+1}: {resp.status_code} {resp.text[:150]}")
            if attempt < retries: time.sleep(2)
        except Exception as e:
            print(f"    ERR {attempt+1}: {e}")
            if attempt < retries: time.sleep(2)
    return "failed"

# ── Clean HTML Helpers ───────────────────────────────────────────

def tbl(headers, rows):
    h = '<table border="1" cellpadding="6" cellspacing="0"><tr>'
    for t in headers:
        h += f'<th>{t}</th>'
    h += '</tr>'
    for row in rows:
        h += '<tr>'
        for cell in row:
            h += f'<td>{cell}</td>'
        h += '</tr>'
    h += '</table><br>'
    return h

def wrap(body):
    return f'<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head><body>{body}</body></html>'

# ── Document Content ─────────────────────────────────────────────

def doc_02():
    b = '<h1>#02 Zielgruppen-Avatar</h1>'
    b += '<p><i>Kandidatenprofil &mdash; Senior Fullstack Developer &mdash; Recruiting-Kampagne</i></p><hr>'

    b += '<h2>01 Persona-Steckbrief</h2>'
    b += tbl(["Merkmal", "Detail"], [
        ["<b>Name (fiktiv)</b>", "Markus T."],
        ["<b>Alter</b>", "32 Jahre"],
        ["<b>Wohnort</b>", "D&uuml;sseldorf, NRW"],
        ["<b>Rolle</b>", "Senior Fullstack Developer"],
        ["<b>Erfahrung</b>", "7+ Jahre (React, Node.js, TypeScript, AWS)"],
        ["<b>Aktueller AG</b>", "Mittelst&auml;ndisches Softwarehaus, ~80 MA"],
        ["<b>Gehalt aktuell</b>", "72.000&ndash;85.000 &euro; brutto/Jahr"],
        ["<b>Familienstand</b>", "Partnerin, 1 Kind (3 Jahre)"],
        ["<b>Suchverhalten</b>", "Passiv &mdash; nicht aktiv auf Jobsuche, aber offen f&uuml;r Angebote"],
    ])
    b += '<p><b>Sekund&auml;r-Persona:</b> Sarah K., 38, Lead Developer, 10+ Jahre Erfahrung, Go/Python/K8s, aktuell in Konzern (~2.000 MA), Gehalt 88.000&ndash;95.000 &euro;, sucht mehr technische Ownership.</p>'

    b += '<h2>02 Psychografisches Profil</h2>'
    b += '<p><b>Werte &amp; &Uuml;berzeugungen:</b></p><ul>'
    for v in ["Technische Exzellenz &uuml;ber B&uuml;rokratie", "Autonomie und Eigenverantwortung als Kernwerte",
              "Work-Life-Balance ist kein Nice-to-have, sondern Grundvoraussetzung",
              "Kontinuierliches Lernen &mdash; stagniert ungern", "Misstrauisch gegen&uuml;ber Corporate-Buzzwords &mdash; braucht Fakten"]:
        b += f'<li>{v}</li>'
    b += '</ul>'
    b += tbl(["Eigenschaft", "Auspr&auml;gung"], [
        ["Introvertiert / Extrovertiert", "Eher introvertiert, sch&auml;tzt fokussiertes Arbeiten"],
        ["Pragmatisch / Idealistisch", "Pragmatisch &mdash; will Ergebnisse sehen, nicht nur reden"],
        ["Risiko / Sicherheit", "Sicherheitsorientiert &mdash; Stabilit&auml;t ist wichtig (Kind, Partnerin)"],
    ])
    b += '<p><b>Medienkonsum:</b></p>'
    b += tbl(["Kanal", "Frequenz", "Content-Typ"], [
        ["LinkedIn", "T&auml;glich", "Tech-Posts, Karriere-Content"],
        ["GitHub", "T&auml;glich", "Open-Source, Code-Reviews"],
        ["Heise / t3n / Dev.to", "W&ouml;chentlich", "Fachartikel, News"],
        ["YouTube", "2-3x/Woche", "Tech-Talks, Conference Recordings"],
        ["Reddit r/programming", "W&ouml;chentlich", "Diskussionen, Meinungen"],
        ["Podcasts (CTO Lunch, SE Radio)", "1x/Woche", "Architektur, Leadership"],
    ])

    b += '<h2>03 Jobs-to-be-Done Analyse</h2>'
    b += tbl(["Functional Jobs", "Emotional Jobs", "Social Jobs"], [
        ["Modernen Tech-Stack nutzen, der Produktivit&auml;t steigert", "Gef&uuml;hl, dass meine Arbeit echten Impact hat", "Bei einem Unternehmen arbeiten, das in der Tech-Community respektiert wird"],
        ["Architekturentscheidungen selbst treffen k&ouml;nnen", "Stolz auf den Code sein, den ich schreibe", "Peers beeindrucken mit spannenden Projekten"],
        ["Code schnell in Produktion bringen (kurze Deployment-Zyklen)", "Morgens gerne den Laptop aufklappen", "Als Engineer wahrgenommen werden, nicht als Ressource"],
        ["Remote arbeiten mit flexibler Zeiteinteilung", "Work-Life-Balance ohne schlechtes Gewissen", "Familie und Karriere vereinbaren k&ouml;nnen"],
    ])

    b += '<h2>04 Pain Points &amp; Frustrationen</h2>'
    b += '<p><b>Kernfrustration:</b> &laquo;Ich programmiere eigentlich nicht mehr. Ich verschiebe Tickets und sitze in Meetings.&raquo;</p>'
    b += tbl(["Pain Point", "Intensit&auml;t", "Typisches Zitat"], [
        ["<b>Legacy-Code ohne Tests</b>", "5/5", "&laquo;6 Wochen an einem Feature &mdash; nie deployed.&raquo;"],
        ["<b>Micromanagement</b>", "4/5", "&laquo;Management bestimmt die Architektur.&raquo;"],
        ["<b>Meeting-&Uuml;berflutung</b>", "4/5", "&laquo;3 Meetings vormittags, nachmittags keine Energie.&raquo;"],
        ["<b>Keine Remote-Option</b>", "5/5", "&laquo;Return-to-Office ist f&uuml;r mich ein Dealbreaker.&raquo;"],
        ["<b>Veralteter Tech-Stack</b>", "4/5", "&laquo;Wir nutzen noch jQuery und Java 8.&raquo;"],
        ["<b>Stagnation</b>", "4/5", "&laquo;Ich merke, dass ich mich fachlich zur&uuml;ckentwickle.&raquo;"],
        ["<b>Technische Schulden ignoriert</b>", "3/5", "&laquo;Jedes Refactoring wird abgelehnt.&raquo;"],
        ["<b>Kein Weiterbildungsbudget</b>", "3/5", "&laquo;Konferenzen? Nur f&uuml;r Leads.&raquo;"],
    ])

    b += '<h2>05 Trigger-Events &amp; Wechselmotivation</h2>'
    b += '<ol>'
    for t in [
        "<b>Entt&auml;uschende Gehaltsrunde</b> &mdash; &laquo;3% nach einem Top-Jahr? Ernsthaft?&raquo;",
        "<b>Return-to-Office Ank&uuml;ndigung</b> &mdash; Sofortige Wechselbereitschaft",
        "<b>Neuer CTO mit anderer Vision</b> &mdash; Stack-Wechsel oder Prozess&auml;nderungen",
        "<b>Teamkollegen k&uuml;ndigen</b> &mdash; Domino-Effekt, Vertrauensverlust",
        "<b>Burnout-Symptome</b> &mdash; &Uuml;berstundenkultur wird nicht mehr toleriert",
        "<b>Spannende Ad im LinkedIn-Feed</b> &mdash; Passive Neugier wird aktiviert",
    ]:
        b += f'<li>{t}</li>'
    b += '</ol>'

    b += '<h2>06 Candidate Journey &amp; Informationsverhalten</h2>'
    b += tbl(["Phase", "Kanal", "Content-Typ", "Verweildauer", "Entscheidungsfaktor"], [
        ["<b>Passive Phase</b>", "LinkedIn Feed, Instagram", "Employer Branding Video, Post", "15&ndash;30 Sek.", "Thumb-Stop Hook"],
        ["<b>Awareness</b>", "Landingpage, Karriereseite", "Hero-Texte, Benefits, Team", "2&ndash;4 Min.", "Moderner Stack, Remote-Policy"],
        ["<b>Consideration</b>", "Glassdoor, Kununu, GitHub", "Reviews, Open Source, Tech Blog", "10&ndash;20 Min.", "Authentizit&auml;t, echte Mitarbeiterstimmen"],
        ["<b>Application</b>", "Bewerbungsformular", "Einfacher Prozess, klare Erwartungen", "2&ndash;5 Min.", "Kein Anschreiben, schnelle R&uuml;ckmeldung"],
        ["<b>Decision</b>", "Tech-Talk, Team-Call", "Pers&ouml;nliches Gespr&auml;ch", "90 Min.", "Team-Fit, technische Tiefe, Gehalt"],
    ])

    b += '<h2>07 Einw&auml;nde &amp; Entkr&auml;ftung</h2>'
    b += tbl(["Einwand", "Entkr&auml;ftung", "Beweis"], [
        ["&laquo;Bestimmt ein Chaos-Startup.&raquo;", "Profitables Unternehmen mit 4.2M ARR", "Seit 2019 profitabel, +65% YoY Wachstum"],
        ["&laquo;Zu klein f&uuml;r Karriere.&raquo;", "Schnelle Entwicklung durch flache Hierarchien", "Senior &rarr; Lead &rarr; Principal Track dokumentiert"],
        ["&laquo;Team k&ouml;nnte schwach sein.&raquo;", "35 Engineers mit &Oslash; 6 Jahren Erfahrung", "Open-Source-Beitr&auml;ge, Conference-Speaker"],
        ["&laquo;4-Tage-Woche = weniger Gehalt?&raquo;", "Gleiches Gehalt, komprimierte Woche", "Marktgerechte Verg&uuml;tung 75&ndash;95k"],
        ["&laquo;Remote hei&szlig;t isoliert.&raquo;", "W&ouml;chentliche Team-Calls, 2x/Jahr Team-Retreat", "Hack-Week Mallorca 2025, Team-Events quarterly"],
    ])

    b += '<h2>08 Zusammenfassung</h2>'
    b += '<p><b>Kern-Insight:</b> Markus sucht keinen neuen Job &mdash; er sucht ein Umfeld, in dem er wieder als Engineer wachsen kann. Er braucht keine Versprechen, sondern konkrete Beweise: Tech-Stack, Team-Qualit&auml;t, echte Remote-Kultur. Der Schl&uuml;ssel liegt nicht in der Stellenanzeige, sondern im authentischen Einblick in den Arbeitsalltag.</p>'
    return "Zielgruppen-Avatar | NOVACODE Recruiting", wrap(b)


def doc_03():
    b = '<h1>#03 Arbeitgeber-Avatar</h1>'
    b += '<p><i>Employer Positioning &amp; EVP &middot; NOVACODE Solutions GmbH</i></p>'

    b += '<h2>01 Unternehmenssteckbrief</h2>'
    b += tbl(["Merkmal", "Detail"], [
        ["<b>Firma</b>", "NOVACODE Solutions GmbH"],
        ["<b>Gr&uuml;ndung</b>", "2019"],
        ["<b>Hauptsitz</b>", "K&ouml;ln (+ 100% Remote)"],
        ["<b>Mitarbeiter</b>", "35 (davon 28 Engineers)"],
        ["<b>Branche</b>", "SaaS / Enterprise Software"],
        ["<b>ARR</b>", "4.2 Mio. &euro; (+65% YoY)"],
        ["<b>Tech-Stack</b>", "React, TypeScript, Node.js, Go, Kubernetes, AWS"],
        ["<b>Kunden</b>", "B2B Enterprise, DACH-Region"],
    ])

    b += '<h2>02 Vision, Mission &amp; Werte</h2>'
    b += '<p><b>Vision:</b> &laquo;Wir bauen Software, die Unternehmen transformiert &mdash; mit einem Team, das dabei selbst w&auml;chst.&raquo;</p>'
    b += '<p><b>Mission:</b> Komplexe Gesch&auml;ftsprozesse durch elegante Software l&ouml;sen. Dabei ein Arbeitsumfeld schaffen, in dem Engineers ihre beste Arbeit leisten k&ouml;nnen.</p>'
    b += tbl(["Wert", "Bedeutung", "Manifestation im Alltag"], [
        ["<b>Engineering Excellence</b>", "Code-Qualit&auml;t &uuml;ber Geschwindigkeit", "Code Reviews mandatory, Tech-Debt Sprints monatlich"],
        ["<b>Remote-First</b>", "Remote ist Standard, nicht Ausnahme", "Async-Kommunikation, keine Kernarbeitszeit"],
        ["<b>Ownership</b>", "Jeder Engineer ownt Features E2E", "Du deployest deinen eigenen Code in Produktion"],
        ["<b>Transparenz</b>", "Offene Zahlen, offene Entscheidungen", "Monatliches All-Hands mit Finanzen, OKR-Dashboard public"],
        ["<b>Wachstum</b>", "Pers&ouml;nliche + fachliche Entwicklung", "3.000 &euro;/Jahr Weiterbildung, 2 Konferenzen, Mentoring"],
    ])

    b += '<h2>03 Employer Value Proposition (EVP)</h2>'
    b += '<p><b>Bei NOVACODE baust du nicht nur Software &mdash; du gestaltest Produkte mit echtem Impact, in einem Team das technische Exzellenz lebt. 100% Remote, moderner Stack, faire Verg&uuml;tung.</b></p>'

    b += '<h2>04 Die 4 P&rsquo;s des Employer Brandings</h2>'
    b += '<h3>People &mdash; Team &amp; Kultur</h3><ul>'
    for i in ["35 Engineers, &Oslash; 6 Jahre Erfahrung", "8 Nationalit&auml;ten, 4 Zeitzonen", "Hiring-Bar: Jeder im Team muss zustimmen", "Kein HR-Gespr&auml;ch &mdash; Tech-Talk mit echten Engineers"]:
        b += f'<li>{i}</li>'
    b += '</ul>'
    b += '<h3>Purpose &mdash; Sinn &amp; Impact</h3><ul>'
    for i in ["B2B-SaaS das Gesch&auml;ftsprozesse transformiert", "Jeder Engineer sieht seinen Code bei echten Kunden", "Open-Source Contributions w&auml;hrend der Arbeitszeit", "Nachhaltigkeit: CO2-Kompensation, Green Hosting"]:
        b += f'<li>{i}</li>'
    b += '</ul>'
    b += '<h3>Place &mdash; Arbeitsumfeld</h3><ul>'
    for i in ["100% Remote seit Gr&uuml;ndung &mdash; kein Hybrid-Kompromiss", "Keine Kernarbeitszeit &mdash; async-first", "Home-Office Budget: 1.500 &euro; Setup", "Team-Retreats 2x/Jahr (zuletzt: Mallorca, Lissabon)"]:
        b += f'<li>{i}</li>'
    b += '</ul>'
    b += '<h3>Product &mdash; Tech &amp; Projekte</h3><ul>'
    for i in ["React 19, TypeScript 5, Node.js, Go, Kubernetes", "Microservices auf AWS (EKS, RDS, SQS)", "CI/CD: Merge &rarr; Prod in &lt; 15 Min", "Tech-Debt Sprints: 20% der Zeit f&uuml;r Refactoring"]:
        b += f'<li>{i}</li>'
    b += '</ul>'

    b += '<h2>05 Wettbewerbsanalyse</h2>'
    b += tbl(["Kriterium", "NOVACODE", "Konzern (2.000 MA)", "Startup (15 MA)"], [
        ["<b>Gehalt Senior Dev</b>", "75&ndash;95k &euro;", "80&ndash;100k &euro;", "60&ndash;75k &euro;"],
        ["<b>Remote-Policy</b>", "100% Remote", "Hybrid 3/2", "100% Remote"],
        ["<b>Tech-Stack</b>", "React, Node, K8s", "Java 8, Angular", "Next.js, Go"],
        ["<b>Work-Life-Balance</b>", "4-Tage-Woche Option", "Standard 40h", "Startup-Pace 50h+"],
        ["<b>Karrierepfade</b>", "IC + Management Track", "Strukturiert", "Unklar"],
        ["<b>Weiterbildung</b>", "3.000 &euro;/Jahr + Konferenzen", "Nur intern", "Budget unklar"],
        ["<b>Stabilit&auml;t</b>", "Profitabel seit 2021", "Konzern-Sicherheit", "Runway 12 Monate"],
    ])

    b += '<h2>06 Benefits auf einen Blick</h2>'
    b += tbl(["Benefit", "Detail"], [
        ["<b>100% Remote</b>", "Seit Gr&uuml;ndung, kein Hybrid-Kompromiss"],
        ["<b>4-Tage-Woche</b>", "Optional, gleiches Gehalt, komprimierte Woche"],
        ["<b>Weiterbildung</b>", "3.000 &euro;/Jahr + 2 Konferenzen"],
        ["<b>Hardware</b>", "MacBook Pro M4 + 1.500 &euro; Home-Office-Budget"],
        ["<b>30 Urlaubstage</b>", "+ Sonderurlaub an Geburtstag und Weihnachten"],
        ["<b>VSOP-Beteiligung</b>", "Echte Equity-Beteiligung ab 1. Jahr"],
        ["<b>Workation</b>", "Bis zu 4 Wochen/Jahr aus dem EU-Ausland"],
        ["<b>Team-Retreats</b>", "2x/Jahr, zuletzt Mallorca und Lissabon"],
        ["<b>Open Source Time</b>", "4h/Woche f&uuml;r OSS-Contributions"],
        ["<b>Mental Health</b>", "Coaching-Budget + keine Meeting-Freitage"],
    ])

    b += '<h2>07 Positionierungsstatement</h2>'
    b += '<p>NOVACODE positioniert sich als das Remote-First Tech-Unternehmen, bei dem Senior Developer <b>wieder wie Engineers arbeiten</b> k&ouml;nnen: moderner Stack, echte Ownership, faire Verg&uuml;tung &mdash; ohne Konzern-B&uuml;rokratie und ohne Startup-Chaos. Wir bieten die <b>Stabilit&auml;t eines profitablen Unternehmens</b> mit der <b>Agilit&auml;t eines kleinen Teams</b>.</p>'
    return "Arbeitgeber-Avatar | NOVACODE Recruiting", wrap(b)


def doc_04():
    b = '<h1>#04 Messaging-Matrix</h1>'
    b += '<p><i>Kernbotschaften &middot; USPs &middot; Pain-Point-Mapping &middot; Tone of Voice</i></p>'

    b += '<h2>01 Kernbotschaft</h2>'
    b += '<p><b>&laquo;Bei NOVACODE baust du nicht nur Software &mdash; du gestaltest Produkte mit echtem Impact, in einem Team das technische Exzellenz lebt.&raquo;</b></p>'
    b += '<p><b>Claim:</b> <i>Code with impact. Work with freedom.</i></p>'

    b += '<h2>02 USP-Matrix</h2>'
    b += tbl(["USP", "Beschreibung", "Proof Point", "Relevanz"], [
        ["<b>100% Remote-First</b>", "Seit Gr&uuml;ndung remote, kein Hybrid", "35 MA in 8 L&auml;ndern, async-first Kultur", "5/5"],
        ["<b>4-Tage-Woche Option</b>", "Gleiches Gehalt, komprimierte Woche", "40% der Engineers nutzen die 4-Tage-Woche", "5/5"],
        ["<b>Moderner Tech-Stack</b>", "React 19, Node.js, Go, Kubernetes", "95% TypeScript, 100% CI/CD, Merge&rarr;Prod &lt;15 Min", "5/5"],
        ["<b>Echte Ownership</b>", "Engineers ownen Features End-to-End", "Kein Ticket-Shuffling, du deployest deinen Code", "4/5"],
        ["<b>Weiterbildung</b>", "3.000 &euro;/Jahr + 2 Konferenzen", "Open-Source Time 4h/Woche", "4/5"],
        ["<b>Flache Hierarchien</b>", "Max. 2 Reporting-Ebenen", "Jeder spricht direkt mit dem CTO", "3/5"],
        ["<b>Profitabel &amp; Stabil</b>", "4.2M ARR, profitabel seit 2021", "+65% YoY, kein VC-Druck", "4/5"],
        ["<b>VSOP-Beteiligung</b>", "Equity ab dem 1. Jahr", "Echte Teilhabe am Unternehmenserfolg", "3/5"],
    ])

    b += '<h2>03 Pain-Point &rarr; Message Mapping</h2>'
    b += tbl(["Pain Point", "Emotion", "Unsere Antwort", "Beweis"], [
        ["<b>Legacy-Code</b>", "Frustration", "Greenfield + moderner Stack", "95% TypeScript, React 19, K8s"],
        ["<b>Micromanagement</b>", "Kontrollverlust", "Echte Ownership E2E", "Engineers entscheiden Architektur"],
        ["<b>Meeting-&Uuml;berflutung</b>", "Energieverlust", "Async-first, No-Meeting-Fridays", "&Oslash; 3 Meetings/Woche"],
        ["<b>Kein Remote</b>", "Einschr&auml;nkung", "100% Remote seit Tag 1", "8 L&auml;nder, keine Kernarbeitszeit"],
        ["<b>Stagnation</b>", "Identit&auml;tsverlust", "Weiterbildung + Open Source", "3.000 &euro;/Jahr + Conference-Budget"],
        ["<b>Feature-Friedhof</b>", "Sinnlosigkeit", "Merge&rarr;Prod in &lt; 15 Min", "Continuous Deployment auf AWS"],
        ["<b>Schlechte Verg&uuml;tung</b>", "Unterbewertung", "75&ndash;95k + VSOP-Beteiligung", "Marktgerecht + Equity"],
        ["<b>Keine Karriere</b>", "Perspektivlosigkeit", "IC + Management Track", "Senior&rarr;Lead&rarr;Principal dokumentiert"],
    ])

    b += '<h2>04 Messaging nach Funnel-Phase</h2>'
    b += tbl(["Phase", "Ziel", "Kernbotschaft", "Ton", "CTA"], [
        ["<b>Warmup</b> (Top of Funnel)", "Brand Awareness", "Wertvoller Tech-Content, kein Hard Sell", "Informativ, locker", "Video ansehen"],
        ["<b>Hauptkampagne</b> (Mid Funnel)", "Consideration", "Pain Points ansprechen &rarr; NOVACODE als L&ouml;sung", "Direkt, empathisch", "Mehr erfahren"],
        ["<b>Retargeting</b> (Bottom Funnel)", "Conversion", "Einw&auml;nde entkr&auml;ften, Social Proof", "Pers&ouml;nlich, &uuml;berzeugend", "Jetzt bewerben"],
        ["<b>Landingpage</b>", "Application", "Benefits konkretisieren, Prozess erkl&auml;ren", "Professionell, einladend", "In 2 Min bewerben"],
    ])

    b += '<h2>05 Tone of Voice</h2>'
    b += tbl(["Wir sind ...", "Wir sind NICHT ..."], [
        ["<b>Direkt &amp; ehrlich</b> &mdash; klare Aussagen, keine Floskeln", "<b>&Uuml;berheblich</b> &mdash; kein &laquo;Wir sind die Besten&raquo;"],
        ["<b>Technisch versiert</b> &mdash; wir sprechen die Sprache der Devs", "<b>Akademisch-trocken</b> &mdash; kein Whitepaper-Deutsch"],
        ["<b>Authentisch</b> &mdash; echte Einblicke, echte Zahlen", "<b>Corporate</b> &mdash; keine &laquo;Synergien&raquo; und &laquo;Stakeholder&raquo;"],
        ["<b>Empathisch</b> &mdash; wir kennen die Pain Points", "<b>Herablassend</b> &mdash; kein &laquo;Wir retten euch&raquo;"],
        ["<b>Selbstbewusst</b> &mdash; wir wissen, was wir bieten", "<b>Aggressiv</b> &mdash; kein Bashing anderer Arbeitgeber"],
    ])

    b += '<h2>06 Wording-Glossar</h2>'
    b += tbl(["Bevorzugt", "Vermeiden", "Begr&uuml;ndung"], [
        ["Team", "Mitarbeiter / Arbeitnehmer", "Betont Zusammengeh&ouml;rigkeit"],
        ["Engineer / Developer", "Programmierer / Coder", "Professioneller, respektvoller"],
        ["gestalten", "arbeiten", "Impliziert Ownership und Impact"],
        ["moderner Stack", "cutting-edge / bleeding-edge", "Weniger &uuml;bertrieben"],
        ["Remote-First", "Home-Office m&ouml;glich", "St&auml;rkeres Commitment"],
        ["wachsen", "Karriere machen", "Intrinsische Motivation"],
        ["Du", "Sie", "Tech-Community ist per Du"],
        ["Team-Retreat", "Firmenevent", "Klingt attraktiver, authentischer"],
    ])
    return "Messaging-Matrix | NOVACODE Recruiting", wrap(b)


def doc_05():
    b = '<h1>#05 Creative Briefing</h1>'
    b += '<p><i>Visuelle Richtlinien &middot; Bildsprache &middot; Formatvorgaben &middot; Kampagnendesign</i></p>'

    b += '<h2>01 Projekt&uuml;bersicht</h2>'
    b += tbl(["Parameter", "Detail"], [
        ["<b>Projekt</b>", "NOVACODE Senior Developer Recruiting"],
        ["<b>Ziel</b>", "Qualifizierte Bewerbungen von Senior Fullstack Developers (NRW)"],
        ["<b>Zielgruppe</b>", "Senior Devs, 28&ndash;45, React/Node/Go, passiv suchend"],
        ["<b>Kan&auml;le</b>", "Meta (FB + IG), LinkedIn, Landingpage, Video"],
        ["<b>Laufzeit</b>", "8 Wochen (Phase 1), Verl&auml;ngerung nach Performance"],
        ["<b>Budget</b>", "90 &euro;/Tag gesamt (30&euro; je Kampagnentyp)"],
    ])

    b += '<h2>02 Kampagnenziel &amp; KPIs</h2>'
    b += tbl(["KPI", "Zielwert"], [
        ["<b>Cost per Application</b>", "&lt; 15 &euro;"],
        ["<b>Application Rate</b>", "&gt; 3%"],
        ["<b>CTR Ads</b>", "&gt; 1.5%"],
        ["<b>Video View Rate</b>", "&gt; 25%"],
    ])

    b += '<h2>03 Visuelle Richtlinien</h2>'
    b += '<h3>Farbpalette</h3>'
    b += tbl(["Farbe", "Hex-Code", "Verwendung"], [
        ["<b>Primary (Dark Navy)</b>", "#1A1A2E", "Headlines, Hintergr&uuml;nde"],
        ["<b>Accent (Indigo)</b>", "#4F46E5", "Links, Highlights"],
        ["<b>CTA (Gr&uuml;n)</b>", "#10B981", "Buttons, positive Elemente"],
        ["<b>Warm (Amber)</b>", "#F59E0B", "Akzente, Warnungen"],
        ["<b>Light BG</b>", "#F8FAFC", "Helle Fl&auml;chen"],
        ["<b>Alert (Rot)</b>", "#EF4444", "Fehler, dringende Hinweise"],
    ])
    b += '<h3>Typografie</h3>'
    b += tbl(["Element", "Schrift", "Gr&ouml;&szlig;e", "Gewicht"], [
        ["Headlines", "Inter / SF Pro", "24&ndash;32px", "Bold (700)"],
        ["Subheadlines", "Inter / SF Pro", "18&ndash;20px", "Semibold (600)"],
        ["Body Text", "Inter / SF Pro", "14&ndash;16px", "Regular (400)"],
        ["CTA Buttons", "Inter / SF Pro", "16px", "Bold (700)"],
        ["Captions", "Inter / SF Pro", "12px", "Medium (500)"],
    ])
    b += '<h3>Bildsprache</h3>'
    b += '<p><b>Grundprinzip:</b> Authentisch, nicht gestellt. Echte Arbeitsumgebungen, diverse Personen, warme Farbgebung.</p>'
    b += '<p><b>Do:</b> Echte Home-Offices mit Pers&ouml;nlichkeit, nat&uuml;rliches Licht, diverse Menschen, Code auf Screens (realistisch), entspannte K&ouml;rpersprache, Kaffeetassen, Pflanzen, B&uuml;cher.</p>'
    b += '<p><b>Don&rsquo;t:</b> Stock-Fotos mit falschem L&auml;cheln, sterile B&uuml;roumgebungen, nur m&auml;nnliche/wei&szlig;e Personen, &uuml;bertriebenes Tech-Startup-Klischee, dunkle/kalte &Auml;sthetik.</p>'

    b += '<h2>04 Format-Spezifikationen</h2>'
    b += tbl(["Format", "Plattform", "Ma&szlig;e", "Seitenverh&auml;ltnis", "Max. Textanteil"], [
        ["<b>Feed Post</b>", "Facebook + Instagram", "1080 &times; 1080 px", "1:1", "20%"],
        ["<b>Story / Reel</b>", "Instagram + Facebook", "1080 &times; 1920 px", "9:16", "15%"],
        ["<b>Carousel Card</b>", "Facebook + Instagram", "1080 &times; 1080 px", "1:1", "25%"],
        ["<b>Video</b>", "Alle Plattformen", "1080 &times; 1920 + 1080 &times; 1080", "9:16 + 1:1", "&mdash;"],
        ["<b>LinkedIn Post</b>", "LinkedIn", "1200 &times; 627 px", "1.91:1", "20%"],
        ["<b>OG Image</b>", "Landingpage", "1200 &times; 630 px", "1.91:1", "30%"],
    ])

    b += '<h2>05 Moodboard-Beschreibungen</h2>'
    for i, (title, desc) in enumerate([
        ("Developer im Flow", "MacBook auf Holztisch, Sonnenlicht durch Fenster, VS Code auf Screen, Kaffeetasse und Pflanze im Hintergrund. Warme Farbtemperatur."),
        ("Remote Team-Call", "Laptop-Screen mit 6 l&auml;chelnden Gesichtern im Video-Call. Diverse Personen, lockere Atmosph&auml;re, einer h&auml;lt Kaffeetasse hoch."),
        ("Code in Aktion", "Close-Up: H&auml;nde auf Tastatur, TypeScript-Code auf dunklem Editor, Terminal mit gr&uuml;nen Tests. Technisch, authentisch."),
        ("Team-Retreat", "Gruppe von 8-10 Personen drau&szlig;en an einem Tisch, Laptops und Whiteboards, mediterranes Setting. Hack-Week Stimmung."),
        ("Work-Life-Balance", "Developer mit Laptop auf Balkon, Stadt im Hintergrund, sp&auml;tes Nachmittagslicht. Entspannt, produktiv, frei."),
    ], 1):
        b += f'<p><b>Mood {i}: {title}</b><br><i>{desc}</i></p>'

    b += '<h2>06 Do&rsquo;s &amp; Don&rsquo;ts</h2>'
    b += tbl(["Do", "Don&rsquo;t"], [
        ["Logo dezent unten rechts platzieren", "Logo als dominantes Element"],
        ["Maximal 3 Farben pro Asset", "Regenbogen-Farbpalette"],
        ["CTA-Button in Gr&uuml;n (#10B981)", "Rote oder aggressive CTA-Farben"],
        ["Klare Hierarchie: Hook &rarr; Body &rarr; CTA", "Alle Infos gleichzeitig zeigen"],
        ["Untertitel in Videos (80% schauen stumm)", "Videos ohne Untertitel"],
        ["Echte Mitarbeiterfotos wenn m&ouml;glich", "Generische Stock-Fotos"],
    ])
    return "Creative Briefing | NOVACODE Recruiting", wrap(b)


def doc_06():
    b = '<h1>#06 Marken-Richtlinien</h1>'
    b += '<p><i>Employer Brand Narrative &middot; Kommunikationsregeln &middot; Sprachstil</i></p>'

    b += '<h2>01 Brand Story</h2>'
    b += '<p><b>Origin:</b> NOVACODE wurde 2019 gegr&uuml;ndet, weil die Founder selbst frustriert waren &mdash; frustriert von Legacy-Code, endlosen Meeting-Ketten und der Illusion von &laquo;Agilit&auml;t&raquo; in Konzernen. Die Idee war einfach: Was w&auml;re, wenn man eine Software-Firma baut, bei der Engineers wirklich wie Engineers arbeiten k&ouml;nnen?</p>'
    b += '<p><b>Herausforderung:</b> Remote-First war 2019 noch nicht hip. &laquo;Wie stellt ihr sicher, dass Leute wirklich arbeiten?&raquo; war die h&auml;ufigste Frage von Investoren. Die Antwort: Durch Vertrauen, Ownership und Ergebnisse statt Anwesenheit.</p>'
    b += '<p><b>Heute:</b> 35 Engineers, 8 L&auml;nder, 4.2M ARR und ein Team, das morgens gerne den Laptop aufklappt. Profitabel seit 2021, ohne VC-Druck, mit dem Ziel nachhaltig zu wachsen.</p>'
    b += '<p><b>Elevator Pitch (30 Sek.):</b> &laquo;NOVACODE ist ein profitables Remote-First Tech-Unternehmen mit 35 Engineers. Wir bauen Enterprise-SaaS mit React, Node.js und Kubernetes &mdash; und bieten Senior Developern, was gro&szlig;e Firmen nicht k&ouml;nnen: echte Ownership, modernen Stack, 4-Tage-Woche Option und ein Team, das technische Exzellenz lebt.&raquo;</p>'

    b += '<h2>02 Kommunikations-Do&rsquo;s &amp; Don&rsquo;ts</h2>'
    b += tbl(["Do &mdash; So kommunizieren wir", "Don&rsquo;t &mdash; Das vermeiden wir"], [
        ["Konkrete Zahlen: &laquo;35 Engineers, 4.2M ARR&raquo;", "Vage Aussagen: &laquo;Wir wachsen stark&raquo;"],
        ["Echte Zitate von Teammitgliedern", "Erfundene oder gesch&ouml;nte Testimonials"],
        ["Pain Points der Zielgruppe ansprechen", "Nur &uuml;ber uns selbst reden"],
        ["Tech-Details nennen: &laquo;React 19, K8s auf AWS&raquo;", "Generisch: &laquo;Modernste Technologien&raquo;"],
        ["Ehrlich &uuml;ber Herausforderungen sein", "Alles als perfekt darstellen"],
        ["Per Du, lockerer Ton", "Siezen, Corporate-Sprache"],
        ["Benefits mit Kontext: &laquo;4-Tage-Woche bei gleichem Gehalt&raquo;", "Benefits ohne Erkl&auml;rung listen"],
        ["Diversit&auml;t zeigen (Fotos, Sprache)", "Nur eine Perspektive zeigen"],
        ["CTA mit konkretem Zeitversprechen", "Vage CTAs: &laquo;Kontaktiere uns&raquo;"],
        ["Differenzierung: Was unterscheidet uns?", "Me-too: &laquo;Auch wir bieten Home-Office&raquo;"],
    ])

    b += '<h2>03 Sprachliche Richtlinien</h2>'
    b += tbl(["Regel", "Detail", "Beispiel"], [
        ["<b>Ansprache</b>", "Du (nicht Sie)", "&laquo;Bewirb dich jetzt&raquo; statt &laquo;Bewerben Sie sich&raquo;"],
        ["<b>Gendern</b>", "Neutralisieren oder Doppelnennung", "&laquo;Engineers&raquo; statt &laquo;Entwickler/innen&raquo;"],
        ["<b>Tech-Begriffe</b>", "Englisch belassen", "React, Kubernetes, CI/CD, Sprint"],
        ["<b>Marketing-Begriffe</b>", "Englisch belassen", "Hook, Angle, CTA, Targeting, Funnel"],
        ["<b>Satzl&auml;nge</b>", "Max. 20 W&ouml;rter f&uuml;r Kernbotschaften", "Kurz. Klar. Konkret."],
        ["<b>Aktiv statt Passiv</b>", "Handlungsorientiert formulieren", "&laquo;Du baust&raquo; statt &laquo;Es wird gebaut&raquo;"],
    ])

    b += '<h2>04 Narrative Bausteine</h2>'
    b += tbl(["Thema", "Ready-to-Use Textbaustein"], [
        ["<b>Remote-Kultur</b>", "&laquo;Bei NOVACODE ist Remote kein Benefit &mdash; es ist unser Standard. Seit 2019. 35 Engineers, 8 L&auml;nder, null B&uuml;ropflicht.&raquo;"],
        ["<b>Tech-Stack</b>", "&laquo;React 19, TypeScript, Node.js, Go, Kubernetes auf AWS. Merge to Prod in unter 15 Minuten. Kein Legacy, kein jQuery, kein Frust.&raquo;"],
        ["<b>4-Tage-Woche</b>", "&laquo;Gleiches Gehalt, ein Tag mehr f&uuml;rs Leben. 40% unserer Engineers nutzen die 4-Tage-Woche bereits.&raquo;"],
        ["<b>Ownership</b>", "&laquo;Bei uns deployst du deinen eigenen Code. Keine Ticket-Shuffler, keine Feature-Friedh&ouml;fe. Du baust es, du ownst es.&raquo;"],
        ["<b>Team</b>", "&laquo;35 Engineers mit durchschnittlich 6 Jahren Erfahrung. Wir stellen nur ein, wenn alle im Team Ja sagen.&raquo;"],
    ])

    b += '<h2>05 Testimonial-Vorlagen</h2>'
    b += '<p><b>Template A &mdash; Vorher/Nachher:</b></p>'
    b += '<p>&laquo;Vor NOVACODE war ich bei [Firma], einem [Typ] mit [Problem]. Der Unterschied: Bei NOVACODE [konkreter Benefit]. Das Beste? [Emotionaler Benefit].&raquo;</p>'
    b += '<p><i>Beispiel: &laquo;Vor NOVACODE war ich bei einem Konzern mit Java 8 und w&ouml;chentlichen Status-Meetings. Der Unterschied: Bei NOVACODE deploye ich meinen Code am selben Tag. Das Beste? Freitags habe ich frei.&raquo;</i></p>'
    b += '<p><b>Template B &mdash; Typischer Tag:</b></p>'
    b += '<p>&laquo;Mein typischer Tag bei NOVACODE: [Morgenroutine]. Dann [Kernarbeit]. Was ich am meisten sch&auml;tze: [Key Benefit].&raquo;</p>'
    b += '<p><i>Beispiel: &laquo;Mein typischer Tag: Kaffee, Standup um 9:30 (15 Min), dann 4 Stunden Deep Work an unserem Recommendation-Engine. Was ich am meisten sch&auml;tze: Kein Meeting-Marathon, kein Micromanagement.&raquo;</i></p>'
    return "Marken-Richtlinien | NOVACODE Recruiting", wrap(b)


def doc_07():
    b = '<h1>#07 Landingpage-Texte</h1>'
    b += '<p><i>Hero &middot; Benefits &middot; Team &middot; Testimonials &middot; CTA &middot; FAQ</i></p>'

    b += '<h2>01 Hero Section &mdash; 3 Varianten</h2>'
    b += '<h3>Variante A &mdash; Problem-Hook</h3>'
    b += '<p><b>Headline:</b> Dein Code verdient einen besseren Tech-Stack.</p>'
    b += '<p>Bei NOVACODE entwickelst du mit React, Node.js und Kubernetes &mdash; 100% remote, mit echtem Ownership und Option auf 4-Tage-Woche.</p>'
    b += '<p><i>Trust: 100% Remote &middot; React &amp; Node.js &middot; 4-Tage-Woche Option</i></p>'
    b += '<p><b>CTA:</b> Jetzt in 2 Minuten bewerben</p>'

    b += '<h3>Variante B &mdash; Benefit-First</h3>'
    b += '<p><b>Headline:</b> Remote, modern, fair &mdash; so sollte Entwicklung sein.</p>'
    b += '<p>35 Engineers, moderner Stack, flache Hierarchien. Wir suchen Senior Developer, die wieder mit Freude coden wollen.</p>'
    b += '<p><i>Trust: 35 Engineers &middot; 8 L&auml;nder &middot; Profitabel seit 2021</i></p>'
    b += '<p><b>CTA:</b> Jetzt in 2 Minuten bewerben</p>'

    b += '<h3>Variante C &mdash; Provokant</h3>'
    b += '<p><b>Headline:</b> Senior Developer gesucht. Legacy-Code nicht.</p>'
    b += '<p>TypeScript, Kubernetes, Merge-to-Prod in 15 Minuten. Kein jQuery, kein Java 8, kein Zur&uuml;ck.</p>'
    b += '<p><i>Trust: Moderner Stack &middot; Kein Legacy &middot; Kein Bullshit</i></p>'
    b += '<p><b>CTA:</b> Jetzt in 2 Minuten bewerben</p>'

    b += '<h2>02 Problem-Section: &laquo;Kennst du das?&raquo;</h2>'
    for pain, detail in [
        ("Legacy-Code ohne Ende.", "Du verbringst mehr Zeit mit Workarounds als mit echten Features. Jedes Refactoring wird abgelehnt, weil &laquo;keine Zeit&raquo;."),
        ("Meetings, die niemand braucht.", "3 Stunden Statusupdates am Morgen, nachmittags keine Energie mehr f&uuml;r Code. Dein Kalender bestimmt deinen Tag."),
        ("Micromanagement statt Ownership.", "Architekturentscheidungen trifft das Management. Du bist Ausf&uuml;hrender, nicht Gestalter."),
        ("Return-to-Office.", "Hybrid hei&szlig;t: 3 Tage B&uuml;ro, 2 Tage &laquo;darfst du&raquo; remote. Flexibilit&auml;t sieht anders aus."),
    ]:
        b += f'<p><b>{pain}</b> {detail}</p>'

    b += '<h2>03 Benefits</h2>'
    b += tbl(["Benefit", "Detail"], [
        ["<b>Moderner Tech-Stack</b>", "React 19, TypeScript, Node.js, Go, Kubernetes auf AWS. Merge to Prod in &lt; 15 Min."],
        ["<b>100% Remote-First</b>", "Seit 2019. Kein Hybrid, kein &laquo;2 Tage darfst du&raquo;. Arbeite von wo du willst."],
        ["<b>4-Tage-Woche Option</b>", "Gleiches Gehalt, komprimierte Woche. 40% unseres Teams nutzt es bereits."],
        ["<b>Weiterbildung &amp; Konferenzen</b>", "3.000 &euro;/Jahr Weiterbildungsbudget + 2 Konferenzen deiner Wahl."],
        ["<b>Open Source Time</b>", "4 Stunden pro Woche f&uuml;r Open-Source-Contributions w&auml;hrend der Arbeitszeit."],
        ["<b>Echte Ownership</b>", "Du ownst deine Features End-to-End. Kein Ticket-Shuffling, kein Feature-Friedhof."],
    ])

    b += '<h2>04 Team-Section</h2>'
    b += tbl(["Kennzahl", "Wert"], [
        ["<b>Engineers</b>", "35"],
        ["<b>L&auml;nder</b>", "8"],
        ["<b>Empfehlungsrate</b>", "96%"],
        ["<b>&Oslash; Erfahrung</b>", "6 Jahre"],
    ])

    b += '<h2>05 Testimonials</h2>'
    b += '<p><b>&laquo;Seit ich bei NOVACODE bin, code ich wieder mit Freude. Kein Legacy, keine sinnlosen Meetings, und freitags hab ich frei.&raquo;</b><br>&mdash; Lisa M., Senior Backend Developer, seit 2023</p>'
    b += '<p><b>&laquo;Von Konzern zu NOVACODE war der beste Move. Hier entscheide ich die Architektur, nicht ein Manager der seit 10 Jahren keinen Code geschrieben hat.&raquo;</b><br>&mdash; Jan K., Lead Frontend Engineer, seit 2022</p>'
    b += '<p><b>&laquo;Ich arbeite von Lissabon aus. Morgens surfen, nachmittags deployen. Work-Life-Balance ist hier kein Buzzword.&raquo;</b><br>&mdash; Sarah T., Senior Fullstack Developer, seit 2024</p>'

    b += '<h2>06 Bewerbungsprozess</h2>'
    b += tbl(["Schritt", "Was passiert", "Dauer"], [
        ["<b>1. Kurzbewerbung</b>", "Einfaches Formular, kein Anschreiben n&ouml;tig", "2 Minuten"],
        ["<b>2. Tech-Talk</b>", "Fachgespr&auml;ch mit einem Engineer &mdash; kein HR, kein Whiteboard", "30 Minuten"],
        ["<b>3. Team-Kennenlernen</b>", "Lockeres Gespr&auml;ch mit dem Team, Cultural Fit", "60 Minuten"],
        ["<b>4. Angebot</b>", "Entscheidung und Vertrag innerhalb von 5 Werktagen", "&mdash;"],
    ])

    b += '<h2>07 FAQ</h2>'
    b += tbl(["Frage", "Antwort"], [
        ["<b>Muss ich ein Anschreiben schicken?</b>", "Nein. Nur Name, E-Mail, Stack und optional LinkedIn/GitHub."],
        ["<b>Wie l&auml;uft der Tech-Talk ab?</b>", "Ein Gespr&auml;ch unter Engineers. Wir diskutieren Architektur, Stack-Entscheidungen, Projekte. Kein Whiteboard, keine Trick-Fragen."],
        ["<b>Ist die 4-Tage-Woche wirklich bei gleichem Gehalt?</b>", "Ja. 100%. Du arbeitest komprimiert Mo&ndash;Do, gleiches Gehalt."],
        ["<b>Wie Remote ist &laquo;100% Remote&raquo;?</b>", "Wir haben kein B&uuml;ro (au&szlig;er einen Co-Working-Space in K&ouml;ln). 35 Engineers in 8 L&auml;ndern."],
        ["<b>Welches Gehalt kann ich erwarten?</b>", "75.000&ndash;95.000 &euro; f&uuml;r Senior Developer, abh&auml;ngig von Erfahrung. Plus VSOP-Beteiligung."],
    ])

    b += '<h2>08 Final CTA</h2>'
    b += '<p><b>Bereit f&uuml;r den n&auml;chsten Schritt?</b></p>'
    b += '<p>Kein Anschreiben n&ouml;tig. Wir melden uns innerhalb von 48 Stunden.</p>'
    b += '<p><b>&rarr; Jetzt in 2 Minuten bewerben</b></p>'
    return "Landingpage-Texte | NOVACODE Recruiting", wrap(b)


def doc_08():
    b = '<h1>#08 Formularseite-Texte</h1>'
    b += '<p><i>Labels &middot; Placeholders &middot; Validierung &middot; Microcopy &middot; Datenschutz</i></p>'

    b += '<h2>01 Seiten-Header</h2>'
    b += '<p><b>Headline:</b> Fast geschafft &mdash; erz&auml;hl uns kurz von dir.</p>'
    b += '<p>Dauert nur 2 Minuten. Kein Anschreiben n&ouml;tig.</p>'
    b += '<p><i>Deine Daten sind sicher. Wir melden uns innerhalb von 48h.</i></p>'

    b += '<h2>02 Formularfeld-Spezifikation</h2>'
    b += tbl(["Feld", "Label", "Placeholder", "Hilfetext", "Pflicht"], [
        ["Vorname", "Vorname", "Max", "&mdash;", "Ja"],
        ["Nachname", "Nachname", "Mustermann", "&mdash;", "Ja"],
        ["E-Mail", "E-Mail-Adresse", "max@beispiel.de", "Hier erh&auml;ltst du Updates zum Status", "Ja"],
        ["Telefon", "Telefonnummer", "+49 171 ...", "F&uuml;r R&uuml;ckfragen &mdash; kein Spam, versprochen", "Nein"],
        ["Aktuelle Rolle", "Deine aktuelle Rolle", "z.B. Senior Frontend Developer", "&mdash;", "Ja"],
        ["Erfahrung", "Jahre Berufserfahrung", "Dropdown: 3&ndash;5 / 5&ndash;8 / 8&ndash;10 / 10+", "&mdash;", "Ja"],
        ["Tech-Stack", "Dein Tech-Stack", "z.B. React, TypeScript, Node.js", "Was nutzt du am liebsten?", "Ja"],
        ["Motivation", "Was reizt dich an NOVACODE?", "Erz&auml;hl uns in 2&ndash;3 S&auml;tzen...", "Kein Roman n&ouml;tig", "Nein"],
        ["LinkedIn/GitHub", "LinkedIn oder GitHub", "https://...", "Hilft uns, dich besser kennenzulernen", "Nein"],
        ["Gehaltsvorstellung", "Gehaltsvorstellung", "Dropdown: 65&ndash;75k / 75&ndash;85k / 85&ndash;95k / 95k+", "Orientierung, kein Commitment", "Nein"],
        ["Starttermin", "Fr&uuml;hester Starttermin", "Dropdown: Sofort / 1&ndash;3 Mon. / 3&ndash;6 Mon.", "&mdash;", "Ja"],
    ])

    b += '<h2>03 Validierungs-Nachrichten</h2>'
    b += tbl(["Feld", "Fehlerfall", "Fehlermeldung"], [
        ["E-Mail", "Ung&uuml;ltiges Format", "Bitte gib eine g&uuml;ltige E-Mail-Adresse ein."],
        ["Pflichtfeld", "Leer gelassen", "Dieses Feld ist erforderlich."],
        ["Tech-Stack", "Zu kurz (&lt; 3 Zeichen)", "Nenn uns mindestens eine Technologie."],
        ["LinkedIn/GitHub", "Ung&uuml;ltige URL", "Bitte gib eine g&uuml;ltige URL ein (https://...)."],
    ])

    b += '<h2>04 Datenschutz &amp; CTA</h2>'
    b += '<p><b>Checkbox-Label:</b> &laquo;Ich stimme der Verarbeitung meiner Daten gem&auml;&szlig; der Datenschutzerkl&auml;rung zu.&raquo;</p>'
    b += '<p><b>Info-Text:</b> &laquo;Deine Daten werden ausschlie&szlig;lich f&uuml;r den Bewerbungsprozess genutzt und nach 6 Monaten gel&ouml;scht. Keine Weitergabe an Dritte.&raquo;</p>'
    b += '<p><b>CTA-Button:</b> &laquo;Jetzt bewerben&raquo;</p>'
    b += '<p><b>Below-Button:</b> &laquo;Wir melden uns innerhalb von 48 Stunden bei dir.&raquo;</p>'
    return "Formularseite-Texte | NOVACODE Recruiting", wrap(b)


def doc_09():
    b = '<h1>#09 Dankeseite-Texte</h1>'
    b += '<p><i>Best&auml;tigung &middot; N&auml;chste Schritte &middot; Social Proof &middot; Follow-Up</i></p>'

    b += '<h2>01 Best&auml;tigungsnachricht</h2>'
    b += '<p><b>Danke, [Vorname]! Deine Bewerbung ist bei uns.</b></p>'
    b += '<p>Wir freuen uns, von dir zu h&ouml;ren. Unser Team schaut sich deine Bewerbung an und meldet sich innerhalb von 48 Stunden bei dir.</p>'

    b += '<h2>02 N&auml;chste Schritte</h2>'
    b += tbl(["Schritt", "Was passiert", "Wann"], [
        ["<b>1. Bewerbung pr&uuml;fen</b>", "Unser Engineering-Team (nicht HR!) schaut sich dein Profil an", "Innerhalb von 48h"],
        ["<b>2. Tech-Talk</b>", "30 Min remote via Google Meet &mdash; ein Gespr&auml;ch unter Engineers", "Tag 3&ndash;5"],
        ["<b>3. Team-Kennenlernen</b>", "60 Min lockeres Gespr&auml;ch mit 2&ndash;3 Teammitgliedern", "Tag 5&ndash;8"],
        ["<b>4. Angebot</b>", "Vertrag und alle Details innerhalb von 5 Werktagen", "Tag 8&ndash;10"],
    ])
    b += '<p><b>Was dich erwartet:</b> Kein Whiteboard-Coding. Keine Trick-Fragen. Kein Assessment-Center. Ein echtes Gespr&auml;ch unter Developern &uuml;ber Architektur, Stack-Entscheidungen und was dich antreibt.</p>'

    b += '<h2>03 Social Proof</h2>'
    b += '<p><b>&laquo;Vom ersten Kontakt bis zum Angebot hat es 8 Tage gedauert. So schnell und unkompliziert war noch kein Bewerbungsprozess.&raquo;</b><br>&mdash; Lisa M., Senior Backend Developer</p>'
    b += tbl(["Kennzahl", "Wert"], [
        ["<b>Erste R&uuml;ckmeldung</b>", "48h"],
        ["<b>&Oslash; Time-to-Offer</b>", "10 Tage"],
        ["<b>Angebotsannahme</b>", "92%"],
    ])

    b += '<h2>04 Sekund&auml;re CTAs</h2>'
    b += '<p><b>Referral:</b> &laquo;Kennst du jemanden, f&uuml;r den NOVACODE auch passen k&ouml;nnte? Teile diesen Link: [URL]&raquo;</p>'
    b += '<p><b>Social:</b> &laquo;Folge uns auf LinkedIn f&uuml;r Einblicke in unseren Engineering-Alltag.&raquo;</p>'
    b += '<p><b>Kontakt:</b> &laquo;Fragen? Schreib uns: jobs@novacode.de &mdash; Dein Ansprechpartner: Sarah M&uuml;ller, People &amp; Culture&raquo;</p>'
    return "Dankeseite-Texte | NOVACODE Recruiting", wrap(b)


def doc_10():
    LP = 'https://demo-recruiting.vercel.app/demo-landing/'
    FORM = 'https://demo-recruiting.vercel.app/demo-formular'
    sep = '<br><hr style="border:none;border-top:2px solid #e0e0e0;margin:24px 0"><br>'
    section_sep = '<br><hr style="border:none;border-top:4px solid #1a1a1a;margin:36px 0"><br>'

    b = '<h1>Anzeigentexte &mdash; NOVACODE Recruiting</h1>'
    b += '<p><i>Hauptkampagne &middot; Retargeting &middot; Warmup &mdash; 9 Varianten f&uuml;r Facebook &amp; Instagram</i></p>'

    b += tbl(["Kampagne", "Zielgruppe", "Varianten", "CTA", "Ziel-URL"], [
        ["<b>Hauptkampagne</b>", "Kalte Audience &mdash; noch kein Kontakt", "3", "Jetzt bewerben", f'<a href="{LP}">Landingpage</a>'],
        ["<b>Retargeting</b>", "LP-Besucher ohne Bewerbung", "3", "Jetzt bewerben", f'<a href="{FORM}">Bewerbungsformular</a>'],
        ["<b>Warmup</b>", "Kalte Audience &mdash; Awareness", "3", "Mehr erfahren", f'<a href="{LP}">Landingpage</a>'],
    ])

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # HAUPTKAMPAGNE
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    b += section_sep
    b += '<h1>Hauptkampagne</h1>'
    b += '<p><i>Cold Audience &middot; Conversion-Ziel: Bewerbung &middot; Budget: 30 &euro;/Tag</i></p>'

    # Variante 1 — Klassisch / Strukturiert
    b += '<h2>Variante 1 &mdash; Klassisch / Strukturiert</h2>'
    b += '<p>NOVACODE Solutions sucht: Senior Fullstack Developer (m/w/d) &ndash; D&uuml;sseldorf / Hybrid</p>'
    b += '<p>Du willst wieder entwickeln.<br>Nicht nur Tickets schieben.</p>'
    b += '<p>Dann lies weiter.</p>'
    b += '<p>Wir sind NOVACODE.<br>19 Leute.<br>Ein Softwareunternehmen aus D&uuml;sseldorf.</p>'
    b += '<p>Wir bauen individuelle L&ouml;sungen f&uuml;r den Mittelstand.<br>Keine Agentur.<br>Kein Bauchladen.<br>Echtes Product Engineering.</p>'
    b += '<p><b>Dein Stack:</b><br>React. TypeScript. Node.js. PostgreSQL. AWS. Docker. GitHub Actions.</p>'
    b += '<p><b>Dein Arbeitsmodell:</b><br>2 Tage B&uuml;ro in D&uuml;sseldorf.<br>3 Tage remote.<br>Kernzeit: 10&ndash;15 Uhr.</p>'
    b += '<p><b>Das bieten wir dir:</b></p><ul>'
    b += '<li>65.000&ndash;85.000 &euro; Jahresgehalt.</li>'
    b += '<li>30 Urlaubstage.</li>'
    b += '<li>3.000 &euro; Weiterbildungsbudget pro Jahr.</li>'
    b += '<li>Hardware deiner Wahl.</li>'
    b += '<li>Eigene Projektverantwortung.</li>'
    b += '<li>Direkter Kundenkontakt.</li></ul>'
    b += '<p><b>Das bringst du mit:</b></p><ul>'
    b += '<li>Mindestens 4 Jahre Erfahrung als Fullstack Developer.</li>'
    b += '<li>Sicher in React, Node.js und TypeScript.</li>'
    b += '<li>Architekturverst&auml;ndnis und eigenst&auml;ndige Arbeitsweise.</li>'
    b += '<li>Flie&szlig;end Deutsch.</li></ul>'
    b += '<p><b>Unser Bewerbungsprozess:</b><br>20 Minuten Kennenlernen.<br>Tech-Gespr&auml;ch mit einem Senior Dev.<br>Entscheidung in 14 Tagen.</p>'
    b += '<p>Kein Anschreiben.<br>Kein 6-Stunden-Coding-Test.</p>'
    b += '<p>6 Jahre am Markt. Bootstrapped. Profitabel. Kein Startup-Chaos.</p>'
    b += '<p>Die Bewerbung dauert unter 3 Minuten.</p>'
    b += f'<p><b>&rarr; <a href="{LP}">Jetzt bewerben</a></b></p>'

    b += sep

    # Variante 2 — Schmerzpunkt / Emotional
    b += '<h2>Variante 2 &mdash; Schmerzpunkt / Emotional</h2>'
    b += '<p>Du bist Entwickler.<br>Du bist verdammt gut in dem, was du tust.</p>'
    b += '<p>Aber jetzt mal ehrlich:</p>'
    b += '<p>Wann hast du das letzte Mal ein Feature gebaut, das wirklich live gegangen ist?</p>'
    b += '<p>Wann hast du das letzte Mal eine Architekturentscheidung selbst getroffen &ndash; ohne dass ein Manager sie zerredet hat?</p>'
    b += '<p>Wann hast du das letzte Mal das Gef&uuml;hl gehabt, dass du dich weiterentwickelst?</p>'
    b += '<p>Wenn du jetzt &uuml;berlegen musstest, dann wei&szlig;t du, was das bedeutet.</p>'
    b += '<p>Es ist Zeit.</p>'
    b += '<p>Nicht, weil dein Job schlecht ist.<br>Nicht, weil deine Kollegen schlecht sind.</p>'
    b += '<p>Sondern, weil du aufgeh&ouml;rt hast, Entwickler zu sein.</p>'
    b += '<p>Wir sind NOVACODE.</p>'
    b += '<p>Ein Softwareunternehmen aus D&uuml;sseldorf.<br>19 Mitarbeiter.<br>Wir bauen individuelle Software f&uuml;r den Mittelstand.</p>'
    b += '<p>Keine Agentur. Kein Bauchladen. Echtes Engineering.</p>'
    b += '<p>Unser Stack? React. TypeScript. Node.js. PostgreSQL. AWS.</p>'
    b += '<p>Wir suchen einen Senior Fullstack Developer (m/w/d), der wieder coden will.<br>Der wieder entscheiden will.<br>Der wieder deployen will.</p>'
    b += '<p>Was dich erwartet:</p><ul>'
    b += '<li>&#10004;&#65039; Eigene Projektverantwortung ab Tag 1.</li>'
    b += '<li>&#10004;&#65039; Direkter Kundenkontakt &ndash; du bist nicht der Letzte in der Kette.</li>'
    b += '<li>&#10004;&#65039; Moderner Stack, kein Legacy.</li>'
    b += '<li>&#10004;&#65039; Hybrid: 2 Tage B&uuml;ro, 3 Tage remote.</li>'
    b += '<li>&#10004;&#65039; 65.000&ndash;85.000 &euro; Jahresgehalt.</li>'
    b += '<li>&#10004;&#65039; 30 Urlaubstage.</li>'
    b += '<li>&#10004;&#65039; 3.000 &euro; Weiterbildungsbudget pro Jahr.</li>'
    b += '<li>&#10004;&#65039; Hardware deiner Wahl.</li></ul>'
    b += '<p>Kein Coding-Marathon im Bewerbungsprozess.<br>Kein Assessment-Center.<br>Du sprichst direkt mit einem unserer Senior Devs &ndash; auf Augenh&ouml;he.</p>'
    b += '<p>6 Jahre am Markt. Profitabel. Kein VC. Kein Startup-Chaos.</p>'
    b += '<p>Die Bewerbung dauert unter 3 Minuten. Kein Anschreiben n&ouml;tig.</p>'
    b += f'<p><b>&rarr; <a href="{LP}">Jetzt bewerben</a></b></p>'

    b += sep

    # Variante 3 — Contrarian / Pattern Interrupt
    b += '<h2>Variante 3 &mdash; Contrarian / Pattern Interrupt</h2>'
    b += '<p>Diese Anzeige ist nichts f&uuml;r dich.</p>'
    b += '<p>Nicht, wenn du gl&uuml;cklich bist mit endlosen Meetings.<br>Nicht, wenn du okay damit bist, dass deine Features nie live gehen.<br>Nicht, wenn du mit einem Tech-Stack aus 2016 zufrieden bist.</p>'
    b += '<p>Aber wenn du abends denkst: &laquo;Ich will wieder bauen.&raquo;<br>Dann lies weiter.</p>'
    b += '<p>Wir sind NOVACODE.</p>'
    b += '<p>19 Leute. 14 Entwickler. Durchschnittsalter: 32.<br>Wir entwickeln individuelle Software f&uuml;r den Mittelstand.<br>Interne Tools. Prozessautomatisierung. Plattformen.</p>'
    b += '<p>Kein Agentur-Bauchladen.<br>Kein &laquo;Wir machen alles&raquo;.<br>Reines Custom Development.</p>'
    b += '<p>Unser Stack? React. TypeScript. Node.js. Go. PostgreSQL. AWS. Docker. CI/CD via GitHub Actions.</p>'
    b += '<p>Was bei uns anders ist?<br>Du triffst Architekturentscheidungen.<br>Du sprichst direkt mit Kunden.<br>Du deployst Code, der in Produktion l&auml;uft.<br>Nicht Code, der auf dem Feature-Friedhof verrottet.</p>'
    b += '<p>Wir sagen nicht &laquo;flache Hierarchien&raquo;.<br>Wir sagen: 19 Leute. Keine Hierarchie. Punkt.</p>'
    b += '<p>Wir sagen nicht &laquo;Startup-Mentalit&auml;t&raquo;.<br>Wir sagen: 6 Jahre profitabel. Kein VC. Kein Chaos.</p>'
    b += '<p>Wir sagen nicht &laquo;wie eine Familie&raquo;.<br>Wir sagen: Profis, die abliefern. Und um 17 Uhr Feierabend machen.</p>'
    b += '<p>Hybrid: 2 Tage D&uuml;sseldorf. 3 Tage remote. Kernzeit: 10&ndash;15 Uhr.</p>'
    b += '<p>65.000&ndash;85.000 &euro;. 30 Tage Urlaub. 3.000 &euro; Weiterbildungsbudget.</p>'
    b += '<p>Bewerbungsprozess? 20 Minuten Call. Tech-Talk mit einem Engineer. Architektur-Diskussion.</p>'
    b += '<p>Kein Whiteboard. Kein Assessment-Center. Entscheidung in 14 Tagen.</p>'
    b += '<p>Unter 3 Minuten. Kein Anschreiben.</p>'
    b += f'<p><b>&rarr; <a href="{LP}">Jetzt bewerben</a></b></p>'

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # RETARGETING
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    b += section_sep
    b += '<h1>Retargeting</h1>'
    b += '<p><i>Warme Audience &middot; LP-Besucher ohne Bewerbung &middot; Ziel: Bewerbungsformular</i></p>'

    # RT Variante 1
    b += '<h2>Variante 1 &mdash; Direkt / Erinnerung</h2>'
    b += '<p>Du hast dir die Stelle bei NOVACODE angeschaut.<br>Aber du hast dich noch nicht beworben.</p>'
    b += '<p>Warum nicht?</p>'
    b += '<p>Fragst du dich, ob es wirklich passt?</p>'
    b += '<p>Hier sind die Fakten:</p>'
    b += '<p>&#10004;&#65039; Keine langweilige 9-to-5-M&uuml;hle. Flexible Arbeitszeiten, die zu deinem Leben passen.<br>'
    b += '&#10004;&#65039; 100 % Remote oder Hybrid in D&uuml;sseldorf. Du entscheidest.<br>'
    b += '&#10004;&#65039; Ein moderner Tech-Stack. Kein veralteter Kram aus 2015.<br>'
    b += '&#10004;&#65039; Ein Weiterbildungsbudget, das du wirklich nutzen kannst.</p>'
    b += '<p>Und das Beste?</p>'
    b += '<p>Der Bewerbungsprozess dauert nur 60 Sekunden.<br>Kein Anschreiben. Kein Lebenslauf-Upload.</p>'
    b += f'<p><b>&rarr; <a href="{FORM}">Beantworte ein paar Fragen</a></b> und wir melden uns innerhalb von 48 Stunden.</p>'

    b += sep

    # RT Variante 2
    b += '<h2>Variante 2 &mdash; Einwand-Killer</h2>'
    b += '<p>&laquo;Bin ich gut genug?&raquo;</p>'
    b += '<p>Das denken 90 % der Entwickler.<br>Und genau die sind oft die Besten.</p>'
    b += '<p>Bei NOVACODE suchen wir keine Entwickler mit 47 Zertifikaten.<br>Wir suchen echte Macher.</p>'
    b += '<p>Leute, die:<br>'
    b += '&bull; Sauberen Code schreiben wollen &ndash; nicht nur schnellen.<br>'
    b += '&bull; Probleme l&ouml;sen statt nur Tickets abzuarbeiten.<br>'
    b += '&bull; Verantwortung &uuml;bernehmen wollen.</p>'
    b += '<p>Du warst schon auf unserer Seite.<br>Das zeigt, dass du neugierig bist.</p>'
    b += f'<p>Gib deiner Neugier eine Chance.<br><b>&rarr; <a href="{FORM}">60 Sekunden. Kein Risiko.</a></b></p>'

    b += sep

    # RT Variante 3
    b += '<h2>Variante 3 &mdash; Social Proof / Knappheit</h2>'
    b += '<p>Du warst auf unserer Karriereseite.<br>Aber du bist noch unentschlossen?</p>'
    b += '<p>Hier ein Update:</p>'
    b += '<p>In den letzten 2 Wochen haben wir &uuml;ber 40 Bewerbungen erhalten.</p>'
    b += '<p>Was Bewerber am h&auml;ufigsten sagen:<br>'
    b += '&laquo;Endlich mal ein Prozess, der nicht nervt.&raquo;<br>'
    b += '&laquo;Ich wusste nach 2 Minuten, dass ich mich bewerben will.&raquo;</p>'
    b += '<p>NOVACODE ist kein Konzern.<br>Hier bist du nicht Entwickler #847.<br>Hier bist du Teil eines Teams, das zusammen etwas Gro&szlig;es baut.</p>'
    b += f'<p><b>&rarr; <a href="{FORM}">Die Stelle ist noch offen. 60 Sekunden reichen.</a></b></p>'

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # WARMUP
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    b += section_sep
    b += '<h1>Warmup</h1>'
    b += '<p><i>Top-of-Funnel &middot; Awareness &middot; Kalte Zielgruppe &middot; Kein harter CTA</i></p>'

    # WU Variante 1
    b += '<h2>Variante 1 &mdash; Werte / Kultur</h2>'
    b += '<p>Die meisten Unternehmen labern von flachen Hierarchien.<br>Bei NOVACODE gibt es einfach keine.</p>'
    b += '<p>14 Leute. Jeder kennt jeden.<br>Entscheidungen? Fallen in Minuten, nicht in Meetings.</p>'
    b += '<p>Wir bauen Software, die den Mittelstand digitalisiert.<br>Kein Startup-Gehype. Kein Konzern-Geschwafel.<br>Nur echte Ergebnisse mit Profis, die wissen, was sie tun.</p>'
    b += f'<p>Willst du sehen, wie wir arbeiten?<br><b>&rarr; <a href="{LP}">Mehr erfahren</a></b></p>'

    b += sep

    # WU Variante 2
    b += '<h2>Variante 2 &mdash; Storytelling / Behind the Scenes</h2>'
    b += '<p>Freitag, 14:30 Uhr bei NOVACODE:</p>'
    b += '<p>Tim hat sein Feature gerade live gebracht.<br>Lisa checkt den letzten PR vom Sprint.<br>Max? Seit 12 Uhr im Deep Work &ndash; und niemand st&ouml;rt ihn.</p>'
    b += '<p>Um 15 Uhr: Weekly. 20 Minuten. Nicht l&auml;nger.<br>Danach? Wochenende.</p>'
    b += '<p>Kein Crunch. Keine &Uuml;berstunden.<br>Nur Code, auf den du stolz sein kannst.</p>'
    b += '<p>NOVACODE baut digitale L&ouml;sungen f&uuml;r den Mittelstand.<br>Mit einem Team, das Qualit&auml;t &uuml;ber alles stellt.</p>'
    b += f'<p><b>&rarr; <a href="{LP}">Mehr &uuml;ber uns erfahren</a></b></p>'

    b += sep

    # WU Variante 3
    b += '<h2>Variante 3 &mdash; Provokant / Aufmerksamkeit</h2>'
    b += '<p>73 % der Entwickler in Deutschland denken &uuml;ber einen Jobwechsel nach.<br>Aber nur 12 % bewerben sich.</p>'
    b += '<p>Warum? Weil jede Stellenanzeige gleich klingt.<br>&laquo;Dynamisches Team&raquo;, &laquo;spannende Projekte&raquo;, &laquo;attraktives Gehalt&raquo;.</p>'
    b += '<p>Wir bei NOVACODE sagen dir lieber, was wir NICHT bieten:<br>'
    b += '&#10060; Kein Gro&szlig;raumb&uuml;ro<br>'
    b += '&#10060; Keine 5 Interview-Runden<br>'
    b += '&#10060; Keine Legacy-Systeme aus den 2000ern<br>'
    b += '&#10060; Keinen Chef, der st&auml;ndig &laquo;kurz mal schauen&raquo; will</p>'
    b += f'<p>Was wir bieten?<br><b>&rarr; <a href="{LP}">Das findest du hier.</a></b></p>'
    b += '<p>Aber nur, wenn du neugierig genug bist.</p>'

    return "Anzeigentexte | NOVACODE Recruiting", wrap(b)


def doc_11():
    b = '<h1>Anzeigentexte: Retargeting</h1>'
    b += '<p><i>Dieses Dokument wurde in <b>#10 Anzeigentexte</b> zusammengef&uuml;hrt.</i></p>'
    b += '<p>Alle 9 Anzeigenvarianten (Hauptkampagne, Retargeting, Warmup) befinden sich jetzt in einem Dokument.</p>'
    return "Anzeigentexte Retargeting | NOVACODE Recruiting", wrap(b)


def doc_12():
    b = '<h1>Anzeigentexte: Warmup</h1>'
    b += '<p><i>Dieses Dokument wurde in <b>#10 Anzeigentexte</b> zusammengef&uuml;hrt.</i></p>'
    b += '<p>Alle 9 Anzeigenvarianten (Hauptkampagne, Retargeting, Warmup) befinden sich jetzt in einem Dokument.</p>'
    return "Anzeigentexte Warmup | NOVACODE Recruiting", wrap(b)


def doc_13():
    b = '<h1>#13 Videoskript</h1>'
    b += '<p><i>Recruiting-Video &middot; 60 Sekunden &middot; Senior Developer Kampagne</i></p>'

    b += '<h2>01 Video-&Uuml;bersicht</h2>'
    b += tbl(["Parameter", "Detail"], [
        ["<b>L&auml;nge</b>", "60 Sekunden"],
        ["<b>Format</b>", "9:16 (Story/Reel) + 1:1 (Feed)"],
        ["<b>Plattform</b>", "Instagram, Facebook, LinkedIn"],
        ["<b>Ton</b>", "Authentisch, modern, nicht werblich"],
        ["<b>Musik</b>", "Lo-Fi Beat, 85&ndash;95 BPM, dezent"],
        ["<b>Untertitel</b>", "Ja, hartcodiert (80% schauen stumm)"],
    ])

    b += '<h2>02 Skript &mdash; Shot-by-Shot</h2>'
    b += tbl(["Zeitcode", "Sprechertext", "Visual / Szene", "Text-Overlay"], [
        ["<b>0:00&ndash;0:03</b> HOOK", "&laquo;Bist du auch den Legacy-Code leid?&raquo;", "Close-up: Dev starrt auf alten Code, seufzt", "Legacy-Code?"],
        ["<b>0:03&ndash;0:08</b> Problem", "&laquo;Jeden Tag Workarounds. Meetings, die niemand braucht. Micromanagement.&raquo;", "Quick Cuts: Voller Kalender, Manager am Whiteboard, Ticket-Board", "&mdash;"],
        ["<b>0:08&ndash;0:12</b> Transition", "&laquo;Was w&auml;re, wenn das nicht so sein m&uuml;sste?&raquo;", "Screen wird hell, modernes Setup erscheint", "Was w&auml;re, wenn..."],
        ["<b>0:12&ndash;0:25</b> L&ouml;sung", "&laquo;Bei NOVACODE: React, Node.js, Kubernetes. 100% Remote. 4-Tage-Woche. Du ownst deine Features von der Idee bis zum Deploy.&raquo;", "Dev im Home-Office, Code auf Screen, Team-Call, Deploy-Animation", "React &middot; Node &middot; K8s / 100% Remote / 4-Tage-Woche"],
        ["<b>0:25&ndash;0:38</b> Proof", "&laquo;35 Engineers, 8 L&auml;nder, profitabel seit 2021. Kein Startup-Chaos. Keine Konzern-B&uuml;rokratie.&raquo;", "Diverse Team-Gesichter, Hack-Week Impressionen, Dashboard mit Metriken", "35 Engineers / 8 L&auml;nder / 1 Mission"],
        ["<b>0:38&ndash;0:50</b> Benefits", "&laquo;Weiterbildungsbudget, Open-Source-Time, und ein Team, das morgens gerne den Laptop aufklappt.&raquo;", "Schnelle Benefit-Montage: Konferenz, GitHub, Team-Retreat", "Weiterbildung / Open Source / Team-Retreats"],
        ["<b>0:50&ndash;0:60</b> CTA", "&laquo;Senior Developer? Bewirb dich jetzt &mdash; in 2 Minuten.&raquo;", "Logo-Animation, URL eingeblendet, CTA-Button", "novacode.de/jobs &mdash; Jetzt bewerben"],
    ])

    b += '<h2>03 Alternative Hooks (0:00&ndash;0:03)</h2>'
    b += tbl(["Variante", "Hook-Text", "Strategie"], [
        ["<b>A &mdash; Social Proof</b>", "&laquo;92% unserer Devs empfehlen uns weiter.&raquo;", "Zahlen als Thumb-Stop"],
        ["<b>B &mdash; Benefit-First</b>", "&laquo;4-Tage-Woche f&uuml;r Senior Developer. Ja, wirklich.&raquo;", "Sofortige Aufmerksamkeit durch Benefit"],
        ["<b>C &mdash; Humor</b>", "&laquo;Wir suchen keine Rockstar-Ninjas. Nur gute Entwickler.&raquo;", "Anti-Pattern als Identifikation"],
    ])

    b += '<h2>04 Technische Spezifikationen</h2>'
    b += tbl(["Parameter", "Wert"], [
        ["Aufl&ouml;sung", "1080 &times; 1920 px (9:16) + 1080 &times; 1080 px (1:1)"],
        ["Framerate", "30 fps"],
        ["Farbprofil", "Warm, leicht ents&auml;ttigt, keine Neon-Farben"],
        ["Schnittgeschwindigkeit", "2&ndash;3 Sek. pro Shot"],
        ["Untertitel-Stil", "Sans-serif, wei&szlig; auf halbtransparentem Schwarz"],
        ["Untertitel-Limit", "Max. 2 Zeilen, max. 42 Zeichen/Zeile"],
        ["Musik", "Lo-Fi Beat, 85&ndash;95 BPM, Instrumental"],
    ])

    b += '<h2>05 Shot-Liste Zusammenfassung</h2>'
    b += tbl(["Shot #", "Beschreibung", "Dauer", "Setting"], [
        ["1", "Dev starrt auf Legacy-Code", "3 Sek.", "Dunkler Screen, Close-Up Gesicht"],
        ["2", "Kalender voller Meetings", "2 Sek.", "Screen-Recording"],
        ["3", "Manager zeigt auf Whiteboard", "2 Sek.", "B&uuml;ro-Setting"],
        ["4", "Transition: Screen wird hell", "2 Sek.", "&Uuml;berblende"],
        ["5", "Dev im Home-Office, moderner Code", "5 Sek.", "Helles Setup, Pflanzen"],
        ["6", "Team-Call mit lachenden Gesichtern", "4 Sek.", "Laptop-Screen"],
        ["7", "Deploy-Animation / gr&uuml;ne Tests", "3 Sek.", "Terminal-Screen"],
        ["8", "Team-Retreat Impressionen", "5 Sek.", "Outdoor, Laptops, Sonne"],
        ["9", "Benefit-Montage (Quick Cuts)", "5 Sek.", "Diverse Settings"],
        ["10", "Logo + CTA + URL", "4 Sek.", "Clean, Dark Background"],
    ])
    return "Videoskript | NOVACODE Recruiting", wrap(b)


# ── Main ─────────────────────────────────────────────────────────

ALL_DOCS = [
    ("02", doc_02), ("03", doc_03), ("04", doc_04), ("05", doc_05),
    ("06", doc_06), ("07", doc_07), ("08", doc_08), ("09", doc_09),
    ("10", doc_10), ("11", doc_11), ("12", doc_12), ("13", doc_13),
]

if __name__ == "__main__":
    print("=== NOVACODE Docs Update ===\n")
    creds = get_credentials()
    creds = ensure_valid_token(creds)

    updated = 0
    failed = 0
    for i, (num, fn) in enumerate(ALL_DOCS):
        name, html = fn()
        file_id = DOCS[num]
        print(f"[{i+1}/12] {name}")
        result = update_doc(creds["token"], file_id, html)
        if result == "failed":
            creds = refresh_token(creds)
            result = update_doc(creds["token"], file_id, html)
        if result == "updated":
            updated += 1
        else:
            failed += 1
        print(f"    -> {result}")
        time.sleep(0.5)

    print(f"\nDone! {updated} updated, {failed} failed.")
