const express = require('express');
const cors = require('cors');
const { MT5 } = require('mt5-api'); // You'll need to install this or use MetaApi

const app = express();
app.use(cors());
app.use(express.json());

let mt5Connection = null;
let accountData = null;
let positions = [];
let history = [];

// MT5 Connection endpoint
app.post('/api/connect', async (req, res) => {
    const { server, login, password } = req.body;
    
    try {
        // Connect to MT5 using MetaTrader API
        // This is pseudo-code - you'll need actual MT5 API integration
        mt5Connection = await MT5.connect({
            server,
            login: parseInt(login),
            password
        });
        
        // Fetch initial data
        await refreshData();
        
        res.json({ success: true, message: 'Connected to MT5' });
    } catch (error) {
        console.error('MT5 connection error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get account info
app.get('/api/account', async (req, res) => {
    if (!accountData) await refreshData();
    res.json(accountData);
});

// Get open positions
app.get('/api/positions', async (req, res) => {
    if (!positions.length) await refreshData();
    res.json(positions);
});

// Get trade history
app.get('/api/history', async (req, res) => {
    if (!history.length) await refreshData();
    res.json(history);
});

// Refresh all data
async function refreshData() {
    if (!mt5Connection) return;
    
    try {
        // Get account info
        const account = await mt5Connection.getAccountInfo();
        accountData = {
            balance: account.balance,
            equity: account.equity,
            margin: account.margin,
            freeMargin: account.freeMargin,
            leverage: account.leverage,
            marginLevel: account.marginLevel
        };
        
        // Get open positions
        const openPositions = await mt5Connection.getPositions();
        positions = openPositions.map(pos => ({
            symbol: pos.symbol,
            type: pos.type,
            volume: pos.volume,
            openPrice: pos.openPrice,
            currentPrice: pos.currentPrice,
            profit: pos.profit,
            stopLoss: pos.stopLoss,
            takeProfit: pos.takeProfit
        }));
        
        // Get trade history (last 100 trades)
        const tradeHistory = await mt5Connection.getHistory();
        history = tradeHistory.slice(0, 100).map(trade => ({
            date: new Date(trade.time).toISOString().split('T')[0],
            symbol: trade.symbol,
            type: trade.type,
            volume: trade.volume,
            openPrice: trade.openPrice,
            closePrice: trade.closePrice,
            profit: trade.profit,
            commission: trade.commission,
            swap: trade.swap
        }));
        
        console.log(`Data refreshed: Balance $${accountData.balance}, ${positions.length} positions, ${history.length} history`);
    } catch (error) {
        console.error('Error refreshing data:', error);
    }
}

// Auto-refresh every 30 seconds
setInterval(refreshData, 30000);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`MT5 Bridge running on http://localhost:${PORT}`);
    console.log('Waiting for MT5 connection...');
});
