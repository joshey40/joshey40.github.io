# Wildshape-Kompass

Eine kleine, frameworkfreie GitHub-Pages-Webapp zum Durchsuchen von D&D-2024-Wildshape-Formen. Sie läuft vollständig im Browser und benötigt kein Backend.

## Lokal starten

Da JavaScript-Module nicht zuverlässig über `file://` laufen, den Projektordner mit einem beliebigen lokalen Webserver öffnen, zum Beispiel über die Vorschau-Erweiterung deines Editors. Anschließend `index.html` im Browser aufrufen.

## Struktur

```
index.html              Einstiegspunkt
styles/main.css         Darstellung
src/config.js           Mock-/API-Umschalter und spätere API-Adresse
src/models/beast.js     App-eigenes Datenmodell und API-Normalisierung
src/data/               Mock-Daten und Datenzugriff
src/domain/wildshape.js Wildshape-Regelhelfer
src/ui/                 Render-Funktionen für Liste und Detailansicht
src/main.js             App-Zustand, Filter und Zusammensetzen der UI
```

## Datenquelle

Standardmäßig lädt die App alle 91 SRD-2024-Beasts von Open5e. Die API liefert 50 Ergebnisse pro Seite; `src/data/beast-repository.js` folgt automatisch dem `next`-Link und fasst beide Seiten zusammen.

Für die fiktiven Entwicklungsdaten in `src/data/mock-beasts.js` in `src/config.js` `USE_MOCK_DATA` auf `true` setzen.

Die Beispieldaten unter `src/data/mock-beasts.js` sind fiktiv und dienen nur der Entwicklung. Sie enthalten keine veröffentlichten D&D-Monsterdaten.

## GitHub Pages

1. Dieses Projekt in ein GitHub-Repository hochladen.
2. In den Repository-Einstellungen unter **Pages** die Bereitstellung von einem Branch aktivieren (z. B. `main`, Ordner `/ (root)`).
3. Nach kurzer Zeit ist die App über die dort angezeigte URL erreichbar.

Alle Dateipfade sind relativ, daher funktioniert die Seite auch unter einer Repository-Unteradresse von GitHub Pages.

## Regelhinweis

`src/domain/wildshape.js` enthält einen bewusst kleinen Regelhelfer für Stufen, HG und Flugbewegung. Bitte gleiche ihn vor Spielgebrauch mit eurer verwendeten Regelquelle ab und passe ihn dort zentral an.
