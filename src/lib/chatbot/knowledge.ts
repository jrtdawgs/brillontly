// Big Bull - The Brillontly Investment Advisor Chatbot
// Knowledge-based system, not connected to any AI API
// Speaks in clear, friendly English - never code-like text

export interface ChatMessage {
  role: 'user' | 'bigbull';
  content: string;
  timestamp: Date;
}

export interface KnowledgeEntry {
  keywords: string[];
  response: string;
  category: string;
}

// Core investment knowledge base
export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // --- PORTFOLIO BASICS ---
  {
    keywords: ['what is', 'portfolio', 'explain portfolio'],
    response: 'A portfolio is simply all of your investments grouped together. Think of it like a basket - you put different investments in the basket, and the total value of everything in that basket is your portfolio. You have three baskets right now: your 401k, your Roth IRA, and your taxable brokerage account.',
    category: 'basics',
  },
  {
    keywords: ['401k', '401(k)', 'what is 401'],
    response: 'A 401k is a retirement savings account your employer offers. The money you put in comes out of your paycheck before taxes, which means you pay less in taxes now. The trade-off is you cannot take the money out until age 59 and a half without penalties. Your 401k is all in FXAIX, which tracks the S&P 500 - the 500 biggest US companies. That is a solid, simple choice.',
    category: 'accounts',
  },
  {
    keywords: ['roth', 'ira', 'roth ira'],
    response: 'A Roth IRA is a retirement account where you put in money you have already paid taxes on. The big advantage is that all the growth is completely tax-free when you take it out in retirement. Your Roth IRA holds QQQM, which tracks the Nasdaq 100 - the 100 biggest tech-heavy companies. This gives you more growth potential than the S&P 500 but with more ups and downs.',
    category: 'accounts',
  },
  {
    keywords: ['taxable', 'brokerage', 'taxable account'],
    response: 'Your taxable brokerage account is a regular investment account with no special tax treatment. You pay taxes on gains when you sell. The upside is there are no contribution limits and you can take money out anytime. This is where you hold your riskier and more interesting positions like leveraged ETFs, crypto, and crypto ETFs.',
    category: 'accounts',
  },

  // --- HOLDINGS ---
  {
    keywords: ['fxaix', 'fidelity 500', 'fidelity index'],
    response: 'FXAIX is the Fidelity 500 Index Fund. It tracks the S&P 500, which is the 500 largest US companies. It has one of the lowest expense ratios in the industry at 0.015%. This is one of the best set-it-and-forget-it investments out there. Over the long run, the S&P 500 has averaged about 10% per year.',
    category: 'holdings',
  },
  {
    keywords: ['qqqm', 'nasdaq', 'invesco'],
    response: 'QQQM is the Invesco Nasdaq 100 ETF. It tracks the 100 biggest non-financial companies on the Nasdaq, which is heavily weighted toward tech giants like Apple, Microsoft, NVIDIA, and Amazon. It has a slightly higher expense ratio than FXAIX but gives you more concentrated exposure to tech and growth companies.',
    category: 'holdings',
  },
  {
    keywords: ['spy', 's&p', 'spdr'],
    response: 'SPY is the original S&P 500 ETF and the most traded ETF in the world. It does the same thing as FXAIX - tracks the 500 biggest US companies - but in ETF form. SPY is extremely liquid and has a long track record. Some people hold both FXAIX in their 401k and SPY in their taxable account.',
    category: 'holdings',
  },
  {
    keywords: ['qqq', 'qqq trust'],
    response: 'QQQ is the Invesco QQQ Trust, tracking the Nasdaq 100. It is essentially the same as QQQM but slightly older and more liquid. You hold QQQ in your taxable account and QQQM in your Roth IRA - they track the same companies.',
    category: 'holdings',
  },
  {
    keywords: ['soxl', 'semiconductor', 'leveraged'],
    response: 'SOXL is a 3x leveraged semiconductor ETF. It tries to deliver three times the daily return of semiconductor stocks. When semis go up 1%, SOXL aims to go up 3%. When they drop 1%, SOXL drops 3%. This is one of the riskiest things in your portfolio. Leveraged ETFs suffer from something called volatility decay, which means over time they can lose value even if the underlying index goes sideways. SOXL is best for short to medium term trades, not long-term buy and hold.',
    category: 'holdings',
  },
  {
    keywords: ['bitcoin', 'btc'],
    response: 'Bitcoin is the first and largest cryptocurrency. It is digital money that runs on a decentralized network, meaning no single government or bank controls it. Bitcoin has a fixed supply of 21 million coins, which makes some people view it as digital gold. It is extremely volatile - it is normal for Bitcoin to swing 5 to 10% in a single day, and it has dropped 80% or more multiple times in its history before recovering to new highs.',
    category: 'holdings',
  },
  {
    keywords: ['ethereum', 'eth'],
    response: 'Ethereum is the second largest cryptocurrency. Unlike Bitcoin which aims to be digital money, Ethereum is a platform for building decentralized applications. Think of it as a world computer that anyone can program on. ETH tends to be even more volatile than Bitcoin and often moves in the same direction but with bigger swings.',
    category: 'holdings',
  },
  {
    keywords: ['bitx', 'bitcoin etf', '2x bitcoin'],
    response: 'BITX is the Volatility Shares 2x Bitcoin Strategy ETF. It tries to deliver twice the daily return of Bitcoin futures. This is extremely volatile - it amplifies Bitcoin moves which are already wild. Like SOXL, it suffers from leverage decay over time. Consider this a tactical position, not a forever hold.',
    category: 'holdings',
  },
  {
    keywords: ['ethu', 'ether etf', '2x ether'],
    response: 'ETHU is a 2x leveraged Ethereum ETF. It aims to deliver twice the daily return of Ether. This is the highest risk position in your portfolio because you are getting 2x exposure to what is already one of the most volatile major assets. The leverage decay on this can be brutal during choppy markets.',
    category: 'holdings',
  },

  // --- METRICS ---
  {
    keywords: ['sharpe', 'sharpe ratio'],
    response: 'The Sharpe Ratio tells you how much extra return you are earning for each unit of risk you take. Think of it this way: if two investments both returned 10%, but one bounced around wildly and the other was smooth, the smooth one has a better Sharpe Ratio. Above 1.0 is good, above 2.0 is excellent, and below 0 means you would have been better off in a savings account.',
    category: 'metrics',
  },
  {
    keywords: ['sortino', 'sortino ratio'],
    response: 'The Sortino Ratio is like the Sharpe Ratio but smarter. It only counts the bad kind of volatility, meaning the drops. If your portfolio goes up a lot, Sharpe penalizes that as risk, but Sortino does not. Sortino says that going up is good, only going down is bad. Higher is better, and above 1.5 is strong.',
    category: 'metrics',
  },
  {
    keywords: ['beta', 'what is beta'],
    response: 'Beta measures how much your portfolio moves compared to the overall stock market. A beta of 1.0 means you move with the market. If the S&P 500 goes up 1%, you go up about 1%. A beta of 1.5 means you move 50% more than the market. Given your SOXL, BITX, and ETHU positions, your taxable account likely has a high beta, meaning big swings both up and down.',
    category: 'metrics',
  },
  {
    keywords: ['alpha', 'what is alpha', "jensen's"],
    response: 'Alpha is your secret weapon metric. It tells you how much extra return you earned beyond what the market gave you, adjusted for the risk you took. Positive alpha means you are beating the market on a risk-adjusted basis. Negative alpha means you would have been better off just buying an index fund. Most professional fund managers fail to generate positive alpha consistently.',
    category: 'metrics',
  },
  {
    keywords: ['drawdown', 'max drawdown'],
    response: 'Max drawdown is the biggest peak to bottom drop your portfolio has experienced. If your portfolio hit $10,000 and then dropped to $7,000, your max drawdown is 30%. This metric matters because it shows you the worst pain you have actually gone through. A max drawdown above 20% is significant, and above 40% is severe.',
    category: 'metrics',
  },
  {
    keywords: ['volatility', 'vol', 'volatile'],
    response: 'Volatility is how much your portfolio bounces around. It is measured as annualized standard deviation of returns. A volatility of 15% is moderate, like a typical stock index. Above 25% is high, and above 40% is extreme. Your leveraged ETFs and crypto positions significantly increase your overall portfolio volatility.',
    category: 'metrics',
  },
  {
    keywords: ['rsi', 'relative strength'],
    response: 'RSI stands for Relative Strength Index. It measures whether something has been going up a lot recently (overbought) or down a lot (oversold). RSI ranges from 0 to 100. Below 30 means oversold, which is often a buying opportunity. Above 70 means overbought, and a pullback might be coming. The sweet spot for buying is when RSI drops below 30.',
    category: 'metrics',
  },
  {
    keywords: ['vix', 'fear', 'fear index', 'volatility index'],
    response: 'The VIX is called the Fear Index. It measures how much fear or uncertainty is in the market based on options pricing. When the VIX is low (below 15), everyone is calm and confident. When it spikes above 30 or 40, people are panicking. Here is the counterintuitive part: the best time to buy stocks is often when the VIX is highest, because that is when prices are cheapest.',
    category: 'metrics',
  },
  {
    keywords: ['capitulation', 'panic', 'panic sell'],
    response: 'Capitulation is when investors give up and sell everything out of fear. It usually happens near market bottoms. The signs are: sharp price drops, huge trading volume (everyone rushing for the exits), and very low RSI readings. If you see all three happening at once, it often means the selling is nearly over. Buying during capitulation has historically been one of the most profitable moves, but it takes courage.',
    category: 'signals',
  },

  // --- MACRO ---
  {
    keywords: ['interest rate', 'fed', 'federal reserve', 'rates'],
    response: 'Interest rates set by the Federal Reserve affect everything. When rates go up, borrowing gets more expensive, which slows the economy and usually hurts stock prices, especially growth and tech stocks. When rates go down, money is cheaper to borrow, businesses invest more, and stock prices tend to rise. Crypto and gold also tend to do well when rates are falling.',
    category: 'macro',
  },
  {
    keywords: ['dollar', 'usd', 'dollar index', 'dxy'],
    response: 'The US Dollar Index measures how strong the dollar is compared to other major currencies. A strong dollar is generally bad for US stocks that sell overseas because their products become more expensive for foreign buyers. A weak dollar tends to be good for stocks, gold, silver, and crypto. Watch the dollar move - when it weakens, your risky assets tend to do well.',
    category: 'macro',
  },
  {
    keywords: ['yield curve', 'inversion', 'inverted'],
    response: 'The yield curve shows the difference between long-term and short-term interest rates. Normally, long-term rates are higher because you are lending money for longer. When it inverts, meaning short-term rates are higher than long-term, it has predicted every recession in the last 50 years. It does not mean a crash is coming tomorrow, but it is a warning sign to pay attention to.',
    category: 'macro',
  },
  {
    keywords: ['gold', 'gld', 'precious metal'],
    response: 'Gold is the classic safe haven. When everything else is uncertain, investors buy gold. It tends to do well when interest rates are falling, the dollar is weakening, or inflation is high. Gold does not pay dividends or generate cash flow, so it tends to underperform stocks during bull markets. Think of it as portfolio insurance.',
    category: 'holdings',
  },
  {
    keywords: ['silver', 'slv'],
    response: 'Silver is like gold but more volatile. It serves as both a precious metal (safe haven) and an industrial metal (used in electronics, solar panels, etc.). Silver tends to move with gold but with bigger swings in both directions. It can be a good buy when the gold-to-silver ratio is high.',
    category: 'holdings',
  },
  {
    keywords: ['bonds', 'treasury', 'tlt', 'fixed income'],
    response: 'Bonds are loans you make to the government or companies that pay you interest. When interest rates go up, existing bond prices go down (and vice versa). TLT, the 20+ Year Treasury Bond ETF, is the most rate-sensitive. Bonds are traditionally held to reduce portfolio risk, but in recent years they have been more volatile than usual due to aggressive Fed rate changes.',
    category: 'macro',
  },

  // --- STRATEGY ---
  {
    keywords: ['when to buy', 'best time', 'should i buy', 'timing'],
    response: 'Here is what the data says about when to buy: 1) When RSI is below 30 (oversold). 2) When the VIX spikes above 30 (everyone is scared). 3) During a 20%+ drawdown from highs (bear market). 4) When you see capitulation (sharp drop plus huge volume). That said, time in the market beats timing the market for most people. Dollar cost averaging, buying a fixed amount regularly, works great for beginners.',
    category: 'strategy',
  },
  {
    keywords: ['diversif', 'diversification', 'diversified'],
    response: 'Diversification means not putting all your eggs in one basket. Your 401k and Roth IRA are concentrated in US large-cap stocks, which is fine for a beginner but means you do not own international stocks, small caps, real estate, or bonds. Your taxable account adds crypto and leveraged exposure. Consider whether you want some truly different assets that move independently from US tech stocks.',
    category: 'strategy',
  },
  {
    keywords: ['leverage', 'leveraged etf', 'decay', 'drag'],
    response: 'Leveraged ETFs like SOXL (3x) and BITX/ETHU (2x) are powerful but dangerous. The biggest risk is leverage decay. Here is how it works: if SOXL drops 10% one day, you lose 30%. Then if it goes up 10% the next day, you only gain 30% of a smaller number. Over time, this back-and-forth eats away at your returns even if the underlying asset goes nowhere. These are best used for short to medium term momentum trades, not set-and-forget investing.',
    category: 'strategy',
  },
  {
    keywords: ['rebalance', 'rebalancing'],
    response: 'Rebalancing means selling what has gone up and buying what has gone down to get back to your target percentages. For example, if your target is 20% SPY but it has grown to 30% of your account, you would sell some SPY and buy the underweight positions. Most advisors recommend rebalancing when any position drifts more than 5% from its target, or at least once or twice a year.',
    category: 'strategy',
  },
  {
    keywords: ['tax loss', 'tax-loss', 'harvest'],
    response: 'Tax-loss harvesting is selling investments that are down to lock in the loss for tax purposes. You can use those losses to offset gains from your winners, reducing your tax bill. This only applies to your taxable account, not your 401k or Roth IRA. Just be careful of the wash sale rule: you cannot buy back the same or a substantially identical investment within 30 days.',
    category: 'strategy',
  },
  {
    keywords: ['dca', 'dollar cost', 'averaging'],
    response: 'Dollar cost averaging means investing a fixed dollar amount on a regular schedule, regardless of whether the market is up or down. When prices are low, your fixed amount buys more shares. When prices are high, it buys fewer. Over time, this smooths out your average purchase price. For a beginner, this is one of the best strategies. Just pick a day each month, invest, and do not look at the price.',
    category: 'strategy',
  },
  {
    keywords: ['beginner', 'new investor', 'getting started', 'start investing'],
    response: 'As a beginner, your setup is actually pretty solid. Your 401k in FXAIX and Roth IRA in QQQM are great core positions. For your taxable account, the main thing to watch is your leveraged ETF and crypto exposure. These can lose 50 to 80% in a bad market. Make sure you are only putting money in those positions that you truly do not need for years. The number one rule: do not panic sell during a crash.',
    category: 'strategy',
  },

  // --- GENERAL ---
  {
    keywords: ['hello', 'hi', 'hey', 'sup', 'what up'],
    response: 'Hey there! I am Big Bull, your Brillontly investment buddy. I can help you understand your portfolio, explain what all these financial numbers mean, or chat about investment strategy. What would you like to know?',
    category: 'greeting',
  },
  {
    keywords: ['help', 'what can you do', 'how do you work'],
    response: 'I am here to help you understand your investments better. You can ask me about: your portfolio holdings (like FXAIX, QQQM, SPY, SOXL, Bitcoin, etc.), what metrics mean (Sharpe ratio, RSI, drawdown, VIX), investment strategy (when to buy, rebalancing, leverage risks), or market conditions (interest rates, dollar strength, yield curve). Just ask in plain English and I will break it down for you.',
    category: 'general',
  },
  {
    keywords: ['thanks', 'thank you', 'thx', 'appreciate'],
    response: 'You are welcome! Remember, the best investor is an informed investor. Keep asking questions and keep learning. I am always here when you need me.',
    category: 'general',
  },
];

// Find the best matching response for user input
export function findResponse(input: string): string {
  const lowerInput = input.toLowerCase().trim();

  // Score each knowledge entry
  let bestMatch: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        // Longer keyword matches are more specific and score higher
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.response;
  }

  // Default response
  return 'That is a great question, but I am not sure I have the best answer for that one. Try asking me about specific holdings in your portfolio (like FXAIX, SOXL, or Bitcoin), investment metrics (like Sharpe ratio, RSI, or VIX), or general strategy (like when to buy, rebalancing, or leverage risks). I am always learning and getting smarter!';
}

// Big Bull personality traits for the UI
export const BIGBULL_CONFIG = {
  name: 'Big Bull',
  greeting: 'Hey there! I am Big Bull, your investment buddy. Ask me anything about your portfolio, market signals, or investing in general. I keep it simple and straight to the point.',
  avatar: '/bigbull-avatar.svg',
  personality: 'friendly, clear, no jargon, encouraging but honest about risks',
};
