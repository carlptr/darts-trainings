# Darts Trainings

A collection of browser-based darts training games. The pages require no build step and can be published directly with GitHub Pages.

## Project structure

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

`index.html` is the training overview. Each training format has its own directory under `trainings/`. Shared styles belong in `assets/css/main.css`; format-specific styles and logic belong in separate files under `assets/css/` and `assets/js/`.

## Run locally

Open the root `index.html` in a browser. The current version does not require a build step.

For testing through a local web server, open the root `index.html` in VS Code, right-click it, and select **Open with Live Server** (requires the Live Server extension). This is recommended for consistent browser storage behavior.

## Publish with GitHub Pages

1. Push the project to a GitHub repository.
2. Under **Settings → Pages**, enable publishing from the desired branch and its root directory.
3. Open the website URL provided by GitHub.

Training results are currently stored locally in the browser on the device being used. They are not synchronized across devices.

## Guided 10–10–10 mode

Select **Geführt spielen** in the 10–10–10 match to enter scores in a full-screen, touch-friendly view. The task order is deterministic: Singles, Scoring, then Checkouts; for each of the ten targets or turns, Player A enters a value followed by Player B, before moving to the next task. Progress counts the ten tasks in the current discipline, with both players sharing each task. Entries use the same saved match data as the score table, results list, and print views.

Use the arrow keys to navigate, number keys to choose a score, and Escape to close the overlay. Locked disciplines can only be changed through their explicit correction mode; correction edits must be saved or are discarded when cancelled.

## Solo 10–10–10 mode

Choose **Einzelspieler** as the mode for a new match to record one player's results across Singles, Scoring, and Checkouts. Solo results show the score for each discipline and the combined training score instead of match points. Solo games are saved alongside two-player matches and appear in the game history and print views. Existing games without a saved mode continue to be treated as two-player matches.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
