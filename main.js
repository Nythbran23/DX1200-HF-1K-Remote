const { app, BrowserWindow, ipcMain } = require('electron');
const net = require('net');
const path = require('path');

let mainWindow;
let ampClient = null;
let ampConnected = false;
let telemetryActive = false;
let reconnectTimer = null;
let intentionalDisconnect = false;  // Track if user manually disconnected

// Configuration
let config = {
  ampIP: '',
  ampPort: 9100,
  ampPassword: '1234'
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'LinearAmpUK DX1200 Monitor',
    backgroundColor: '#1a1a1a'
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    // Send disconnect and clean up before closing
    if (ampClient && ampConnected) {
      try {
        // Give amp a moment to process disconnect
        ampClient.end();
        setTimeout(() => {
          if (ampClient) {
            ampClient.destroy();
          }
        }, 100);
      } catch (e) {
        console.log('Error during cleanup:', e);
      }
    }
    
    intentionalDisconnect = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    ampClient = null;
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Clean up connection before quitting
  if (ampClient) {
    intentionalDisconnect = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    ampClient.destroy();
    ampClient = null;
  }
  
  // Always quit when all windows are closed (including macOS)
  app.quit();
});

app.on('before-quit', () => {
  // Clean disconnect before app quits
  if (ampClient) {
    intentionalDisconnect = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    ampClient.destroy();
    ampClient = null;
  }
});

// Handle terminal signals (Ctrl+C, Ctrl+Z, kill)
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT (Ctrl+C) - shutting down gracefully...');
  if (ampClient) {
    ampClient.end();
    setTimeout(() => {
      app.quit();
    }, 100);
  } else {
    app.quit();
  }
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM - shutting down...');
  app.quit();
});

// Note: SIGTSTP (Ctrl+Z) can't be caught to quit, but SIGINT (Ctrl+C) will work

// Send data to renderer
function sendToRenderer(channel, data) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
}

// Send command to amplifier
function sendToAmp(cmd) {
  if (!ampConnected || !ampClient) {
    console.log('Not connected - cannot send:', cmd);
    return false;
  }
  
  try {
    ampClient.write(cmd + '\n');
    console.log('TX:', cmd);
    sendToRenderer('log', { type: 'tx', message: cmd });
    return true;
  } catch (err) {
    console.error('Error sending to amp:', err);
    return false;
  }
}

// Parse status message
function parseStatus(line) {
  const status = {};
  const params = line.split(',');
  
  params.forEach(param => {
    const [key, value] = param.split('=');
    if (key && value) {
      status[key.trim()] = value.trim();
    }
  });
  
  return status;
}

// Connect to amplifier
function connectToAmp() {
  if (!config.ampIP) {
    sendToRenderer('connection-status', { 
      connected: false, 
      error: 'No IP address configured' 
    });
    return;
  }

  if (ampClient) {
    // Force cleanup of any existing connection
    try {
      ampClient.removeAllListeners();
      ampClient.destroy();
    } catch (e) {
      console.log('Error cleaning up old connection:', e);
    }
    ampClient = null;
  }

  ampConnected = false;
  telemetryActive = false;
  intentionalDisconnect = false;  // Reset flag on new connection attempt

  console.log(`Connecting to ${config.ampIP}:${config.ampPort}...`);
  sendToRenderer('log', { 
    type: 'info', 
    message: `Connecting to ${config.ampIP}:${config.ampPort}...` 
  });

  ampClient = new net.Socket();
  ampClient.setTimeout(30000);  // Increase to 30 seconds
  ampClient.setKeepAlive(true, 10000);  // Keepalive every 10 seconds

  ampClient.connect(config.ampPort, config.ampIP, () => {
    console.log('TCP connected to amplifier');
    ampConnected = true;
    sendToRenderer('connection-status', { connected: true });
    sendToRenderer('log', { type: 'info', message: 'TCP connected' });
  });

  ampClient.on('data', (data) => {
    // Reset timeout on any data received
    ampClient.setTimeout(30000);
    
    const lines = data.toString().split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      console.log('RX:', line);
      sendToRenderer('log', { type: 'rx', message: line });

      // Password prompt
      if (line.startsWith('password>')) {
        console.log('Sending password...');
        sendToAmp(config.ampPassword);
        return;
      }

      // Banner detected - start telemetry
      if (line.includes('DxShop Gemini') && line.includes('VERSION') && !telemetryActive) {
        console.log('Amplifier identified - starting telemetry');
        sendToRenderer('amp-banner', line);
        
        setTimeout(() => {
          sendToAmp('S1');
          telemetryActive = true;
        }, 200);
        return;
      }

      // Status message
      if (line.includes('BAND=') || line.includes('STATE=')) {
        const status = parseStatus(line);
        sendToRenderer('amp-status', status);
        
        // Enable telemetry if not already active
        if (!telemetryActive) {
          setTimeout(() => {
            sendToAmp('S1');
            telemetryActive = true;
          }, 200);
        }
        return;
      }

      // Trip notification
      if (line.startsWith('TRIP=')) {
        sendToRenderer('amp-trip', line.substring(5));
        return;
      }

      // PTT change
      if (line.startsWith('PTT=')) {
        sendToRenderer('amp-ptt', line.substring(4));
        return;
      }

      // Other responses
      sendToRenderer('amp-response', line);
    });
  });

  ampClient.on('error', (err) => {
    console.error('Connection error:', err.message);
    ampConnected = false;
    telemetryActive = false;
    
    // Check if it's a "connection refused" or "already in use" error
    if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNRESET')) {
      sendToRenderer('connection-status', { 
        connected: false, 
        error: 'Connection refused - amplifier may have active connection. Retrying...' 
      });
      sendToRenderer('log', { 
        type: 'error', 
        message: 'Connection refused - retrying in 3 seconds...' 
      });
      
      // Retry after a delay
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          if (!intentionalDisconnect) {
            connectToAmp();
          }
        }, 3000);
      }
    } else {
      sendToRenderer('connection-status', { 
        connected: false, 
        error: err.message 
      });
      sendToRenderer('log', { 
        type: 'error', 
        message: `Connection error: ${err.message}` 
      });
    }
  });

  ampClient.on('close', () => {
    console.log('Connection closed');
    ampConnected = false;
    telemetryActive = false;
    sendToRenderer('connection-status', { connected: false });
    sendToRenderer('log', { type: 'info', message: 'Connection closed' });

    // Auto-reconnect after 5 seconds ONLY if disconnect was not intentional
    if (config.ampIP && !reconnectTimer && !intentionalDisconnect) {
      sendToRenderer('log', { type: 'info', message: 'Auto-reconnecting in 5 seconds...' });
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectToAmp();
      }, 5000);
    }
  });

  ampClient.on('timeout', () => {
    console.log('Connection timeout');
    ampClient.destroy();
  });
}

// IPC handlers
ipcMain.handle('connect', async (event, settings) => {
  config.ampIP = settings.ip;
  config.ampPort = settings.port || 9100;
  config.ampPassword = settings.password || '1234';
  
  connectToAmp();
});

ipcMain.handle('disconnect', async () => {
  intentionalDisconnect = true;  // Mark as intentional disconnect
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (ampClient && ampConnected) {
    console.log('Gracefully closing connection...');
    
    // Use end() for graceful TCP close (sends FIN packet)
    ampClient.end();
    
    // Force close after 500ms if not closed gracefully
    setTimeout(() => {
      if (ampClient && !ampClient.destroyed) {
        console.log('Forcing connection close');
        ampClient.destroy();
      }
      ampClient = null;
      ampConnected = false;
      telemetryActive = false;
    }, 500);
  } else {
    ampClient = null;
    ampConnected = false;
    telemetryActive = false;
  }
  
  sendToRenderer('connection-status', { connected: false });
  sendToRenderer('log', { type: 'info', message: 'Disconnected' });
});

ipcMain.handle('send-command', async (event, command) => {
  return sendToAmp(command);
});

ipcMain.handle('get-status', async () => {
  return {
    connected: ampConnected,
    telemetryActive: telemetryActive
  };
});

// Test connection to a specific IP
ipcMain.handle('test-connection', async (event, ip, port) => {
  return new Promise((resolve) => {
    const testClient = new net.Socket();
    testClient.setTimeout(2000);
    
    console.log(`Testing connection to ${ip}:${port}...`);
    
    testClient.connect(parseInt(port) || 9100, ip, () => {
      let receivedData = '';
      
      testClient.on('data', (data) => {
        receivedData += data.toString();
        
        // Check for password prompt
        if (receivedData.includes('password>')) {
          testClient.write('1234\n');
          return;
        }
        
        // Check for LinearAmpUK banner
        if (receivedData.includes('DxShop Gemini') && receivedData.includes('VERSION')) {
          const banner = receivedData.trim().split('\n').find(line => 
            line.includes('DxShop Gemini')
          );
          testClient.destroy();
          resolve({ success: true, banner: banner || 'LinearAmpUK Amplifier' });
          return;
        }
        
        // Check for status response
        if (receivedData.includes('BAND=') && receivedData.includes('POWER=')) {
          testClient.destroy();
          resolve({ success: true, banner: 'LinearAmpUK Amplifier (verified by status)' });
          return;
        }
      });
      
      // Send probe after 200ms
      setTimeout(() => {
        if (!testClient.destroyed) {
          testClient.write('S\n');
        }
      }, 200);
      
      // Timeout after 2 seconds
      setTimeout(() => {
        if (!testClient.destroyed) {
          testClient.destroy();
          resolve({ 
            success: false, 
            error: 'No response from amplifier (may be in use by another connection)' 
          });
        }
      }, 2000);
    });
    
    testClient.on('error', (err) => {
      resolve({ 
        success: false, 
        error: `Connection failed: ${err.message}` 
      });
    });
    
    testClient.on('timeout', () => {
      testClient.destroy();
      resolve({ 
        success: false, 
        error: 'Connection timeout' 
      });
    });
  });
});
