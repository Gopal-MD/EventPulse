/**
 * SmartVenue — Google Sheets Module
 * Real-time data fetching for queues and order logging
 */

const SheetsAPI = (() => {
  const _hasKeys = () => 
    CONFIG.KEYS.SHEETS !== "YOUR_SHEETS_API_KEY" && 
    CONFIG.SHEETS_DB.SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID";

  /**
   * Fetch data from a specific tab
   */
  const fetchTab = async (tabName) => {
    if (!_hasKeys()) {
      Logger.info('SheetsAPI', `Demo Mode: Returning mock data for ${tabName}`);
      return _getMockData(tabName);
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEETS_DB.SPREADSHEET_ID}/values/${tabName}?key=${CONFIG.KEYS.SHEETS}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Sheets fetch failed');
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      Logger.error('SheetsAPI', error);
      return _getMockData(tabName);
    }
  };

  /**
   * Log a food order (Feature 4 Simulation)
   */
  const logOrder = async (order) => {
    Logger.info('SheetsAPI', 'Logging order to Google Sheets/Forms webhook...', order);
    // In a real scenario, this would POST to a Google Apps Script Webhook
    // For the demo, we simulate success
    await new Promise(r => setTimeout(r, 1000));
    return true;
  };

  /**
   * Mock data fallback for stadium-specific context
   */
  const _getMockData = (tab) => {
    if (tab === CONFIG.SHEETS_DB.TABS.QUEUES) {
      return [
        ['ID', 'Name', 'Wait', 'Density'],
        ['stall-1', 'Pune Flavors', '2', 'Low'],
        ['stall-2', 'Bombay Bites', '7', 'Medium'],
        ['stall-3', 'Cool Corner', '12', 'High'],
        ['stall-4', 'Chai Point', '4', 'Low'],
        ['gate-1', 'Gate 1 (VVIP)', '2', 'Low'],
        ['gate-2', 'Gate 2 (East)', '15', 'High'],
        ['gate-4', 'Gate 4 (West)', '3', 'Low']
      ];
    }
    return [];
  };

  return { fetchTab, logOrder };
})();

/**
 * Domain-specific helpers
 */
async function getLiveQueues() {
  const rows = await SheetsAPI.fetchTab(CONFIG.SHEETS_DB.TABS.QUEUES);
  if (!rows || rows.length <= 1) return [];
  
  // Skip header row and map to objects
  return rows.slice(1).map(row => ({
    id: row[0],
    name: row[1],
    wait: parseInt(row[2]) || 0,
    density: row[3] || 'Unknown'
  }));
}
