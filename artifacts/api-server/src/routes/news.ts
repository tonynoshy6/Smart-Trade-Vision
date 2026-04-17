import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

// ─── جلب الأسعار الحقيقية ───────────────────────────────────
async function fetchRealPrices(): Promise<Record<string, string>> {
  const prices: Record<string, string> = {};

  try {
    const [goldRes, btcRes, ethRes, forexRes] = await Promise.allSettled([
      fetch("https://api.coinbase.com/v2/prices/XAU-USD/spot"),
      fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot"),
      fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot"),
      fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,CHF,AUD,CAD"),
    ]);

    if (goldRes.status === "fulfilled" && goldRes.value.ok) {
      const d = await goldRes.value.json() as { data: { amount: string } };
      prices.goldUSD = Number(d.data.amount).toFixed(2);
    }
    if (btcRes.status === "fulfilled" && btcRes.value.ok) {
      const d = await btcRes.value.json() as { data: { amount: string } };
      prices.btcUSD = Number(d.data.amount).toFixed(2);
    }
    if (ethRes.status === "fulfilled" && ethRes.value.ok) {
      const d = await ethRes.value.json() as { data: { amount: string } };
      prices.ethUSD = Number(d.data.amount).toFixed(2);
    }
    if (forexRes.status === "fulfilled" && forexRes.value.ok) {
      const d = await forexRes.value.json() as { rates: Record<string, number> };
      const r = d.rates;
      if (r.EUR) prices.EURUSD = (1 / r.EUR).toFixed(5);
      if (r.GBP) prices.GBPUSD = (1 / r.GBP).toFixed(5);
      if (r.JPY) prices.USDJPY = r.JPY.toFixed(3);
      if (r.CHF) prices.USDCHF = r.CHF.toFixed(5);
      if (r.AUD) prices.AUDUSD = (1 / r.AUD).toFixed(5);
      if (r.CAD) prices.USDCAD = r.CAD.toFixed(5);
    }
  } catch {
    /* silent - continue with what we have */
  }

  return prices;
}

// ─── جلب الأخبار من RSS ──────────────────────────────────────
interface RawNewsItem {
  title: string;
  description: string;
  pubDate: string;
  link: string;
}

function parseRSS(xml: string): RawNewsItem[] {
  const items: RawNewsItem[] = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const block of blocks.slice(0, 20)) {
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ?? block.match(/<title>(.*?)<\/title>/))?.[1] ?? "";
    const desc  = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ?? block.match(/<description>(.*?)<\/description>/))?.[1] ?? "";
    const date  = (block.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] ?? "";
    const link  = (block.match(/<link>(.*?)<\/link>/) ?? block.match(/<guid[^>]*>(.*?)<\/guid>/))?.[1] ?? "";
    if (title) items.push({ title, description: desc.slice(0, 300), pubDate: date, link });
  }
  return items;
}

async function fetchRealNews(): Promise<RawNewsItem[]> {
  const feeds = [
    "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",  // US Top News
    "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839069",   // Markets
    "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664",   // Forex
  ];

  const results = await Promise.allSettled(
    feeds.map((url) =>
      fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TradingBot/1.0)" },
        signal: AbortSignal.timeout(8000),
      }).then((r) => (r.ok ? r.text() : ""))
    )
  );

  const allNews: RawNewsItem[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      for (const item of parseRSS(r.value)) {
        if (!seen.has(item.title)) {
          seen.add(item.title);
          allNews.push(item);
        }
      }
    }
  }

  // فلترة الأخبار المالية ذات الصلة
  const financialKeywords = /gold|oil|dollar|usd|eur|fed|rate|inflation|gdp|bond|market|stock|crude|forex|trade|tariff|iran|opec|economy|jobs|unemployment|cpi|pmi|interest|bank|treasury|yield|bitcoin|btc|crypto/i;
  const relevant = allNews.filter((n) => financialKeywords.test(n.title + " " + n.description));
  return (relevant.length > 0 ? relevant : allNews).slice(0, 15);
}

// ─── Route ───────────────────────────────────────────────────
router.get("/news/economic", async (req, res) => {
  try {
    const [prices, rawNews] = await Promise.all([fetchRealPrices(), fetchRealNews()]);

    const today = new Date().toLocaleDateString("ar-EG", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const priceBlock = Object.keys(prices).length > 0
      ? `الأسعار الحقيقية الحالية (مأخوذة من APIs موثوقة الآن):
${prices.goldUSD ? `• الذهب XAU/USD: ${prices.goldUSD} دولار للأوقية` : ""}
${prices.btcUSD ? `• البيتكوين BTC/USD: ${prices.btcUSD} دولار` : ""}
${prices.ethUSD ? `• الإيثيريوم ETH/USD: ${prices.ethUSD} دولار` : ""}
${prices.EURUSD ? `• EUR/USD: ${prices.EURUSD}` : ""}
${prices.GBPUSD ? `• GBP/USD: ${prices.GBPUSD}` : ""}
${prices.USDJPY ? `• USD/JPY: ${prices.USDJPY}` : ""}
${prices.USDCHF ? `• USD/CHF: ${prices.USDCHF}` : ""}
${prices.AUDUSD ? `• AUD/USD: ${prices.AUDUSD}` : ""}
${prices.USDCAD ? `• USD/CAD: ${prices.USDCAD}` : ""}`
      : "لم تتوفر أسعار حية - لا تذكر أرقاماً.";

    const newsBlock = rawNews.length > 0
      ? `آخر الأخبار الحقيقية من CNBC (${today}):\n${rawNews.map((n, i) => `${i + 1}. [${n.pubDate}] ${n.title}\n   ${n.description}`).join("\n\n")}`
      : "لم تتوفر أخبار حية.";

    const systemPrompt = `أنت محلل اقتصادي ومالي خبير متخصص في أسواق الفوركس والذهب والعملات الرقمية.
لديك بيانات حقيقية ومحدّثة الآن. مهمتك تحليل هذه البيانات الحقيقية وشرح تأثيرها على الأسواق.

⛔ قواعد صارمة:
1. لا تخترع أي أرقام أو أسعار — استخدم فقط الأسعار المعطاة لك
2. لا تذكر أسعار قديمة أو تاريخية كتوقع مستقبلي مثل "2500 للذهب" 
3. إذا لم يُعطَ لك سعر لأداة معينة، لا تذكر رقماً لها
4. اذكر الأسعار الحالية الحقيقية في تحليلك دائماً
5. حلّل الأخبار الحقيقية المعطاة فقط`;

    const userPrompt = `${priceBlock}

${newsBlock}

بناءً على هذه البيانات الحقيقية فقط، أجب بـ JSON مضغوط دون أي نص خارجه:
{
  "marketSummary": "ملخص شامل لحالة السوق اليوم بناءً على الأخبار الحقيقية والأسعار الحالية — اذكر الأسعار الحقيقية المعطاة",
  "riskSentiment": "risk_on|risk_off|neutral",
  "dollarBias": "bullish|bearish|neutral",
  "goldBias": "bullish|bearish|neutral",
  "sessionAdvice": "نصيحة تداولية مبنية على الأحداث الحقيقية اليوم",
  "news": [
    {
      "title": "عنوان الخبر بالعربية مع ذكر الأرقام الحقيقية إن وُجدت",
      "currency": "USD|EUR|GBP|JPY|XAU|BTC|ETH|OIL|SPX",
      "impact": "high|medium|low",
      "direction": "bullish|bearish|neutral",
      "expectedMove": "التأثير المتوقع على السوق — اذكر الأسعار الحقيقية الحالية إن وُجدت",
      "tradingAdvice": "نصيحة تداولية محددة وعملية مبنية على هذا الخبر",
      "affectedPairs": ["XAUUSD", "EURUSD"],
      "time": "وقت النشر"
    }
  ],
  "currentPrices": {
    "XAUUSD": "${prices.goldUSD ?? "غير متاح"}",
    "BTCUSD": "${prices.btcUSD ?? "غير متاح"}",
    "ETHUSD": "${prices.ethUSD ?? "غير متاح"}",
    "EURUSD": "${prices.EURUSD ?? "غير متاح"}",
    "GBPUSD": "${prices.GBPUSD ?? "غير متاح"}",
    "USDJPY": "${prices.USDJPY ?? "غير متاح"}",
    "USDCHF": "${prices.USDCHF ?? "غير متاح"}",
    "AUDUSD": "${prices.AUDUSD ?? "غير متاح"}",
    "USDCAD": "${prices.USDCAD ?? "غير متاح"}"
  },
  "keyLevelsToWatch": ["مستوى مهم بناءً على الأسعار الحقيقية وليس أرقاماً مخترعة"]
}

قدّم من 5 إلى 8 أخبار من القائمة المعطاة مع تحليل دقيق لتأثيرها.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 5000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";
    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      req.log.error({ content }, "Failed to parse news JSON");
      res.status(500).json({ error: "parse_error", message: "فشل في معالجة رد الذكاء الاصطناعي" });
      return;
    }

    res.json({
      ...parsed,
      currentPrices: {
        XAUUSD: prices.goldUSD ?? null,
        BTCUSD: prices.btcUSD ?? null,
        ETHUSD: prices.ethUSD ?? null,
        EURUSD: prices.EURUSD ?? null,
        GBPUSD: prices.GBPUSD ?? null,
        USDJPY: prices.USDJPY ?? null,
        USDCHF: prices.USDCHF ?? null,
        AUDUSD: prices.AUDUSD ?? null,
        USDCAD: prices.USDCAD ?? null,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching economic news");
    res.status(500).json({ error: "server_error", message: "حدث خطأ في الخادم" });
  }
});

export default router;
