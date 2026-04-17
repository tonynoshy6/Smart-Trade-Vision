// ─────────────────────────────────────────────────────────
// Twelve Data — OHLCV + Full Indicator Suite
// RSI · MACD · EMA · Bollinger · Stochastic · ATR
// Prev Day H/L · Volume · Fibonacci · Market Structure
// ─────────────────────────────────────────────────────────

const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY ?? "";
const BASE = "https://api.twelvedata.com";

// ─── Symbol mapping ───────────────────────────────────────
const SYMBOL_MAP: Record<string, string> = {
  eurusd: "EUR/USD", gbpusd: "GBP/USD", usdjpy: "USD/JPY",
  usdchf: "USD/CHF", audusd: "AUD/USD", usdcad: "USD/CAD",
  nzdusd: "NZD/USD", eurjpy: "EUR/JPY", gbpjpy: "GBP/JPY",
  euraud: "EUR/AUD", eurgbp: "EUR/GBP", eurcad: "EUR/CAD",
  gbpcad: "GBP/CAD", gbpaud: "GBP/AUD", chfjpy: "CHF/JPY",
  xauusd: "XAU/USD", xagusd: "XAG/USD",
  btcusd: "BTC/USD", ethusd: "ETH/USD", bnbusd: "BNB/USD",
  solusd: "SOL/USD", xrpusd: "XRP/USD", adausd: "ADA/USD",
  dotusd: "DOT/USD", linkusd: "LINK/USD", ltcusd: "LTC/USD",
  btcusdt: "BTC/USD", ethusdt: "ETH/USD", solusdt: "SOL/USD",
  xrpusdt: "XRP/USD",
};

export function resolveSymbol(raw: string): string {
  const clean = raw.toLowerCase().replace(/[/\-_]/g, "");
  return SYMBOL_MAP[clean] ?? raw.replace(/USDT$/i, "/USD").replace(/([A-Z]{3})([A-Z]{3})/i, "$1/$2").toUpperCase();
}

const TF_MAP: Record<string, string> = {
  M1: "1min", M5: "5min", M15: "15min", M30: "30min",
  H1: "1h", H4: "4h", D1: "1day", W1: "1week",
};

// ─── Candle type ──────────────────────────────────────────
interface Candle { time: string; open: number; high: number; low: number; close: number; volume?: number; }

// ─── Full output type ─────────────────────────────────────
export interface IndicatorData {
  symbol: string; timeframe: string; currentPrice: number;
  prevClose: number; open: number;
  candles: Candle[];

  // Moving averages
  ema20: number; ema50: number; ema200: number;
  sma50: number;
  priceVsEma20: "above" | "below";
  priceVsEma50: "above" | "below";
  priceVsEma200: "above" | "below";

  // Oscillators
  rsi14: number; rsiPrev: number;
  rsiSignal: "overbought" | "oversold" | "neutral";
  rsiDivergence: "bullish" | "bearish" | "none";
  stochK: number; stochD: number;
  stochSignal: "overbought" | "oversold" | "neutral";
  macd: { line: number; signal: number; histogram: number; histPrev: number; crossing: "bullish" | "bearish" | "none" };

  // Volatility
  atr14: number; atrPct: number;
  bollingerUpper: number; bollingerMid: number; bollingerLower: number;
  bollingerWidth: number; bollingerPct: number;
  bollingerSignal: "near_upper" | "near_lower" | "middle" | "breakout_up" | "breakout_down";

  // Structure
  highestHigh: number; lowestLow: number;
  prevDayHigh: number; prevDayLow: number; prevDayClose: number;
  weekHigh: number; weekLow: number;
  swingHighs: number[]; swingLows: number[];
  fibLevels: { level: string; price: number }[];
  trend: "bullish" | "bearish" | "sideways";
  trendStrength: "strong" | "moderate" | "weak";
  marketStructure: string;

  // Volume
  volumeTrend: "rising" | "falling" | "neutral" | "n/a";
  volumeAboveAvg: boolean | null;

  // Composite score
  momentumScore: number;       // 0-100 (0=strong bear, 50=neutral, 100=strong bull)
  signalAlignment: "strongly_bullish" | "bullish" | "neutral" | "bearish" | "strongly_bearish";
  tradeSuggestion: string;
  probabilityBonus: number;    // -10 to +15 — يُضاف لنسبة نجاح AI
}

// ─── Math helpers ──────────────────────────────────────────
const round = (n: number, d = 6) => parseFloat(n.toFixed(d));

function calcEMA(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0;
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) ema = values[i] * k + ema * (1 - k);
  return round(ema);
}

function calcSMA(values: number[], period: number): number {
  const slice = values.slice(-period);
  return round(slice.reduce((a, b) => a + b, 0) / slice.length);
}

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  return avgLoss === 0 ? 100 : round(100 - 100 / (1 + avgGain / avgLoss), 2);
}

function calcMACD(closes: number[]) {
  const getLine = (arr: number[]) => calcEMA(arr, 12) - calcEMA(arr, 26);
  const macdValues = closes.map((_, i) => i >= 26 ? getLine(closes.slice(0, i + 1)) : 0).filter((_, i) => i >= 26);
  const line = round(getLine(closes));
  const signal = round(calcEMA(macdValues, 9));
  const histogram = round(line - signal);
  const histPrev = macdValues.length >= 2 ? round(macdValues[macdValues.length - 2] - calcEMA(macdValues.slice(0, -1), 9)) : 0;
  const crossing: "bullish" | "bearish" | "none" =
    histPrev < 0 && histogram > 0 ? "bullish" : histPrev > 0 && histogram < 0 ? "bearish" : "none";
  return { line, signal, histogram, histPrev, crossing };
}

function calcATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 0;
  const trs = candles.slice(1).map((c, i) =>
    Math.max(c.high - c.low, Math.abs(c.high - candles[i].close), Math.abs(c.low - candles[i].close))
  );
  return round(trs.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, trs.length));
}

function calcBollinger(closes: number[], period = 20, multiplier = 2) {
  const mid = calcSMA(closes, period);
  const slice = closes.slice(-period);
  const variance = slice.reduce((acc, v) => acc + (v - mid) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  const upper = round(mid + multiplier * std);
  const lower = round(mid - multiplier * std);
  const width = round((upper - lower) / mid * 100, 4);
  const price = closes[closes.length - 1];
  const pct = round((price - lower) / (upper - lower) * 100, 2);
  const bollingerSignal: "near_upper" | "near_lower" | "middle" | "breakout_up" | "breakout_down" =
    price > upper ? "breakout_up" : price < lower ? "breakout_down" :
    pct > 80 ? "near_upper" : pct < 20 ? "near_lower" : "middle";
  return { upper, mid: round(mid), lower, width, pct, bollingerSignal };
}

function calcStochastic(candles: Candle[], kPeriod = 14, dPeriod = 3): { k: number; d: number } {
  if (candles.length < kPeriod) return { k: 50, d: 50 };
  const recent = candles.slice(-kPeriod);
  const high = Math.max(...recent.map(c => c.high));
  const low = Math.min(...recent.map(c => c.low));
  const close = candles[candles.length - 1].close;
  const k = high === low ? 50 : round((close - low) / (high - low) * 100, 2);
  const kValues = candles.slice(-(kPeriod + dPeriod)).map((_, i, arr) => {
    const slice = arr.slice(i, i + kPeriod);
    if (slice.length < kPeriod) return 50;
    const h = Math.max(...slice.map(c => c.high));
    const l = Math.min(...slice.map(c => c.low));
    const c2 = slice[slice.length - 1].close;
    return h === l ? 50 : (c2 - l) / (h - l) * 100;
  });
  const d = round(kValues.slice(-dPeriod).reduce((a, b) => a + b, 0) / dPeriod, 2);
  return { k, d };
}

function detectSwings(candles: Candle[], lookback = 5): { highs: number[]; lows: number[] } {
  const highs: number[] = [], lows: number[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const isHigh = candles.slice(i - lookback, i + lookback + 1).every((c, j) => j === lookback || c.high <= candles[i].high);
    const isLow  = candles.slice(i - lookback, i + lookback + 1).every((c, j) => j === lookback || c.low  >= candles[i].low);
    if (isHigh) highs.push(round(candles[i].high));
    if (isLow)  lows.push(round(candles[i].low));
  }
  return { highs: highs.slice(-5), lows: lows.slice(-5) };
}

function calcFibLevels(high: number, low: number, bullish: boolean): { level: string; price: number }[] {
  const diff = high - low;
  const levels = bullish
    ? [
        { level: "0% (القاع)", price: round(low) },
        { level: "23.6%", price: round(low + diff * 0.236) },
        { level: "38.2%", price: round(low + diff * 0.382) },
        { level: "50% (وسط النطاق)", price: round(low + diff * 0.5) },
        { level: "61.8% (OTE)", price: round(low + diff * 0.618) },
        { level: "78.6%", price: round(low + diff * 0.786) },
        { level: "100% (القمة)", price: round(high) },
      ]
    : [
        { level: "0% (القمة)", price: round(high) },
        { level: "23.6%", price: round(high - diff * 0.236) },
        { level: "38.2%", price: round(high - diff * 0.382) },
        { level: "50% (وسط النطاق)", price: round(high - diff * 0.5) },
        { level: "61.8% (OTE)", price: round(high - diff * 0.618) },
        { level: "78.6%", price: round(high - diff * 0.786) },
        { level: "100% (القاع)", price: round(low) },
      ];
  return levels;
}

// ─── Main fetch ───────────────────────────────────────────
export async function fetchIndicators(rawSymbol: string, timeframe: string): Promise<IndicatorData | null> {
  if (!TWELVE_DATA_KEY) return null;
  const sym = resolveSymbol(rawSymbol);
  const tf  = TF_MAP[timeframe] ?? "1h";
  const url = `${BASE}/time_series?symbol=${encodeURIComponent(sym)}&interval=${tf}&outputsize=300&apikey=${TWELVE_DATA_KEY}`;

  let data: any;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    data = await resp.json();
  } catch { return null; }
  if (!data?.values?.length) return null;

  const candles: Candle[] = (data.values as any[]).reverse().map((v: any) => ({
    time: v.datetime, open: parseFloat(v.open), high: parseFloat(v.high),
    low: parseFloat(v.low), close: parseFloat(v.close),
    volume: v.volume ? parseFloat(v.volume) : undefined,
  }));

  const closes  = candles.map(c => c.close);
  const highs   = candles.map(c => c.high);
  const lows    = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume ?? 0);

  const currentPrice = closes[closes.length - 1];
  const prevClose    = closes[closes.length - 2] ?? currentPrice;
  const open         = candles[candles.length - 1].open;

  // EMAs
  const ema20  = calcEMA(closes, 20);
  const ema50  = calcEMA(closes, 50);
  const ema200 = calcEMA(closes, 200);
  const sma50  = calcSMA(closes, 50);

  // RSI (current + prev for divergence)
  const rsi14    = calcRSI(closes, 14);
  const rsiPrev  = closes.length > 1 ? calcRSI(closes.slice(0, -1), 14) : rsi14;
  const rsiSignal: "overbought" | "oversold" | "neutral" = rsi14 >= 70 ? "overbought" : rsi14 <= 30 ? "oversold" : "neutral";

  // RSI Divergence (price new high/low but RSI not)
  const recentHighs = highs.slice(-20); const recentLows = lows.slice(-20);
  const recentRsis  = closes.slice(-20).map((_, i) => calcRSI(closes.slice(0, closes.length - 19 + i), 14));
  const priceNewHigh = currentPrice >= Math.max(...recentHighs.slice(0, -1));
  const priceNewLow  = currentPrice <= Math.min(...recentLows.slice(0, -1));
  const rsiNewHigh   = rsi14 >= Math.max(...recentRsis.slice(0, -1));
  const rsiNewLow    = rsi14 <= Math.min(...recentRsis.slice(0, -1));
  const rsiDivergence: "bullish" | "bearish" | "none" =
    priceNewLow && !rsiNewLow ? "bullish" : priceNewHigh && !rsiNewHigh ? "bearish" : "none";

  // Stochastic
  const stoch = calcStochastic(candles);
  const stochSignal: "overbought" | "oversold" | "neutral" =
    stoch.k >= 80 ? "overbought" : stoch.k <= 20 ? "oversold" : "neutral";

  // MACD
  const macd = calcMACD(closes);

  // ATR
  const atr14  = calcATR(candles, 14);
  const atrPct = round(atr14 / currentPrice * 100, 4);

  // Bollinger
  const bb = calcBollinger(closes);

  // Structure
  const highestHigh = round(Math.max(...highs.slice(-50)));
  const lowestLow   = round(Math.min(...lows.slice(-50)));

  // Previous Day H/L/C — find last candle of different day
  const todayDate = candles[candles.length - 1].time.slice(0, 10);
  let prevDayHigh = currentPrice, prevDayLow = currentPrice, prevDayClose = prevClose;
  const prevDayCandles = candles.filter(c => c.time.slice(0, 10) < todayDate);
  if (prevDayCandles.length > 0) {
    const lastDay = prevDayCandles[prevDayCandles.length - 1].time.slice(0, 10);
    const dayCandles = prevDayCandles.filter(c => c.time.slice(0, 10) === lastDay);
    prevDayHigh  = round(Math.max(...dayCandles.map(c => c.high)));
    prevDayLow   = round(Math.min(...dayCandles.map(c => c.low)));
    prevDayClose = round(dayCandles[dayCandles.length - 1].close);
  }

  // Week H/L (last 5 trading days ≈ 1 week of H1 data = 40 H1 candles)
  const weekCandles = candles.slice(-40);
  const weekHigh = round(Math.max(...weekCandles.map(c => c.high)));
  const weekLow  = round(Math.min(...weekCandles.map(c => c.low)));

  // Swing highs/lows
  const swings = detectSwings(candles);

  // Fibonacci (from last 50-candle range)
  const bullBias = ema50 < currentPrice;
  const fibLevels = calcFibLevels(highestHigh, lowestLow, bullBias);

  // Volume trend
  let volumeTrend: "rising" | "falling" | "neutral" | "n/a" = "n/a";
  let volumeAboveAvg: boolean | null = null;
  if (volumes.some(v => v > 0)) {
    const recent5  = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const prior5   = volumes.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
    const avgVol   = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    volumeTrend    = recent5 > prior5 * 1.1 ? "rising" : recent5 < prior5 * 0.9 ? "falling" : "neutral";
    volumeAboveAvg = volumes[volumes.length - 1] > avgVol;
  }

  // Trend
  const priceVsEma20:  "above" | "below" = currentPrice >= ema20  ? "above" : "below";
  const priceVsEma50:  "above" | "below" = currentPrice >= ema50  ? "above" : "below";
  const priceVsEma200: "above" | "below" = currentPrice >= ema200 ? "above" : "below";
  const bullSignals = [priceVsEma20 === "above", priceVsEma50 === "above", macd.histogram > 0, rsi14 > 50].filter(Boolean).length;
  const bearSignals = [priceVsEma20 === "below", priceVsEma50 === "below", macd.histogram < 0, rsi14 < 50].filter(Boolean).length;
  const trend: "bullish" | "bearish" | "sideways" = bullSignals >= 3 ? "bullish" : bearSignals >= 3 ? "bearish" : "sideways";
  const trendStrength: "strong" | "moderate" | "weak" =
    (bullSignals === 4 || bearSignals === 4) ? "strong" :
    (bullSignals === 3 || bearSignals === 3) ? "moderate" : "weak";

  // Market structure summary
  const hhCount = swings.highs.filter((h, i) => i > 0 && h > swings.highs[i - 1]).length;
  const llCount = swings.lows.filter((l, i) => i > 0 && l < swings.lows[i - 1]).length;
  const marketStructure = hhCount > llCount ? "قمم وقيعان صاعدة (HH + HL) — هيكل صاعد" :
                          llCount > hhCount ? "قمم وقيعان هابطة (LH + LL) — هيكل هابط" :
                          "هيكل عرضي أو غير محدد";

  // Momentum score (0–100)
  let score = 50;
  if (priceVsEma20  === "above") score += 6; else score -= 6;
  if (priceVsEma50  === "above") score += 8; else score -= 8;
  if (priceVsEma200 === "above") score += 6; else score -= 6;
  if (macd.histogram > 0)        score += 8; else score -= 8;
  if (macd.crossing === "bullish") score += 5; else if (macd.crossing === "bearish") score -= 5;
  score += (rsi14 - 50) * 0.3;
  if (stochSignal === "oversold")   score += 5; else if (stochSignal === "overbought") score -= 5;
  if (rsiDivergence === "bullish")  score += 6; else if (rsiDivergence === "bearish")  score -= 6;
  if (bb.bollingerSignal === "near_lower") score += 4; else if (bb.bollingerSignal === "near_upper") score -= 4;
  score = Math.max(0, Math.min(100, round(score, 1)));

  // Signal alignment
  const signalAlignment: "strongly_bullish" | "bullish" | "neutral" | "bearish" | "strongly_bearish" =
    score >= 75 ? "strongly_bullish" : score >= 60 ? "bullish" :
    score <= 25 ? "strongly_bearish" : score <= 40 ? "bearish" : "neutral";

  // Trade suggestion + probability bonus
  let tradeSuggestion = "";
  let probabilityBonus = 0;
  if (signalAlignment === "strongly_bullish") {
    tradeSuggestion = "المؤشرات تؤيد الشراء بقوة — ابحث عن إعداد شراء في الشارت";
    probabilityBonus = 10;
  } else if (signalAlignment === "bullish") {
    tradeSuggestion = "المؤشرات تميل للصعود — الشراء من منطقة دعم أو OB له أفضلية";
    probabilityBonus = 5;
  } else if (signalAlignment === "strongly_bearish") {
    tradeSuggestion = "المؤشرات تؤيد البيع بقوة — ابحث عن إعداد بيع في الشارت";
    probabilityBonus = 10;
  } else if (signalAlignment === "bearish") {
    tradeSuggestion = "المؤشرات تميل للهبوط — البيع من منطقة مقاومة أو OB له أفضلية";
    probabilityBonus = 5;
  } else {
    tradeSuggestion = "المؤشرات متضاربة — انتظر تأكيداً أوضح قبل الدخول";
    probabilityBonus = -5;
  }

  // If RSI divergence confirms trade direction
  if (rsiDivergence === "bullish" && (signalAlignment === "bullish" || signalAlignment === "strongly_bullish")) probabilityBonus += 3;
  if (rsiDivergence === "bearish" && (signalAlignment === "bearish" || signalAlignment === "strongly_bearish")) probabilityBonus += 3;

  // If MACD crossing
  if (macd.crossing !== "none") probabilityBonus += 2;

  probabilityBonus = Math.max(-10, Math.min(15, probabilityBonus));

  return {
    symbol: sym, timeframe: tf, currentPrice, prevClose, open,
    candles: candles.slice(-20),
    ema20, ema50, ema200, sma50,
    priceVsEma20, priceVsEma50, priceVsEma200,
    rsi14, rsiPrev, rsiSignal, rsiDivergence,
    stochK: stoch.k, stochD: stoch.d, stochSignal,
    macd,
    atr14, atrPct,
    bollingerUpper: bb.upper, bollingerMid: bb.mid, bollingerLower: bb.lower,
    bollingerWidth: bb.width, bollingerPct: bb.pct, bollingerSignal: bb.bollingerSignal,
    highestHigh, lowestLow,
    prevDayHigh, prevDayLow, prevDayClose,
    weekHigh, weekLow,
    swingHighs: swings.highs, swingLows: swings.lows,
    fibLevels,
    trend, trendStrength, marketStructure,
    volumeTrend, volumeAboveAvg,
    momentumScore: score,
    signalAlignment,
    tradeSuggestion,
    probabilityBonus,
  };
}

// ─── Format for AI prompt ─────────────────────────────────
export function formatIndicatorsForPrompt(ind: IndicatorData): string {
  const p = (n: number) => n >= 1000 ? n.toFixed(2) : n >= 10 ? n.toFixed(4) : n.toFixed(6);
  const pct = (n: number) => n.toFixed(2) + "%";

  const macdCrossText = ind.macd.crossing === "bullish" ? "⚡ تقاطع صاعد جديد (Bullish Cross)!" :
                        ind.macd.crossing === "bearish" ? "⚡ تقاطع هابط جديد (Bearish Cross)!" : "لا تقاطع حالي";

  const rsiDivText = ind.rsiDivergence === "bullish" ? "⚠️ تباين صاعد (Bullish Divergence) — السعر قاع جديد لكن RSI لا!" :
                     ind.rsiDivergence === "bearish" ? "⚠️ تباين هابط (Bearish Divergence) — السعر قمة جديدة لكن RSI لا!" :
                     "لا تباين مرئي";

  const bbSignalText: Record<string, string> = {
    near_upper:    "قريب من الحد العلوي — ضغط بيع محتمل",
    near_lower:    "قريب من الحد السفلي — ارتداد محتمل",
    middle:        "في المنتصف — لا إشارة واضحة",
    breakout_up:   "🔥 اختراق الحد العلوي! — زخم قوي أو تشبع شراء",
    breakout_down: "🔥 كسر الحد السفلي! — زخم هابط قوي أو تشبع بيع",
  };

  const fibStr = ind.fibLevels.map(f => `  • ${f.level}: ${p(f.price)}`).join("\n");
  const swingHStr = ind.swingHighs.length ? ind.swingHighs.map(p).join(" — ") : "غير محددة";
  const swingLStr = ind.swingLows.length  ? ind.swingLows.map(p).join(" — ")  : "غير محددة";

  const volStr = ind.volumeTrend === "n/a" ? "غير متاح (فوركس/ذهب)"
    : `${ind.volumeTrend === "rising" ? "📈 متصاعد" : ind.volumeTrend === "falling" ? "📉 متراجع" : "➡️ مستقر"} ${ind.volumeAboveAvg ? "(فوق المتوسط)" : "(تحت المتوسط)"}`;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 بيانات السوق الحقيقية — ${ind.symbol} | ${ind.timeframe}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨🚨🚨 تحذير إلزامي — اقرأ هذا أولاً قبل أي شيء آخر 🚨🚨🚨
السعر الحالي الحقيقي من API هو: [ ${p(ind.currentPrice)} ]
هذا رقم حقيقي ودقيق 100% — ليس تقديراً.
• نقطة الدخول يجب أن تكون قريبة من ${p(ind.currentPrice)} (مع فارق منطقي للـ OB أو معلق أو بعيد بحد أقصى 10%).
• إذا قرأت من الصورة أي سعر مختلف جذرياً عن ${p(ind.currentPrice)} → استخدم ${p(ind.currentPrice)} كمرجع وليس الصورة.
• أي entry أو SL أو TP يجب أن يكون منطقياً بالنسبة لهذا السعر.
🚨🚨🚨 نهاية التحذير 🚨🚨🚨

🔑 السعر الحالي الدقيق: ${p(ind.currentPrice)}
   الإغلاق السابق: ${p(ind.prevClose)} | الافتتاح: ${p(ind.open)}

📊 هيكل السوق وأهم المستويات:
   ${ind.marketStructure}
   أعلى سعر (50 شمعة): ${p(ind.highestHigh)} | أدنى سعر: ${p(ind.lowestLow)}
   أعلى الأسبوع: ${p(ind.weekHigh)} | أدنى الأسبوع: ${p(ind.weekLow)}
   Previous Day High: ${p(ind.prevDayHigh)} ← مستوى ICT مهم جداً
   Previous Day Low:  ${p(ind.prevDayLow)}  ← مستوى ICT مهم جداً
   Previous Day Close: ${p(ind.prevDayClose)}
   Swing Highs الأخيرة: ${swingHStr}
   Swing Lows الأخيرة:  ${swingLStr}

📐 مستويات فيبوناتشي (من آخر نطاق رئيسي):
${fibStr}

📈 المتوسطات المتحركة:
   EMA 20  = ${p(ind.ema20)} ← السعر ${ind.priceVsEma20 === "above" ? "فوقها ✅" : "تحتها 🔴"}
   EMA 50  = ${p(ind.ema50)} ← السعر ${ind.priceVsEma50 === "above" ? "فوقها ✅" : "تحتها 🔴"}
   EMA 200 = ${p(ind.ema200)} ← السعر ${ind.priceVsEma200 === "above" ? "فوقها ✅ (اتجاه رئيسي صاعد)" : "تحتها 🔴 (اتجاه رئيسي هابط)"}

🔵 RSI (14): ${ind.rsi14} ${ind.rsiSignal === "overbought" ? "⚠️ تشبع شراء (>70)" : ind.rsiSignal === "oversold" ? "⚠️ تشبع بيع (<30)" : "✅ محايد"}
   RSI السابق: ${ind.rsiPrev} | ${rsiDivText}

🟡 Stochastic (14,3): K=${ind.stochK} | D=${ind.stochD}
   ${ind.stochSignal === "overbought" ? "⚠️ تشبع شراء (>80)" : ind.stochSignal === "oversold" ? "⚠️ تشبع بيع (<20)" : "✅ محايد"}

📉 MACD (12,26,9):
   Line=${ind.macd.line} | Signal=${ind.macd.signal} | Histogram=${ind.macd.histogram}
   ${macdCrossText}

🎯 Bollinger Bands (20,2):
   Upper=${p(ind.bollingerUpper)} | Mid=${p(ind.bollingerMid)} | Lower=${p(ind.bollingerLower)}
   Width=${pct(ind.bollingerWidth)} | %B=${pct(ind.bollingerPct)} → ${bbSignalText[ind.bollingerSignal]}

📏 ATR (14): ${p(ind.atr14)} (${pct(ind.atrPct)} من السعر)
   ← وقف الخسارة المنطقي = 1.5–2× ATR = ${p(ind.atr14 * 1.5)} إلى ${p(ind.atr14 * 2)}

📦 الحجم (Volume): ${volStr}

🏆 حكم المؤشرات المركّب:
   نقاط الزخم: ${ind.momentumScore}/100 → ${
     ind.momentumScore >= 75 ? "قوي جداً للصعود 🟢" :
     ind.momentumScore >= 60 ? "يميل للصعود 🟡" :
     ind.momentumScore <= 25 ? "قوي جداً للهبوط 🔴" :
     ind.momentumScore <= 40 ? "يميل للهبوط 🟠" : "محايد / متضارب ⚪"
   }
   التوافق: ${ind.signalAlignment.replace("_", " ").toUpperCase()}
   ✅ ${ind.tradeSuggestion}
   📊 مكافأة/خصم نسبة النجاح من المؤشرات: ${ind.probabilityBonus >= 0 ? "+" : ""}${ind.probabilityBonus}%

⚠️ تعليمات إلزامية لاستخدام هذه البيانات:
① السعر الحالي الدقيق (${p(ind.currentPrice)}) = مرجعك الأول لجميع الأرقام.
② Previous Day High (${p(ind.prevDayHigh)}) وLow (${p(ind.prevDayLow)}) = مستويات ICT للسيولة — استخدمها كأهداف أو عوائق.
③ ATR = ${p(ind.atr14)} → وقف الخسارة لا يقل عن 1.5× ATR = ${p(ind.atr14 * 1.5)}.
④ نقاط الزخم ${ind.momentumScore}/100: إذا الصفقة مع اتجاه المؤشرات أضف +${Math.abs(ind.probabilityBonus)}% للنسبة، وإذا عكسها اطرح 5%.
⑤ مستويات فيبوناتشي ← استخدم 50% و61.8% كمناطق OTE للدخول والـ 127.2% و161.8% كأهداف.
⑥ Bollinger Bands: السعر قرب الحد السفلي = منطقة شراء محتملة، قرب العلوي = بيع محتمل.
`;
}
