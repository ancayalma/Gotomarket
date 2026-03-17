import { prismadb } from "@/lib/prisma";

// ── ISO 4217 Currency Defaults ──────────────────────────────────────────────
export const DEFAULT_CURRENCIES = [
    { code: "USD", name: "US Dollar", symbol: "$", decimal_places: 2, exchange_rate_to_usd: 1.0 },
    { code: "EUR", name: "Euro", symbol: "€", decimal_places: 2, exchange_rate_to_usd: 1.08 },
    { code: "GBP", name: "British Pound", symbol: "£", decimal_places: 2, exchange_rate_to_usd: 1.27 },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", decimal_places: 0, exchange_rate_to_usd: 0.0067 },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimal_places: 2, exchange_rate_to_usd: 0.74 },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", decimal_places: 2, exchange_rate_to_usd: 0.66 },
    { code: "CHF", name: "Swiss Franc", symbol: "Fr", decimal_places: 2, exchange_rate_to_usd: 1.13 },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimal_places: 2, exchange_rate_to_usd: 0.14 },
    { code: "INR", name: "Indian Rupee", symbol: "₹", decimal_places: 2, exchange_rate_to_usd: 0.012 },
    { code: "BRL", name: "Brazilian Real", symbol: "R$", decimal_places: 2, exchange_rate_to_usd: 0.20 },
    { code: "MXN", name: "Mexican Peso", symbol: "$", decimal_places: 2, exchange_rate_to_usd: 0.058 },
    { code: "KRW", name: "South Korean Won", symbol: "₩", decimal_places: 0, exchange_rate_to_usd: 0.00074 },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", decimal_places: 2, exchange_rate_to_usd: 0.75 },
    { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", decimal_places: 2, exchange_rate_to_usd: 0.13 },
    { code: "SEK", name: "Swedish Krona", symbol: "kr", decimal_places: 2, exchange_rate_to_usd: 0.096 },
    { code: "NOK", name: "Norwegian Krone", symbol: "kr", decimal_places: 2, exchange_rate_to_usd: 0.094 },
    { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", decimal_places: 2, exchange_rate_to_usd: 0.61 },
    { code: "ZAR", name: "South African Rand", symbol: "R", decimal_places: 2, exchange_rate_to_usd: 0.055 },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", decimal_places: 2, exchange_rate_to_usd: 0.27 },
    { code: "SAR", name: "Saudi Riyal", symbol: "﷼", decimal_places: 2, exchange_rate_to_usd: 0.27 },
];

/**
 * Convert an amount between two currencies using stored exchange rates.
 * All conversions go through USD as the intermediate.
 */
export async function convertCurrency(
    amount: number,
    fromCode: string,
    toCode: string,
    teamId?: string | null
): Promise<number> {
    if (fromCode === toCode) return amount;

    const [fromCurrency, toCurrency] = await Promise.all([
        getCurrencyRate(fromCode, teamId),
        getCurrencyRate(toCode, teamId),
    ]);

    if (!fromCurrency || !toCurrency) {
        throw new Error(`Currency not found: ${!fromCurrency ? fromCode : toCode}`);
    }

    // Convert to USD first, then to target
    const amountInUsd = amount * fromCurrency.exchange_rate_to_usd;
    const converted = amountInUsd / toCurrency.exchange_rate_to_usd;

    return Number(converted.toFixed(toCurrency.decimal_places));
}

/**
 * Get a currency rate, preferring team-specific rates over system defaults.
 */
async function getCurrencyRate(code: string, teamId?: string | null) {
    // Try team-specific rate first
    if (teamId) {
        const teamRate = await prismadb.crm_Currency.findFirst({
            where: { code, team_id: teamId },
        });
        if (teamRate) return teamRate;
    }

    // Fall back to system rate (team_id is null)
    return prismadb.crm_Currency.findFirst({
        where: { code, team_id: null },
    });
}

/**
 * Format a currency value with its symbol.
 */
export function formatCurrency(amount: number, symbol: string, decimalPlaces: number = 2): string {
    return `${symbol}${amount.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    })}`;
}

/**
 * Seed default currencies (run once during setup).
 */
export async function seedDefaultCurrencies() {
    for (const currency of DEFAULT_CURRENCIES) {
        await prismadb.crm_Currency.upsert({
            where: {
                code_team_id: { code: currency.code, team_id: "" }, // System-level
            },
            create: {
                ...currency,
                team_id: null,
            },
            update: {
                exchange_rate_to_usd: currency.exchange_rate_to_usd,
                last_updated: new Date(),
            },
        });
    }
}
