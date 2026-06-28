# Piedejour

A minimal local-first desktop journal built with Electron.

The app stores journal entries locally, opens to a plain text editor, autosaves as
you write, and keeps secondary actions behind the `Esc` options window.

## Get the source code

Clone the repository:

```bash
git clone <repository-url>
cd piedejour
```

If you already have the source folder, open a terminal in that folder:

```bash
cd /path/to/piedejour
```

## Prerequisites

Install Node.js and npm. On macOS with Homebrew:

```bash
brew install node
```

Verify the install:

```bash
node --version
npm --version
```

## Install dependencies

From the project folder:

```bash
npm install
```

Verify Electron resolves correctly:

```bash
node -e "console.log(require('electron'))"
```

Electron 42 downloads its desktop binary when the `electron` command is first
run. If the first launch cannot download the binary, install it manually:

```bash
npx install-electron --no
```

## Run the app

Start the Electron app:

```bash
npm start
```

The app data is stored locally in Electron's user data directory:

- `entries.json` for journal entries
- `settings.json` for editor settings

## Build the app

Current state: the project runs as an Electron app, but installable packaging is
not configured yet.

The current development build command is:

```bash
npm start
```

To create a real macOS `.app` or `.dmg`, add a packaging tool such as
`electron-builder` or Electron Forge, then add package scripts such as:

```json
{
  "scripts": {
    "package": "electron-builder --mac",
    "dist": "electron-builder"
  }
}
```

After packaging is configured, the package command would be:

```bash
npm run package
```

## Create an installable package

Packaging is the next setup task for this project. A recommended path is:

```bash
npm install --save-dev electron-builder
```

Then configure `package.json` with app metadata and a `build` section, for
example:

```json
{
  "build": {
    "appId": "com.piedejour.app",
    "productName": "Piedejour",
    "mac": {
      "target": ["dmg", "zip"]
    }
  }
}
```

Then run:

```bash
npm run package
```

The packaged app would be written to the build output directory created by the
packaging tool, commonly `dist/`.

## Install the package

Once a `.dmg` package exists:

1. Open the `.dmg`.
2. Drag `Piedejour.app` into `Applications`.
3. Launch Piedejour from `Applications`.

If using a `.zip` package:

1. Unzip the package.
2. Move `Piedejour.app` into `Applications`.
3. Launch Piedejour from `Applications`.

## Development checks

Run JavaScript syntax checks:

```bash
npm run check
```

## Project documentation

The project keeps handoff documentation in YAML:

- `docs/spec.yaml`: current product and technical spec
- `docs/tasks.yaml`: completed and pending task state
- `docs/lessons-learned.yaml`: process notes and lessons learned
