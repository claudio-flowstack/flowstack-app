# Design System: Dokument-Styling

Dieses Dokument beschreibt das gemeinsame CSS-Design-System, das fuer alle generierten Google Docs verwendet wird. Alle 12 Framework-Dokumente referenzieren dieses Styling.

## CSS-Konstante (STYLE)

Die STYLE-Konstante wird ueber `wrap_html()` in jedes Dokument injiziert.

## Farben

| Token | Hex | RGB | Verwendung |
|-------|-----|-----|------------|
| Primary Dark | `#0a1628` | 10, 22, 40 | Hintergrund, Headlines (h1, h2, h3), Tabellen-Header (th), .tag Background |
| Accent Cyan | `#00e5ff` | 0, 229, 255 | h1 Border-Bottom, h2 Border-Left, Blockquote Border, .highlight Border, .accent Text, .tag Text, CTAs |
| Body Text | `#1a1a2e` | 26, 26, 46 | Standard-Textfarbe (body) |
| Light Background | `#f0fafe` | 240, 250, 254 | Blockquote Background, .highlight Background |
| Table Stripe | `#f8f9fa` | 248, 249, 250 | Gerade Tabellenzeilen (tr:nth-child(even)) |
| Table Border | `#e0e0e0` | 224, 224, 224 | Tabellen-Zellenrand (td), Horizontale Linie (hr) |
| Meta Gray | `#888` | 136, 136, 136 | .meta Texte (Dokumentinfo-Zeile) |
| Blockquote Text | `#333` | 51, 51, 51 | Blockquote Inhalt |
| White | `#FFFFFF` | 255, 255, 255 | Text in Tabellen-Headers (th) |
| Error Red | `#cc0000` | 204, 0, 0 | Verbotene Begriffe, Required-Marker |
| Success Green | `#006600` | 0, 102, 0 | Erlaubte Begriffe, Do's |

## Typografie

| Element | Font Family | Size | Weight | Line Height | Extras |
|---------|-------------|------|--------|-------------|--------|
| body | Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif | default | default | 1.7 | max-width: 800px, margin: 0 auto, padding: 20px |
| h1 | inherit | 28px | 700 | inherit | border-bottom: 3px solid #00e5ff, padding-bottom: 12px, margin-bottom: 24px |
| h2 | inherit | 22px | 700 | inherit | margin-top: 32px, margin-bottom: 16px, border-left: 4px solid #00e5ff, padding-left: 12px |
| h3 | inherit | 18px | 600 | inherit | margin-top: 24px, margin-bottom: 12px |
| th | inherit | 14px | 600 | inherit | background: #0a1628, color: #fff, padding: 10px 14px |
| td | inherit | 14px | default | inherit | padding: 10px 14px, border: 1px solid #e0e0e0 |
| .meta | inherit | 13px | default | inherit | color: #888, margin-bottom: 24px |
| .tag | inherit | 12px | 600 | inherit | inline-block, border-radius: 4px, padding: 2px 10px |
| .accent | inherit | inherit | 600 | inherit | color: #00e5ff |

## Layout-Patterns

### Dokument-Wrapper

```html
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8">{STYLE}</head>
<body>{body_content}</body>
</html>
```

### Dokument-Header (jedes Dokument)

```html
<h1>[Dokumenttitel]</h1>
<p class="meta">[Firmenname] &middot; [Kategorie] &middot; [Unterkategorie]</p>
```

### Section-Pattern

```html
<h2>[Section-Titel]</h2>
[Inhalt: Tabelle, Liste, Cards, Freitext]
<hr>
```

Sections werden durch `<hr>` (horizontale Linie) getrennt. Jede Section beginnt mit `<h2>`.

### Tabelle (Daten)

```html
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Spalte 1</th><th>Spalte 2</th></tr>
  <tr><td><strong>Label</strong></td><td>Wert</td></tr>
</table>
```

Labels in der ersten Spalte sind typischerweise `<strong>`.

### Highlight-Box (Kernaussagen, CTAs)

```html
<div class="highlight">
  <strong style="font-size:18px; color:#0a1628;">[Kernaussage]</strong><br><br>
  [Erlaeuterung]
</div>
```

### Blockquote (Zitate, Pain Points)

```html
<blockquote>&bdquo;[Zitat]&ldquo; -- <strong>[Label]</strong></blockquote>
```

### Ungeordnete Liste

```html
<ul>
  <li><strong>[Label]:</strong> [Beschreibung]</li>
</ul>
```

### Geordnete Liste

```html
<ol>
  <li><strong>[Label]</strong> -- [Beschreibung]</li>
</ol>
```

### Tag/Badge

```html
<span class="tag">[Label]</span>
```

### Do's / Don'ts Listen

```html
<!-- Do's (gruen) -->
<li style="color:#006600;">&#10004; [Erlaubtes Verhalten]</li>

<!-- Don'ts (rot) -->
<li style="color:#cc0000;">&#10060; [Verbotenes Verhalten]</li>
```

## HTML-Entity-Konventionen

| Entity | Zeichen | Verwendung |
|--------|---------|------------|
| `&bdquo;` | unteres Anfuehrungszeichen | Deutsche Zitate oeffnen |
| `&ldquo;` | oberes Anfuehrungszeichen | Deutsche Zitate schliessen |
| `&middot;` | Mittelpunkt | Trenner in Meta-Zeilen |
| `&rarr;` | Pfeil rechts | Aufzaehlungen, Flows |
| `&times;` | Multiplikationszeichen | Groessenangaben (1080 x 1080) |
| `&#10003;` | Haekchen | Positive Aufzaehlungen |
| `&#10060;` | Kreuz | Negative Aufzaehlungen / Don'ts |
| `&#9654;` | Play-Dreieck | CTA-Buttons |
| `&#8592;` | Pfeil links | Zurueck-Links |

## Inline-Style-Overrides (haeufig genutzt)

```css
/* Grosse Headlines in Sections */
font-size: 24px; font-weight: 700; color: #0a1628;

/* CTA-Style */
color: #00e5ff; font-weight: 600;

/* Farbswatch in Tabellen */
display: inline-block; width: 20px; height: 20px; background: [HEX];
border: 1px solid #ccc; vertical-align: middle; margin-right: 8px;

/* Schritte/Nummern */
text-align: center; font-size: 20px; font-weight: 700; color: #00e5ff;
```
