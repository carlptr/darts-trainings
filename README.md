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

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
