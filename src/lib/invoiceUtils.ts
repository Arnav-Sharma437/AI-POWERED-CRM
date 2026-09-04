// Invoice Utilities & International Country / Currency Constants

export interface CountryOption {
  code: string;
  name: string;
  label: string;
  defaultCurrency: string;
  taxIdLabel: string;
  isInternational: boolean;
}

export interface CountryGroup {
  group: string;
  options: CountryOption[];
}

export const COUNTRIES_AND_REGIONS: CountryGroup[] = [
  {
    group: "🌐 Popular International Client Markets",
    options: [
      { code: "US", name: "United States", label: "🇺🇸 United States (US)", defaultCurrency: "USD", taxIdLabel: "EIN / Tax ID", isInternational: true },
      { code: "GB", name: "United Kingdom", label: "🇬🇧 United Kingdom (UK)", defaultCurrency: "GBP", taxIdLabel: "VAT Reg No", isInternational: true },
      { code: "AE", name: "United Arab Emirates", label: "🇦🇪 United Arab Emirates (UAE / Dubai)", defaultCurrency: "AED", taxIdLabel: "TRN / Tax No", isInternational: true },
      { code: "CA", name: "Canada", label: "🇨🇦 Canada (CA)", defaultCurrency: "CAD", taxIdLabel: "BN / GST/HST No", isInternational: true },
      { code: "AU", name: "Australia", label: "🇦🇺 Australia (AU)", defaultCurrency: "AUD", taxIdLabel: "ABN / ACN", isInternational: true },
      { code: "SG", name: "Singapore", label: "🇸🇬 Singapore (SG)", defaultCurrency: "SGD", taxIdLabel: "UEN / GST Reg", isInternational: true },
      { code: "DE", name: "Germany", label: "🇩🇪 Germany (DE)", defaultCurrency: "EUR", taxIdLabel: "USt-IdNr / VAT", isInternational: true },
      { code: "FR", name: "France", label: "🇫🇷 France (FR)", defaultCurrency: "EUR", taxIdLabel: "Numéro TVA", isInternational: true },
      { code: "NL", name: "Netherlands", label: "🇳🇱 Netherlands (NL)", defaultCurrency: "EUR", taxIdLabel: "Btw-nummer", isInternational: true },
      { code: "IE", name: "Ireland", label: "🇮🇪 Ireland (IE)", defaultCurrency: "EUR", taxIdLabel: "VAT Number", isInternational: true },
      { code: "CH", name: "Switzerland", label: "🇨🇭 Switzerland (CH)", defaultCurrency: "CHF", taxIdLabel: "UID / MWST", isInternational: true },
      { code: "SA", name: "Saudi Arabia", label: "🇸🇦 Saudi Arabia (KSA)", defaultCurrency: "SAR", taxIdLabel: "VAT ID / CR No", isInternational: true },
      { code: "QA", name: "Qatar", label: "🇶🇦 Qatar (QA)", defaultCurrency: "QAR", taxIdLabel: "Tax ID / CR", isInternational: true },
      { code: "KW", name: "Kuwait", label: "🇰🇼 Kuwait (KW)", defaultCurrency: "KWD", taxIdLabel: "Civil ID / Tax No", isInternational: true },
      { code: "OM", name: "Oman", label: "🇴🇲 Oman (OM)", defaultCurrency: "OMR", taxIdLabel: "VAT IN / CR", isInternational: true },
      { code: "NZ", name: "New Zealand", label: "🇳🇿 New Zealand (NZ)", defaultCurrency: "NZD", taxIdLabel: "GST Number", isInternational: true },
      { code: "ZA", name: "South Africa", label: "🇿🇦 South Africa (ZA)", defaultCurrency: "ZAR", taxIdLabel: "VAT Reg No", isInternational: true },
      { code: "MY", name: "Malaysia", label: "🇲🇾 Malaysia (MY)", defaultCurrency: "MYR", taxIdLabel: "SST / BRN", isInternational: true },
      { code: "JP", name: "Japan", label: "🇯🇵 Japan (JP)", defaultCurrency: "JPY", taxIdLabel: "Corporate No / JCT", isInternational: true },
      { code: "SE", name: "Sweden", label: "🇸🇪 Sweden (SE)", defaultCurrency: "SEK", taxIdLabel: "Momsnr / VAT", isInternational: true },
      { code: "NO", name: "Norway", label: "🇳🇴 Norway (NO)", defaultCurrency: "NOK", taxIdLabel: "Org. Number MVA", isInternational: true },
      { code: "DK", name: "Denmark", label: "🇩🇰 Denmark (DK)", defaultCurrency: "DKK", taxIdLabel: "CVR Number", isInternational: true },
      { code: "OVERSEAS", name: "Overseas Client", label: "🌍 Other Overseas / International (96)", defaultCurrency: "USD", taxIdLabel: "Tax ID / VAT No", isInternational: true }
    ]
  },
  {
    group: "🇮🇳 India (Domestic States & UTs)",
    options: [
      { code: "06", name: "Haryana", label: "Haryana (06)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "07", name: "Delhi", label: "Delhi (07)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "03", name: "Punjab", label: "Punjab (03)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "02", name: "Himachal Pradesh", label: "Himachal Pradesh (02)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "04", name: "Chandigarh", label: "Chandigarh (04)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "09", name: "Uttar Pradesh", label: "Uttar Pradesh (09)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "08", name: "Rajasthan", label: "Rajasthan (08)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "27", name: "Maharashtra", label: "Maharashtra (27)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "29", name: "Karnataka", label: "Karnataka (29)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "33", name: "Tamil Nadu", label: "Tamil Nadu (33)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "36", name: "Telangana", label: "Telangana (36)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "24", name: "Gujarat", label: "Gujarat (24)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "19", name: "West Bengal", label: "West Bengal (19)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "05", name: "Uttarakhand", label: "Uttarakhand (05)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "10", name: "Bihar", label: "Bihar (10)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "23", name: "Madhya Pradesh", label: "Madhya Pradesh (23)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "32", name: "Kerala", label: "Kerala (32)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "37", name: "Andhra Pradesh", label: "Andhra Pradesh (37)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "21", name: "Odisha", label: "Odisha (21)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "18", name: "Assam", label: "Assam (18)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "30", name: "Goa", label: "Goa (30)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "22", name: "Chhattisgarh", label: "Chhattisgarh (22)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "20", name: "Jharkhand", label: "Jharkhand (20)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false },
      { code: "01", name: "Jammu & Kashmir", label: "Jammu & Kashmir (01)", defaultCurrency: "INR", taxIdLabel: "GSTIN", isInternational: false }
    ]
  }
];

export const ALL_COUNTRY_OPTIONS: CountryOption[] = COUNTRIES_AND_REGIONS.flatMap(g => g.options);

export const INVOICE_CURRENCIES = [
  { code: "INR", symbol: "₹", label: "INR (₹) - Indian Rupee", locale: "en-IN" },
  { code: "USD", symbol: "$", label: "USD ($) - US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", label: "EUR (€) - Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", label: "GBP (£) - British Pound", locale: "en-GB" },
  { code: "AED", symbol: "AED ", label: "AED (د.إ) - UAE Dirham", locale: "en-AE" },
  { code: "CAD", symbol: "CA$", label: "CAD ($) - Canadian Dollar", locale: "en-CA" },
  { code: "AUD", symbol: "AU$", label: "AUD ($) - Australian Dollar", locale: "en-AU" },
  { code: "SGD", symbol: "S$", label: "SGD (S$) - Singapore Dollar", locale: "en-SG" },
  { code: "SAR", symbol: "SAR ", label: "SAR (﷼) - Saudi Riyal", locale: "en-SA" },
  { code: "QAR", symbol: "QAR ", label: "QAR (﷼) - Qatari Riyal", locale: "en-QA" },
  { code: "CHF", symbol: "CHF ", label: "CHF (Fr) - Swiss Franc", locale: "de-CH" },
  { code: "NZD", symbol: "NZ$", label: "NZD ($) - New Zealand Dollar", locale: "en-NZ" },
  { code: "JPY", symbol: "¥", label: "JPY (¥) - Japanese Yen", locale: "ja-JP" },
  { code: "MYR", symbol: "RM ", label: "MYR (RM) - Malaysian Ringgit", locale: "en-MY" },
  { code: "ZAR", symbol: "R ", label: "ZAR (R) - South African Rand", locale: "en-ZA" }
];

export const INVOICE_TAX_RATES = [
  { label: "IGST18 [18%]", rate: 18, name: "IGST18 [18%]" },
  { label: "CGST9 + SGST9 [18%]", rate: 18, name: "CGST9 + SGST9 [18%]" },
  { label: "IGST12 [12%]", rate: 12, name: "IGST12 [12%]" },
  { label: "CGST6 + SGST6 [12%]", rate: 12, name: "CGST6 + SGST6 [12%]" },
  { label: "IGST5 [5%]", rate: 5, name: "IGST5 [5%]" },
  { label: "CGST2.5 + SGST2.5 [5%]", rate: 5, name: "CGST2.5 + SGST2.5 [5%]" },
  { label: "Non-Taxable / Zero-Rated [0%]", rate: 0, name: "Non-Taxable [0%]" }
];

// Helper to convert number to words for INR (Lakhs/Crores)
function numberToWordsINR(num: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numStr = num.toString();
  if (numStr.length > 9) return numStr;
  const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  const c1 = parseInt(n[1], 10);
  const c2 = parseInt(n[2], 10);
  const c3 = parseInt(n[3], 10);
  const c4 = parseInt(n[4], 10);
  const c5 = parseInt(n[5], 10);

  str += (c1 !== 0) ? (a[c1] || b[parseInt(n[1][0], 10)] + ' ' + a[parseInt(n[1][1], 10)]) + ' Crore ' : '';
  str += (c2 !== 0) ? (a[c2] || b[parseInt(n[2][0], 10)] + ' ' + a[parseInt(n[2][1], 10)]) + ' Lakh ' : '';
  str += (c3 !== 0) ? (a[c3] || b[parseInt(n[3][0], 10)] + ' ' + a[parseInt(n[3][1], 10)]) + ' Thousand ' : '';
  str += (c4 !== 0) ? (a[c4] || b[parseInt(n[4][0], 10)] + ' ' + a[parseInt(n[4][1], 10)]) + ' Hundred ' : '';
  str += (c5 !== 0) ? ((str !== '') ? 'and ' : '') + (a[c5] || b[parseInt(n[5][0], 10)] + ' ' + a[parseInt(n[5][1], 10)]) : '';
  return str.trim();
}

// Helper to convert number to words for International (Millions/Billions/Thousands)
function numberToWordsInternational(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Million", "Billion", "Trillion"];

  function convertGroup(n: number): string {
    let group = "";
    if (n >= 100) {
      group += ones[Math.floor(n / 100)] + " Hundred";
      n %= 100;
      if (n > 0) group += " ";
    }
    if (n >= 20) {
      group += tens[Math.floor(n / 10)] + (n % 10 ? "-" + ones[n % 10] : "");
    } else if (n > 0) {
      group += ones[n];
    }
    return group.trim();
  }

  let wordResult = "";
  let scaleIndex = 0;

  let temp = num;
  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkWord = convertGroup(chunk);
      const scaleWord = scales[scaleIndex];
      const chunkFormatted = scaleWord ? `${chunkWord} ${scaleWord}` : chunkWord;
      wordResult = wordResult ? `${chunkFormatted} ${wordResult}` : chunkFormatted;
    }
    temp = Math.floor(temp / 1000);
    scaleIndex++;
  }

  return wordResult.trim();
}

export function formatTotalInWords(amount: number, currency = "INR"): string {
  const rounded = Math.round(amount);
  if (rounded <= 0) return `Zero ${currency} Only`;

  const currencyNames: Record<string, { singular: string; plural: string }> = {
    INR: { singular: "Indian Rupee", plural: "Indian Rupees" },
    USD: { singular: "US Dollar", plural: "US Dollars" },
    EUR: { singular: "Euro", plural: "Euros" },
    GBP: { singular: "Pound Sterling", plural: "Pounds Sterling" },
    AED: { singular: "UAE Dirham", plural: "UAE Dirhams" },
    CAD: { singular: "Canadian Dollar", plural: "Canadian Dollars" },
    AUD: { singular: "Australian Dollar", plural: "Australian Dollars" },
    SGD: { singular: "Singapore Dollar", plural: "Singapore Dollars" },
    SAR: { singular: "Saudi Riyal", plural: "Saudi Riyals" },
    QAR: { singular: "Qatari Riyal", plural: "Qatari Riyals" },
    CHF: { singular: "Swiss Franc", plural: "Swiss Francs" },
    NZD: { singular: "New Zealand Dollar", plural: "New Zealand Dollars" },
    JPY: { singular: "Japanese Yen", plural: "Japanese Yen" },
    MYR: { singular: "Malaysian Ringgit", plural: "Malaysian Ringgits" },
    ZAR: { singular: "South African Rand", plural: "South African Rand" }
  };

  const currInfo = currencyNames[currency] || { singular: currency, plural: currency };
  const currLabel = rounded === 1 ? currInfo.singular : currInfo.plural;

  if (currency === "INR") {
    return `${currLabel} ${numberToWordsINR(rounded)} Only`;
  } else {
    return `${currLabel} ${numberToWordsInternational(rounded)} Only`;
  }
}
