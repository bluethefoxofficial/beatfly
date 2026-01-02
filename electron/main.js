const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// Disable sandbox for Linux AppImage and avoid /dev/shm issues in some environments
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
const isDev = !app.isPackaged;

function resolveAppPath(...segments) {
  return isDev
    ? path.join(__dirname, '..', ...segments)
    : path.join(process.resourcesPath, ...segments);
}

function createMainWindow() {
  const iconPath = resolveAppPath('assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: iconPath,
    webPreferences: {
      // Preload script to expose limited APIs to renderer
      preload: path.join(__dirname, 'preload.js'),
                                 // Disable sandbox if needed (already set via commandLine)
                                 sandbox: false,
                                 // Security best practices
                                 contextIsolation: true,
                                 nodeIntegration: false
    }
  });

  // Load dev server in development, built files in production
  const prodIndexPath = resolveAppPath('dist', 'index.html');
  const urlToLoad = isDev ? 'http://localhost:3000' : pathToFileURL(prodIndexPath).toString();

  mainWindow.loadURL(urlToLoad).catch(err => {
    console.error('Failed to load renderer:', err);
  });

  // Open the DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close via IPC (if used in renderer)
  ipcMain.on('close-window', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createMainWindow();

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
