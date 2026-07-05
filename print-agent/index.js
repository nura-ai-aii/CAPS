const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const notifier = require('node-notifier');

const BACKEND_URL = 'https://caps-mbmi.onrender.com';

// Create local temp dir for downloads
const TEMP_DIR = path.join(os.tmpdir(), 'PrintCloudAgent');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

console.log('=================================================');
console.log('🖨️  PrintCloud Agent Started (Console Mode)');
console.log(`📡 Connected to Server: ${BACKEND_URL}`);
console.log('⏳ Polling for new orders every 10 seconds...');
console.log('=================================================\n');

// Function to print a file silently on Windows
function printFile(filePath) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filePath).toLowerCase();
    let command = '';
    
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      command = `mspaint /pt "${filePath}"`;
    } else if (ext === '.pdf') {
      command = `powershell -Command "Start-Process -FilePath '${filePath}' -Verb Print -PassThru | %{sleep 5;$_} | kill"`;
    } else {
      return reject(new Error('Unsupported file type'));
    }

    exec(command, (error) => {
      if (error) {
        console.error(`❌ Print error: ${error}`);
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
      console.log(`\n▶️ Processing order: ${order.orderNumber}`);
      
      // Update status to Printing
      await axios.patch(`${BACKEND_URL}/api/orders/${order.id}/status`, { status: 'Printing' });

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
          
          console.log(`   ✅ Downloaded ${file.originalName}`);
          
          // Print file multiple times based on copies
          const copies = order.settings?.copies || 1;
          for(let c = 0; c < copies; c++) {
            await printFile(localPath);
          }
          console.log(`   🖨️ Printed ${file.originalName} (${copies} copies)`);
          
        } catch (err) {
          console.error(`   ❌ Failed to process ${file.originalName}:`, err.message);
          allSuccess = false;
        }
      }
      
      // Finalize status
      const finalStatus = allSuccess ? 'Printed' : 'Failed';
      await axios.patch(`${BACKEND_URL}/api/orders/${order.id}/status`, { status: finalStatus });
      console.log(`✅ Order ${order.orderNumber} marked as ${finalStatus}\n`);

      notifier.notify({
        title: 'PrintCloud Agent',
        message: `Order ${order.orderNumber} is ${finalStatus}`,
        icon: path.join(__dirname, 'icon.png')
      });
    }
  } catch (error) {
    if (error.code !== 'ECONNREFUSED') {
      console.error('Error checking orders:', error.message);
    }
  }
}

// Start polling every 10 seconds
cron.schedule('*/10 * * * * *', () => {
  checkOrders();
});
