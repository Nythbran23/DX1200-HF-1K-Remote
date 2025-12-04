// UI Elements
const elements = {
    // Connection
    ipAddress: document.getElementById('ipAddress'),
    port: document.getElementById('port'),
    password: document.getElementById('password'),
    connectBtn: document.getElementById('connectBtn'),
    disconnectBtn: document.getElementById('disconnectBtn'),
    testBtn: document.getElementById('testBtn'),
    
    // Meters and displays
    powerBar: document.getElementById('powerBar'),
    powerCurrentDisplay: document.getElementById('powerCurrentDisplay'),
    currentBar: document.getElementById('currentBar'),
    currentMeterDisplay: document.getElementById('currentMeterDisplay'),
    swrBar: document.getElementById('swrBar'),
    pttStatus: document.getElementById('pttStatus'),
    tempBar: document.getElementById('tempBar'),
    tempWarning: document.getElementById('tempWarning'),
    
    // Controls
    toggleRunBtn: document.getElementById('toggleRunBtn'),
    menuBtn: document.getElementById('menuBtn'),
    minimizeBtn: document.getElementById('minimizeBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    
    // Trip
    tripAlert: document.getElementById('tripAlert'),
    tripCause: document.getElementById('tripCause'),
    clearTripBtn: document.getElementById('clearTripBtn'),
    
    // Log
    logPanel: document.getElementById('logPanel'),
    logOutput: document.getElementById('logOutput'),
    clearLogBtn: document.getElementById('clearLogBtn'),
    showLogToggle: document.getElementById('showLogToggle')
};

let connected = false;
let currentPowerWatts = 0;
let currentVSWR = 1.0;
let currentBand = '';
let selectedAntenna = '';
let ampModel = null; // Will be detected: 'DX1200' or 'HF1K'
let modelDetected = false;
let detectionInProgress = false;
let bandBeforeDetection = null;
let detectionAttempts = 0; // Count status updates during detection

// Band frequency ranges for display
const bandRanges = {
    '1.8MHZ': '1.800 - 2.000 MHz',
    '3.5MHZ': '3.500 - 4.000 MHz',
    '7MHZ': '7.000 - 7.300 MHz',
    '10MHZ': '10.100 - 10.150 MHz',
    '14MHZ': '14.000 - 14.350 MHz',
    '18MHZ': '18.068 - 18.168 MHz',
    '21MHZ': '21.000 - 21.450 MHz',
    '24MHZ': '24.890 - 24.990 MHz',
    '28MHZ': '28.000 - 29.700 MHz',
    '50MHZ': '50.000 - 54.000 MHz'
};

// Load saved settings
window.addEventListener('DOMContentLoaded', () => {
    const savedIP = localStorage.getItem('ampIP');
    const savedPort = localStorage.getItem('ampPort');
    const savedPassword = localStorage.getItem('ampPassword');
    
    if (savedIP) elements.ipAddress.value = savedIP;
    if (savedPort) elements.port.value = savedPort;
    if (savedPassword) elements.password.value = savedPassword;
});

// Connect button
elements.connectBtn.addEventListener('click', async () => {
    const ip = elements.ipAddress.value.trim();
    const port = parseInt(elements.port.value) || 9100;
    const password = elements.password.value;
    
    if (!ip) {
        addLog('error', 'Please enter an IP address');
        return;
    }
    
    // Save settings
    localStorage.setItem('ampIP', ip);
    localStorage.setItem('ampPort', port);
    localStorage.setItem('ampPassword', password);
    
    addLog('info', `Connecting to ${ip}:${port}...`);
    
    await window.geminiAPI.connect({
        ip: ip,
        port: port,
        password: password
    });
});

// Disconnect button
elements.disconnectBtn.addEventListener('click', async () => {
    await window.geminiAPI.disconnect();
    addLog('info', 'Disconnected by user');
});

// Test connection button
elements.testBtn.addEventListener('click', async () => {
    const ip = elements.ipAddress.value.trim();
    const port = elements.port.value.trim();
    
    if (!ip) {
        addLog('error', 'Please enter an IP address');
        return;
    }
    
    addLog('info', `Testing connection to ${ip}:${port}...`);
    elements.testBtn.disabled = true;
    elements.testBtn.textContent = 'Testing...';
    
    const result = await window.geminiAPI.testConnection(ip, port);
    
    elements.testBtn.disabled = false;
    elements.testBtn.textContent = 'Test Connection';
    
    if (result.success) {
        addLog('info', `✓ Found: ${result.banner}`);
    } else {
        addLog('error', `✗ ${result.error}`);
    }
});

// Toggle Run/Standby button
let isOperating = false;
elements.toggleRunBtn.addEventListener('click', () => {
    if (isOperating) {
        // Currently operating, switch to standby
        window.geminiAPI.sendCommand('R0');
        elements.toggleRunBtn.classList.remove('operate');
        elements.toggleRunBtn.classList.add('standby');
        elements.toggleRunBtn.textContent = 'STANDBY';
        isOperating = false;
    } else {
        // Currently standby, switch to operate
        window.geminiAPI.sendCommand('R1');
        elements.toggleRunBtn.classList.remove('standby');
        elements.toggleRunBtn.classList.add('operate');
        elements.toggleRunBtn.textContent = 'OPERATE';
        isOperating = true;
    }
});

// Menu button
elements.menuBtn.addEventListener('click', () => {
    const panel = elements.settingsPanel;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

elements.closeSettingsBtn.addEventListener('click', () => {
    elements.settingsPanel.style.display = 'none';
});

// Minimize toggle button
let isMinimized = false;
elements.minimizeBtn.addEventListener('click', () => {
    isMinimized = !isMinimized;
    const container = document.querySelector('.container');
    
    if (isMinimized) {
        container.classList.add('minimized');
        elements.minimizeBtn.textContent = '▼';
        elements.minimizeBtn.title = 'Expand';
    } else {
        container.classList.remove('minimized');
        elements.minimizeBtn.textContent = '▲';
        elements.minimizeBtn.title = 'Minimize';
    }
});

// Band selection buttons - ensure active state persists
document.querySelectorAll('.band-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const band = btn.getAttribute('data-band');
        window.geminiAPI.sendCommand('B' + band);
        currentBand = band;
        
        // Update active state immediately
        document.querySelectorAll('.band-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Power level buttons - ensure active state persists
document.querySelectorAll('.power-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        window.geminiAPI.sendCommand(cmd);
        
        // Update active state immediately
        document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update display
        if (cmd === 'PH') elements.powerLevelDisplay.textContent = 'HIGH';
        else if (cmd === 'PM') elements.powerLevelDisplay.textContent = 'MEDIUM';
        else if (cmd === 'PL') elements.powerLevelDisplay.textContent = 'LOW';
    });
});

// Antenna selection buttons - ensure active state persists
document.querySelectorAll('.antenna-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const ant = btn.getAttribute('data-ant');
        if (currentBand) {
            window.geminiAPI.sendCommand('B' + currentBand + ',' + ant);
        }
        selectedAntenna = ant;
        
        // Update active state immediately
        document.querySelectorAll('.antenna-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Clear trip button
elements.clearTripBtn.addEventListener('click', () => {
    window.geminiAPI.sendCommand('T');
    elements.tripAlert.style.display = 'none';
});

// Clear log
elements.clearLogBtn.addEventListener('click', () => {
    elements.logOutput.innerHTML = '';
});

// Show log toggle
elements.showLogToggle.addEventListener('change', (e) => {
    elements.logPanel.style.display = e.target.checked ? 'block' : 'none';
});

// Clear trip button handler
document.getElementById('clearTripBtn').addEventListener('click', async () => {
    // Send clear trip command to amp
    await window.geminiAPI.sendCommand('C');
    
    // Hide modal
    document.getElementById('tripModal').classList.remove('show');
    
    addLog('info', 'Trip cleared');
});

// Connection status handler
window.geminiAPI.onConnectionStatus((data) => {
    connected = data.connected;
    
    if (data.connected) {
        // Update settings button to green
        elements.menuBtn.classList.remove('disconnected');
        elements.menuBtn.classList.add('connected');
        
        elements.connectBtn.disabled = true;
        elements.disconnectBtn.disabled = false;
        elements.toggleRunBtn.disabled = false;
        
        // Enable band buttons
        document.querySelectorAll('.band-btn').forEach(btn => {
            btn.disabled = false;
        });
        
        // Enable antenna and power buttons
        document.querySelectorAll('.antenna-btn, .power-btn').forEach(btn => {
            btn.disabled = false;
        });
        
        // S1 telemetry is already started by main.js, no need to request status
        
    } else {
        // Update settings button to red
        elements.menuBtn.classList.remove('connected');
        elements.menuBtn.classList.add('disconnected');
        
        elements.connectBtn.disabled = false;
        elements.disconnectBtn.disabled = true;
        elements.toggleRunBtn.disabled = true;
        
        // Disable band buttons
        document.querySelectorAll('.band-btn').forEach(btn => {
            btn.disabled = true;
        });
        
        // Disable antenna and power buttons
        document.querySelectorAll('.antenna-btn, .power-btn').forEach(btn => {
            btn.disabled = true;
        });
        
        // Reset displays
        resetDisplays();
        
        if (data.error) {
            addLog('error', data.error);
        }
    }
});

// Amplifier banner handler
window.geminiAPI.onAmpBanner((banner) => {
    addLog('info', `Amplifier: ${banner}`);
    console.log('Received banner:', banner);
    
    // Extract MAC address from banner
    // Format: "DxShop Gemini 1 MAC=00:50:C2:4C:E0:00 VERSION=@Version 2.5Ee_05:41:42 Mar 29 2022@"
    const macMatch = banner.match(/MAC=([0-9A-F:]+)/i);
    if (macMatch) {
        document.getElementById('macAddress').textContent = `MAC: ${macMatch[1]}`;
    }
    
    // Extract firmware version from banner
    // Looking for VERSION=@Version X.X...@
    const versionMatch = banner.match(/VERSION=@Version\s+([\d.]+[A-Za-z_\d]*)/);
    if (versionMatch) {
        document.getElementById('firmwareVersion').textContent = `Firmware: ${versionMatch[1]}`;
    }
    
    // Model detection will happen after first status update
    // (we need to know current band first)
    
    // Query current power level setting after connection
    setTimeout(() => {
        console.log('Sending P command to query power level...');
        window.geminiAPI.sendCommand('P');
    }, 500);
});

// Configure band buttons based on detected amplifier model
function configureBandButtons(model) {
    console.log('Configuring band buttons for model:', model);
    
    // Update model indicator in header
    const modelIndicator = document.getElementById('modelIndicator');
    if (model === 'DX1200') {
        modelIndicator.textContent = 'DX1200';
        modelIndicator.classList.add('visible');
        
        // DX1200: Show 4m (70MHz), hide 472kHz
        document.querySelectorAll('[data-model="DX1200"]').forEach(btn => {
            btn.style.display = '';
            console.log('Showing DX1200 band:', btn.textContent);
        });
        document.querySelectorAll('[data-model="HF1K"]').forEach(btn => {
            btn.style.display = 'none';
            console.log('Hiding HF1K band:', btn.textContent);
        });
    } else if (model === 'HF1K') {
        modelIndicator.textContent = 'HF-1K';
        modelIndicator.classList.add('visible');
        
        // HF-1K: Show 472kHz, hide 4m (70MHz)
        document.querySelectorAll('[data-model="HF1K"]').forEach(btn => {
            btn.style.display = '';
            console.log('Showing HF1K band:', btn.textContent);
        });
        document.querySelectorAll('[data-model="DX1200"]').forEach(btn => {
            btn.style.display = 'none';
            console.log('Hiding DX1200 band:', btn.textContent);
        });
    }
}

// Get band command to restore original band after detection
// Need to find which button corresponds to this frequency
function getBandCommand(bandFreq) {
    const bandUpper = bandFreq.toUpperCase();
    const btn = Array.from(document.querySelectorAll('.band-btn')).find(b => 
        b.getAttribute('data-band') === bandUpper
    );
    if (btn) {
        return btn.getAttribute('data-band');
    }
    return null;
}

// Status update handler
window.geminiAPI.onAmpStatus((status) => {
    // State - sync with toggle button
    if (status.STATE) {
        // Sync toggle button with actual state
        if (status.STATE === 'RX' || status.STATE === 'TX') {
            isOperating = true;
            elements.toggleRunBtn.classList.remove('standby');
            elements.toggleRunBtn.classList.add('operate');
            elements.toggleRunBtn.textContent = 'OPERATE';
        } else if (status.STATE === 'SB') {
            isOperating = false;
            elements.toggleRunBtn.classList.remove('operate');
            elements.toggleRunBtn.classList.add('standby');
            elements.toggleRunBtn.textContent = 'STANDBY';
        }
    }
    
    // Band - just update button highlighting
    if (status.BAND) {
        currentBand = status.BAND;
        
        // Start model detection on first band report (if not already started)
        if (!modelDetected && !detectionInProgress) {
            detectionInProgress = true;
            bandBeforeDetection = status.BAND;
            
            console.log('Starting model detection...');
            console.log('Current band:', bandBeforeDetection);
            
            // Always test with 70MHz band
            // DX1200: Will switch to 70MHz
            // HF-1K: Will respond with BAND=???
            console.log('Trying 70MHz band to detect model...');
            setTimeout(() => {
                window.geminiAPI.sendCommand('B70MHZ');
            }, 500);
        }
        
        // Complete detection if we just switched bands
        if (detectionInProgress && modelDetected === false) {
            detectionAttempts++;
            const bandUpper = status.BAND.toUpperCase();
            console.log(`Detection attempt ${detectionAttempts}: Current band:`, bandUpper);
            
            // Wait for at least 2 status updates to ensure band change has happened
            if (detectionAttempts < 2) {
                return; // Keep waiting
            }
            
            // Check the band after trying to switch to 70MHz
            if (bandUpper === '???' || bandUpper.includes('???')) {
                // Got ??? response - amp doesn't have 70MHz, must be HF-1K
                ampModel = 'HF1K';
                modelDetected = true;
                console.log('Model detected: HF-1K (no 70MHz band, has 472kHz)');
                configureBandButtons('HF1K');
                
                // Restore original band
                console.log('Restoring original band:', bandBeforeDetection);
                const restoreCmd = 'B' + bandBeforeDetection;
                setTimeout(() => {
                    window.geminiAPI.sendCommand(restoreCmd);
                    detectionInProgress = false;
                    detectionAttempts = 0;
                }, 500);
            } else if (bandUpper === '70MHZ' || bandUpper.includes('70')) {
                // Successfully switched to 70MHz - must be DX1200
                ampModel = 'DX1200';
                modelDetected = true;
                console.log('Model detected: DX1200 (has 70MHz band)');
                configureBandButtons('DX1200');
                
                // Restore original band
                console.log('Restoring original band:', bandBeforeDetection);
                const restoreCmd = 'B' + bandBeforeDetection;
                setTimeout(() => {
                    window.geminiAPI.sendCommand(restoreCmd);
                    detectionInProgress = false;
                    detectionAttempts = 0;
                }, 500);
            }
        }
        
        // Highlight active band button (case-insensitive comparison)
        const bandUpper = status.BAND.toUpperCase();
        console.log('Band from amp:', status.BAND, '-> uppercase:', bandUpper);
        
        let foundMatch = false;
        document.querySelectorAll('.band-btn').forEach(btn => {
            const btnBand = btn.getAttribute('data-band');
            btn.classList.remove('active');
            if (btnBand === bandUpper) {
                console.log('MATCH! Activating button:', btnBand);
                btn.classList.add('active');
                foundMatch = true;
            }
        });
        
        if (!foundMatch) {
            console.log('NO MATCH FOUND for band:', bandUpper);
            console.log('Available buttons:', Array.from(document.querySelectorAll('.band-btn')).map(b => b.getAttribute('data-band')));
        }
    }
    
    // Antenna - just update button highlighting
    if (status.ANTENNA) {
        selectedAntenna = status.ANTENNA;
        
        console.log('Antenna from amp:', status.ANTENNA);
        
        let foundMatch = false;
        // Highlight active antenna button
        document.querySelectorAll('.antenna-btn').forEach(btn => {
            const btnAnt = btn.getAttribute('data-ant');
            btn.classList.remove('active');
            if (btnAnt === status.ANTENNA) {
                console.log('MATCH! Activating antenna button:', btnAnt);
                btn.classList.add('active');
                foundMatch = true;
            }
        });
        
        if (!foundMatch) {
            console.log('NO MATCH FOUND for antenna:', status.ANTENNA);
        }
    }
    
    // Power
    if (status.POWER) {
        const [current, peak] = status.POWER.split(':').map(s => parseInt(s.replace('W', '')));
        currentPowerWatts = current;
        updatePowerMeter(current);
    }
    
    // PTT - update TX/RX indicator (process this first so we know TX state)
    let isTX = false;
    if (status.PTT) {
        if (status.PTT === 'TX') {
            elements.pttStatus.textContent = 'TX';
            elements.pttStatus.classList.remove('rx');
            elements.pttStatus.classList.add('tx');
            isTX = true;
        } else {
            elements.pttStatus.textContent = 'RX';
            elements.pttStatus.classList.remove('tx');
            elements.pttStatus.classList.add('rx');
            isTX = false;
        }
    }
    
    // VSWR - show value only when transmitting (bar graph)
    if (status.VSWR) {
        currentVSWR = parseFloat(status.VSWR);
        updateSWRMeter(currentVSWR, isTX || status.PTT === 'TX');
    } else if (!isTX) {
        // Reset to empty when not transmitting
        if (elements.swrBar) {
            elements.swrBar.style.width = '0%';
            elements.swrBar.style.background = '#0077ff';
        }
    }
    
    // Current - update both meter and readout (removed from readout bar)
    if (status.CURRENT) {
        const [current, peak] = status.CURRENT.split(':').map(s => parseInt(s.replace('A', '')));
        
        // Update current meter bar
        updateCurrentMeter(current);
    }
    
    // Temperature (handles both TEMPERATURE and TEMERATURE typo in firmware)
    const tempData = status.TEMPERATURE || status.TEMERATURE;
    if (tempData) {
        const match = tempData.match(/(\d+)DegCW(\d)/);
        if (match) {
            const temp = parseInt(match[1]);
            updateTempMeter(temp);
        }
    }
});

// Trip handler
window.geminiAPI.onAmpTrip((cause) => {
    // Immediately expand to full screen if minimized
    if (isMinimized) {
        isMinimized = false;
        const container = document.querySelector('.container');
        container.classList.remove('minimized');
        elements.minimizeBtn.textContent = '▲';
        elements.minimizeBtn.title = 'Minimize';
    }
    
    // Show modal popup - overrides everything
    const tripModal = document.getElementById('tripModal');
    const tripMessage = document.getElementById('tripMessage');
    
    tripMessage.textContent = cause || 'Protection circuit activated';
    tripModal.classList.add('show');
    
    addLog('error', `TRIP: ${cause}`);
});

// PTT handler
window.geminiAPI.onAmpPTT((ptt) => {
    // PTT changes are handled in state updates
});

// Log handler
window.geminiAPI.onLog((data) => {
    addLog(data.type, data.message);
});

// Response handler
window.geminiAPI.onAmpResponse((response) => {
    console.log('Received response:', response);
    
    // Handle power level responses and highlight buttons
    // Response can be: PH, PM, PL, or P0/P1/P2
    if (response === 'PH' || response.includes('PH')) {
        console.log('Power level: HIGH');
        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-cmd') === 'PH') {
                btn.classList.add('active');
            }
        });
    } else if (response === 'PM' || response.includes('PM')) {
        console.log('Power level: MEDIUM');
        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-cmd') === 'PM') {
                btn.classList.add('active');
            }
        });
    } else if (response === 'PL' || response.includes('PL')) {
        console.log('Power level: LOW');
        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-cmd') === 'PL') {
                btn.classList.add('active');
            }
        });
    } else {
        // Log other responses for debugging
        if (response.trim().length > 0 && response !== '1234' && response !== 'S1') {
            console.log('Unhandled response:', response);
        }
    }
});

// Test mode function (accessible from console for debugging)
window.testFullScale = function() {
    console.log('Testing full scale meters...');
    
    // Full scale power
    elements.powerBar.style.width = '100%';
    elements.powerCurrentDisplay.textContent = '1250 W';
    
    // Full scale current
    elements.currentBar.style.width = '100%';
    elements.currentMeterDisplay.textContent = '42 A';
    
    // High SWR (3.0 -> 100% red)
    updateSWRMeter(3.0, true);
    
    // TX mode
    elements.pttStatus.textContent = 'TX';
    elements.pttStatus.classList.remove('rx');
    elements.pttStatus.classList.add('tx');
    
    console.log('Full scale test applied. Run window.testReset() to clear.');
};

window.testReset = function() {
    resetDisplays();
    console.log('Displays reset.');
};

// Helper functions
function updatePowerMeter(watts) {
    const maxPower = 1250;
    const percent = Math.min((watts / maxPower) * 100, 100);
    
    elements.powerBar.style.width = percent + '%';
    elements.powerCurrentDisplay.textContent = `${watts} W`;
}

function updateCurrentMeter(amps) {
    const maxCurrent = 42;
    const percent = Math.min((amps / maxCurrent) * 100, 100);
    
    elements.currentBar.style.width = percent + '%';
    elements.currentMeterDisplay.textContent = `${amps} A`;
}

function updateSWRMeter(vswr, isTX) {
    const swrBar = elements.swrBar;
    if (!swrBar) return;
    
    // Only show bar when transmitting
    if (!isTX) {
        swrBar.style.width = '0%';
        return;
    }
    
    // Map 1.0-2.0 to 0-100%
    const percentage = Math.min(((vswr - 1.0) / 1.0) * 100, 100);
    swrBar.style.width = percentage + '%';
    
    // Set color based on SWR value
    if (vswr <= 1.5) {
        swrBar.style.background = '#0077ff';  // Blue up to 1.5
    } else if (vswr <= 1.8) {
        swrBar.style.background = '#ff8800';  // Amber from 1.5 to 1.8
    } else {
        swrBar.style.background = '#ff0000';  // Red above 1.8
    }
}

function updateTempMeter(temp) {
    const tempBar = elements.tempBar;
    if (!tempBar) return;
    
    // Map 0-80°C to 0-100%
    const percentage = Math.min((temp / 80) * 100, 100);
    tempBar.style.width = percentage + '%';
    
    // Set color based on temperature
    if (temp <= 60) {
        tempBar.style.background = '#0077ff';  // Blue up to 60°C
    } else if (temp <= 65) {
        tempBar.style.background = '#ff8800';  // Orange 60-65°C
    } else {
        tempBar.style.background = '#ff0000';  // Red above 65°C
    }
}

function updateReflectedMeter(vswr, forwardWatts) {
    // This function is no longer used - removed reflected power meter
}

function resetDisplays() {
    currentPowerWatts = 0;
    currentVSWR = 1.0;
    
    elements.powerBar.style.width = '0%';
    elements.currentBar.style.width = '0%';
    elements.powerCurrentDisplay.textContent = '0 W';
    elements.currentMeterDisplay.textContent = '0 A';
    
    // Reset SWR bar
    if (elements.swrBar) {
        elements.swrBar.style.width = '0%';
        elements.swrBar.style.background = '#0077ff';
    }
    
    // Reset temperature bar
    if (elements.tempBar) {
        elements.tempBar.style.width = '0%';
        elements.tempBar.style.background = '#0077ff';
    }
    
    elements.pttStatus.textContent = 'RX';
    elements.pttStatus.classList.remove('tx');
    elements.pttStatus.classList.add('rx');
    elements.tripAlert.style.display = 'none';
    
    // Reset toggle button
    isOperating = false;
    elements.toggleRunBtn.classList.remove('operate');
    elements.toggleRunBtn.classList.add('standby');
    elements.toggleRunBtn.textContent = 'STANDBY';
    
    // Clear active states
    document.querySelectorAll('.band-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.antenna-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.power-btn').forEach(btn => btn.classList.remove('active'));
}

function addLog(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = document.createElement('span');
    time.className = 'timestamp';
    time.textContent = `[${timestamp}]`;
    
    const msg = document.createElement('span');
    msg.textContent = message;
    
    entry.appendChild(time);
    entry.appendChild(msg);
    
    elements.logOutput.appendChild(entry);
    
    // Auto-scroll
    elements.logOutput.scrollTop = elements.logOutput.scrollHeight;
    
    // Limit log entries to 500
    const entries = elements.logOutput.children;
    if (entries.length > 500) {
        elements.logOutput.removeChild(entries[0]);
    }
}
