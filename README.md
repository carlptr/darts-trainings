# Darts-Trainings

Eine Sammlung browserbasierter Darts-Trainings. Die Seiten funktionieren ohne Build-Schritt und können direkt über GitHub Pages veröffentlicht werden.

## Projektstruktur

```text
.
├── index.html
├── trainings/
│   └── 10-10-10/
│       └── index.html
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   └── training.css
│   └── js/
│       └── 10-10-10.js
├── .gitignore
└── README.md
```

`index.html` ist die Trainingsübersicht. Jedes Trainingsformat erhält einen eigenen Ordner unter `trainings/`. Gemeinsame Gestaltung gehört nach `assets/css/main.css`, formatbezogene Gestaltung und Logik in eigene Dateien unter `assets/css/` und `assets/js/`.

## Lokal ansehen

`index.html` im Browser öffnen. Für die aktuelle Version ist kein Server und kein Build-Schritt erforderlich.

## Mit GitHub Pages veröffentlichen

1. Das Projekt in ein GitHub-Repository übertragen.
2. Unter **Settings → Pages** die Veröffentlichung aus dem gewünschten Branch und dessen Stammverzeichnis aktivieren.
3. Die von GitHub angezeigte Website-Adresse öffnen.

Die Trainings speichern Ergebnisse aktuell lokal im Browser des jeweiligen Geräts. Es gibt keine Synchronisierung zwischen Geräten.
