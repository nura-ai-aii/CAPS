const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const notifier = require('node-notifier');

const BACKEND_URL = 'http://localhost:4000';
let tray = null;
let mainWindow = null;
let isQuitting = false;

// Create local temp dir for downloads
const TEMP_DIR = path.join(os.tmpdir(), 'PrintCloudAgent');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    show: false, // Don't show by default
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('close', function (event) {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Use a default icon or create a simple one
  tray = new Tray(path.join(__dirname, 'icon.png')); // Ensure an icon exists
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Dashboard', click: () => mainWindow.show() },
    { label: 'Quit', click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip('PrintCloud Agent - Running');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.show();
  });
}

// Function to print a file silently on Windows
function printFile(filePath) {
  return new Promise((resolve, reject) => {
    // For images, we can use mspaint /pt or powershell
    // For PDF, we'd ideally use SumatraPDF or pdf-to-printer, but let's use a powershell script for basic printing
    const ext = path.extname(filePath).toLowerCase();
    let command = '';
    
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      command = `mspaint /pt "${filePath}"`;
    } else if (ext === '.pdf') {
      // Basic powershell print for PDF (might require default PDF reader to support print verb)
      command = `powershell -Command "Start-Process -FilePath '${filePath}' -Verb Print -PassThru | %{sleep 5;$_} | kill"`;
    } else {
      return reject(new Error('Unsupported file type'));
    }

    exec(command, (error) => {
      if (error) {
        console.error(`Print error: ${error}`);
        return reject(error);
      }
      resolve();
    });
  });
}

// Check for new orders
async function checkOrders() {
  try {
    const res = await axios.get(`${BACKEND_URL}/api/orders?status=Ready to Print`);
    const orders = res.data;
    
    for (const order of orders) {
      console.log(`Processing order: ${order.orderNumber}`);
      
      // Update status to Printing
      await axios.patch(`${BACKEND_URL}/api/orders/${order.id}/status`, { status: 'Printing' });
      
      if (mainWindow) {
        mainWindow.webContents.send('order-status', { orderNumber: order.orderNumber, status: 'Printing' });
      }

      let allSuccess = true;
      
      for (const file of order.files) {
        const fileUrl = `${BACKEND_URL}${file.path}`;
        const localPath = path.join(TEMP_DIR, file.originalName);
        
        try {
          // Download file
          const response = await axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream'
          });
          
          const writer = fs.createWriteStream(localPath);
          response.data.pipe(writer);
          
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          
          console.log(`Downloaded ${file.originalName}`);
          
          // Print file multiple times based on copies
          for(let c = 0; c < order.copies; c++) {
            await printFile(localPath);
          }
          
        } catch (err) {
          console.error(`Failed to process ${file.originalName}:`, err.message);
          allSuccess = false;
        }
      }
      
      // Finalize status
      const finalStatus = allSuccess ? 'Printed' : 'Failed';
      await axios.patch(`${BACKEND_URL}/api/orders/${order.id}/status`, { status: finalStatus });
      
      if (mainWindow) {
        mainWindow.webContents.send('order-status', { orderNumber: order.orderNumber, status: finalStatus });
      }

      notifier.notify({
        title: 'PrintCloud Agent',
        message: `Order ${order.orderNumber} is ${finalStatus}`
      });
    }
  } catch (error) {
    console.error('Error checking orders:', error.message);
  }
}

// App initialization
app.whenReady().then(() => {
  // Create a dummy icon if it doesn't exist to prevent crash
  if (!fs.existsSync(path.join(__dirname, 'icon.png'))) {
    fs.writeFileSync(path.join(__dirname, 'icon.png'), ''); // Or create a tiny 1x1 png programmatically
  }

  createWindow();
  createTray();
  
  // Start polling every 10 seconds
  cron.schedule('*/10 * * * * *', () => {
    checkOrders();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
