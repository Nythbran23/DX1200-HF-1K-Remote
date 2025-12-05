// Universal Keyboard Controller for DX1200 Gemini Remote
// Uses only simple letter keys - works on ALL platforms

class KeyboardController {
  constructor(sendCommand, speak) {
    this.sendCommand = sendCommand;
    this.speak = speak;
    this.speechEnabled = false;
    this.mode = 'normal';  // Modes: 'normal', 'band', 'antenna', 'power'
    this.initialize();
  }

  initialize() {
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    console.log('Universal Keyboard Controller initialized');
    console.log('Press ? for help');
  }

  handleKeyPress(e) {
    // Don't intercept if typing in input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = e.key.toLowerCase();
    
    // ========================================
    // MODE SWITCHING (Prefix Keys)
    // ========================================
    
    // 'b' = Band mode (next key selects band)
    if (key === 'b' && this.mode === 'normal') {
      e.preventDefault();
      this.mode = 'band';
      console.log('BAND mode - press 1-9, 0, x, or y');
      this.speak('Band mode');
      setTimeout(() => this.mode = 'normal', 3000); // Reset after 3s
      return;
    }
    
    // 'a' = Antenna mode (next key selects antenna)
    if (key === 'a' && this.mode === 'normal') {
      e.preventDefault();
      this.mode = 'antenna';
      console.log('ANTENNA mode - press A, B, or C');
      this.speak('Antenna mode');
      setTimeout(() => this.mode = 'normal', 3000); // Reset after 3s
      return;
    }
    
    // 'p' = Power mode (next key selects power)
    if (key === 'p' && this.mode === 'normal') {
      e.preventDefault();
      this.mode = 'power';
      console.log('POWER mode - press h, m, or l');
      this.speak('Power mode');
      setTimeout(() => this.mode = 'normal', 3000);
      return;
    }
    
    // ========================================
    // BAND SELECTION (after pressing 'b')
    // ========================================
    if (this.mode === 'band') {
      e.preventDefault();
      this.mode = 'normal';
      
      if (key === '1') { this.sendCommand('B1.8MHZ'); this.speakIfEnabled('Band 1.8 megahertz'); return; }
      if (key === '2') { this.sendCommand('B3.5MHZ'); this.speakIfEnabled('Band 3.5 megahertz'); return; }
      if (key === '3') { this.sendCommand('B5MHZ'); this.speakIfEnabled('Band 5 megahertz'); return; }
      if (key === '4') { this.sendCommand('B7MHZ'); this.speakIfEnabled('Band 7 megahertz'); return; }
      if (key === '5') { this.sendCommand('B10MHZ'); this.speakIfEnabled('Band 10 megahertz'); return; }
      if (key === '6') { this.sendCommand('B14MHZ'); this.speakIfEnabled('Band 14 megahertz'); return; }
      if (key === '7') { this.sendCommand('B18MHZ'); this.speakIfEnabled('Band 18 megahertz'); return; }
      if (key === '8') { this.sendCommand('B21MHZ'); this.speakIfEnabled('Band 21 megahertz'); return; }
      if (key === '9') { this.sendCommand('B24MHZ'); this.speakIfEnabled('Band 24 megahertz'); return; }
      if (key === '0') { this.sendCommand('B28MHZ'); this.speakIfEnabled('Band 28 megahertz'); return; }
      if (key === 'x') { this.sendCommand('B50MHZ'); this.speakIfEnabled('Band 50 megahertz'); return; }
      if (key === 'y') { this.sendCommand('B70MHZ'); this.speakIfEnabled('Band 70 megahertz'); return; }
      
      console.log('Invalid band selection');
      return;
    }
    
    // ========================================
    // ANTENNA SELECTION (after pressing 'a')
    // ========================================
    if (this.mode === 'antenna') {
      e.preventDefault();
      this.mode = 'normal';
      
      // Get current band from global state
      const currentBand = window.currentBand || '';
      console.log('Antenna selection - currentBand:', currentBand);
      
      if (!currentBand) {
        console.warn('No band set! Cannot select antenna without band.');
        this.speak('Please select a band first');
        return;
      }
      
      if (key === 'a') { 
        const cmd = 'B' + currentBand + ',A';
        console.log('Sending antenna command:', cmd);
        this.sendCommand(cmd); 
        this.speakIfEnabled('Antenna A'); 
        return; 
      }
      if (key === 'b') { 
        const cmd = 'B' + currentBand + ',B';
        console.log('Sending antenna command:', cmd);
        this.sendCommand(cmd); 
        this.speakIfEnabled('Antenna B'); 
        return; 
      }
      if (key === 'c') { 
        const cmd = 'B' + currentBand + ',C';
        console.log('Sending antenna command:', cmd);
        this.sendCommand(cmd); 
        this.speakIfEnabled('Antenna C'); 
        return; 
      }
      
      console.log('Invalid antenna selection');
      return;
    }
    
    // ========================================
    // POWER SELECTION (after pressing 'p')
    // ========================================
    if (this.mode === 'power') {
      e.preventDefault();
      this.mode = 'normal';
      
      if (key === 'h') { this.sendCommand('PH'); this.speakIfEnabled('High power'); return; }
      if (key === 'm') { this.sendCommand('PM'); this.speakIfEnabled('Medium power'); return; }
      if (key === 'l') { this.sendCommand('PL'); this.speakIfEnabled('Low power'); return; }
      
      console.log('Invalid power selection');
      return;
    }
    
    // ========================================
    // DIRECT COMMANDS (Normal Mode)
    // ========================================
    if (this.mode === 'normal') {
      
      // Run/Standby
      if (key === 'r') {
        e.preventDefault();
        this.sendCommand('R1');
        this.speakIfEnabled('Run mode');
        return;
      }
      if (key === 's') {
        e.preventDefault();
        this.sendCommand('R0');
        this.speakIfEnabled('Standby mode');
        return;
      }
      
      // Clear Trip
      if (key === 'd') {
        e.preventDefault();
        this.sendCommand('T');
        this.speakIfEnabled('Trip cleared');
        return;
      }
      
      // Status Reports
      if (key === 'w') {
        e.preventDefault();
        this.requestStatusReport('swr');
        return;
      }
      if (key === 't') {
        e.preventDefault();
        this.requestStatusReport('temperature');
        return;
      }
      if (key === 'k') {
        e.preventDefault();
        this.requestStatusReport('peak-power');
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        this.requestStatusReport('status');
        return;
      }
      
      // Toggle Speech
      if (key === 'o') {
        e.preventDefault();
        this.speechEnabled = !this.speechEnabled;
        this.speak(this.speechEnabled ? 'Speech enabled' : 'Speech disabled');
        console.log(`Speech ${this.speechEnabled ? 'enabled' : 'disabled'}`);
        return;
      }
      
      // Help
      if (key === '?') {
        e.preventDefault();
        this.showHelp();
        return;
      }
    }
  }

  requestStatusReport(type) {
    const event = new CustomEvent('keyboard-status-request', { 
      detail: { type: type } 
    });
    document.dispatchEvent(event);
    console.log(`Status report requested: ${type}`);
  }

  speakIfEnabled(text) {
    if (this.speechEnabled) {
      this.speak(text);
    }
  }

  showHelp() {
    console.log('='.repeat(50));
    console.log('KEYBOARD COMMANDS:');
    console.log('='.repeat(50));
    console.log('B + [1-9,0,X,Y]  = Select band (1.8-70 MHz)');
    console.log('A + [A,B,C]      = Select antenna A/B/C (requires band set)');
    console.log('P + [H,M,L]      = Select power High/Med/Low');
    console.log('');
    console.log('R = Run         S = Standby     D = Clear trip');
    console.log('W = SWR         T = Temperature K = Peak power');
    console.log('I = Status      O = Toggle speech');
    console.log('? = This help');
    console.log('='.repeat(50));
    
    this.speak('Help displayed in console');
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeyboardController;
}
