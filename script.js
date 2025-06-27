// --- Configuration ---
const API_KEY = 'd1f47o9r01qsg7daad60d1f47o9r01qsg7daad6g'
const API_URL = 'https://finnhub.io/api/v1/';

// List of stock tickers you want to display
const STOCK_TICKERS = [
    'AAPL', // Apple Inc.
    'GOOGL', // Alphabet Inc. (Google)
    'MSFT', // Microsoft Corp.
    'AMZN', // Amazon.com Inc.
    'TSLA', // Tesla Inc.
    'NVDA', // NVIDIA Corporation
    'JPM', // JPMorgan Chase & Co.
    'V', // Visa Inc.
    // Add more tickers as needed
];

const ROTATION_INTERVAL_MS = 15 * 1000; // Time to display each stock (e.g., 15 seconds)
const DATA_UPDATE_INTERVAL_MS = 60 * 1000; // How often to refresh data from API (e.g., 60 seconds)
                                          // Be mindful of API rate limits!

// --- DOM Elements ---
const companyNameEl = document.getElementById('company-name');
const stockTickerEl = document.getElementById('stock-ticker');
const currentPriceEl = document.getElementById('current-price');
const priceChangeEl = document.getElementById('price-change');
const openPriceEl = document.getElementById('open-price');
const highPriceEl = document.getElementById('high-price');
const lowPriceEl = document.getElementById('low-price');
const previousCloseEl = document.getElementById('previous-close');
const lastUpdatedEl = document.getElementById('last-updated');
const stockContainer = document.getElementById('stock-container');

// --- State Variables ---
let currentStockIndex = 0;
let stockDataCache = {}; // To store fetched data and avoid re-fetching frequently

// --- Functions ---

// Fetches company profile (for full name)
async function fetchCompanyProfile(symbol) {
    if (stockDataCache[symbol] && stockDataCache[symbol].profile && (Date.now() - stockDataCache[symbol].profile.timestamp < DATA_UPDATE_INTERVAL_MS)) {
        return stockDataCache[symbol].profile.data; // Return cached profile
    }

    try {
        const response = await fetch(`${API_URL}stock/profile2?symbol=${symbol}&token=${API_KEY}`);
        const data = await response.json();
        if (data && data.name) {
            if (!stockDataCache[symbol]) stockDataCache[symbol] = {};
            stockDataCache[symbol].profile = { data: data, timestamp: Date.now() };
            return data;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching profile for ${symbol}:`, error);
        return null;
    }
}

// Fetches real-time quote
async function fetchStockQuote(symbol) {
    if (stockDataCache[symbol] && stockDataCache[symbol].quote && (Date.now() - stockDataCache[symbol].quote.timestamp < DATA_UPDATE_INTERVAL_MS)) {
        return stockDataCache[symbol].quote.data; // Return cached quote
    }

    try {
        const response = await fetch(`${API_URL}quote?symbol=${symbol}&token=${API_KEY}`);
        const data = await response.json();
        // Finnhub quote data: c (current), h (high), l (low), o (open), pc (previous close), dp (percent change), d (change)
        if (data && data.c !== undefined) {
            if (!stockDataCache[symbol]) stockDataCache[symbol] = {};
            stockDataCache[symbol].quote = { data: data, timestamp: Date.now() };
            return data;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
        return null;
    }
}


// Displays the current stock's data
async function displayStock(symbol) {
    // Reset animations
    stockContainer.style.animation = 'none';
    void stockContainer.offsetWidth; // Trigger reflow
    stockContainer.style.animation = null; // Re-enable animation

    const [profile, quote] = await Promise.all([
        fetchCompanyProfile(symbol),
        fetchStockQuote(symbol)
    ]);

    if (profile && quote) {
        companyNameEl.textContent = profile.name || 'N/A';
        stockTickerEl.textContent = symbol;
        currentPriceEl.textContent = `$${quote.c.toFixed(2)}`;
        openPriceEl.textContent = `$${quote.o.toFixed(2)}`;
        highPriceEl.textContent = `$${quote.h.toFixed(2)}`;
        lowPriceEl.textContent = `$${quote.l.toFixed(2)}`;
        previousCloseEl.textContent = `$${quote.pc.toFixed(2)}`;

        // Calculate change and percentage change for display
        const change = quote.c - quote.pc;
        const percentChange = (change / quote.pc) * 100;

        priceChangeEl.textContent = `${change.toFixed(2)} (${percentChange.toFixed(2)}%)`;

        // Apply color based on change
        currentPriceEl.classList.remove('positive', 'negative');
        priceChangeEl.classList.remove('positive', 'negative');
        if (change > 0) {
            currentPriceEl.classList.add('positive');
            priceChangeEl.classList.add('positive');
        } else if (change < 0) {
            currentPriceEl.classList.add('negative');
            priceChangeEl.classList.add('negative');
        }

        lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    } else {
        // Handle case where data couldn't be fetched
        companyNameEl.textContent = `Error loading ${symbol}`;
        stockTickerEl.textContent = '';
        currentPriceEl.textContent = '';
        priceChangeEl.textContent = '';
        openPriceEl.textContent = '';
        highPriceEl.textContent = '';
        lowPriceEl.textContent = '';
        previousCloseEl.textContent = '';
        lastUpdatedEl.textContent = 'Please check API key or symbol.';
        currentPriceEl.classList.remove('positive', 'negative');
        priceChangeEl.classList.remove('positive', 'negative');
    }
}

// Rotates to the next stock in the list
function rotateStock() {
    currentStockIndex = (currentStockIndex + 1) % STOCK_TICKERS.length;
    displayStock(STOCK_TICKERS[currentStockIndex]);
}

// Initial display and start rotation
document.addEventListener('DOMContentLoaded', () => {
    if (STOCK_TICKERS.length > 0) {
        displayStock(STOCK_TICKERS[currentStockIndex]); // Display first stock immediately
        setInterval(rotateStock, ROTATION_INTERVAL_MS); // Start rotation
    } else {
        companyNameEl.textContent = "No stocks defined!";
        lastUpdatedEl.textContent = "Please add tickers to STOCK_TICKERS array in script.js";
    }
});

// Optional: Periodically refresh all data in cache for accuracy
setInterval(() => {
    console.log("Refreshing all stock data in cache...");
    stockDataCache = {}; // Clear cache to force fresh fetches
    // You could also iterate through STOCK_TICKERS and call fetchStockQuote/Profile for each
}, DATA_UPDATE_INTERVAL_MS);