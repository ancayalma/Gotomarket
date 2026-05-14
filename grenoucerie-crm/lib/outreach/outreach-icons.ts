/**
 * Outreach email icon resolution — maps icon keys to self-hosted SVG paths.
 *
 * SVG files live in public/icons/lucide/ and are served from the app's domain.
 * Gmail proxies external images through googleusercontent.com, so these work
 * just like the brand logo.
 *
 * Icon keys use camelCase; file names use kebab-case in public/icons/lucide/.
 */

/** Full map: camelCase key → kebab-case filename */
const ICON_FILE_MAP: Record<string, string> = {
  // ── Business & Finance ──
  briefcase: "briefcase",
  building: "building",
  building2: "building-2",
  landmark: "landmark",
  handshake: "handshake",
  creditCard: "credit-card",
  dollarSign: "dollar-sign",
  wallet: "wallet",
  shoppingCart: "shopping-cart",
  shoppingBag: "shopping-bag",
  package: "package",
  trendingUp: "trending-up",
  trendingDown: "trending-down",
  barChart: "bar-chart",
  barChart2: "bar-chart-2",
  pieChart: "pie-chart",
  activity: "activity",
  target: "target",

  // ── Communication ──
  mail: "mail",
  phone: "phone",
  send: "send",
  messageCircle: "message-circle",
  megaphone: "megaphone",
  bell: "bell",
  atSign: "at-sign",
  radio: "radio",

  // ── People ──
  user: "user",
  users: "users",
  userCheck: "user-check",
  userPlus: "user-plus",

  // ── Navigation & Links ──
  globe: "globe",
  globe2: "globe-2",
  link: "link",
  link2: "link-2",
  externalLink: "external-link",
  compass: "compass",
  navigation: "navigation",
  map: "map",
  mapPin: "map-pin",
  arrowRight: "arrow-right",
  share: "share",
  share2: "share-2",

  // ── Media & Content ──
  video: "video",
  camera: "camera",
  image: "image",
  mic: "mic",
  headphones: "headphones",
  speaker: "speaker",
  play: "play",
  youtube: "youtube",

  // ── Documents & Files ──
  fileText: "file-text",
  file: "file",
  folder: "folder",
  clipboard: "clipboard",
  book: "book-open",
  bookClosed: "book",
  newspaper: "newspaper",
  scroll: "scroll",
  library: "library",

  // ── Time & Scheduling ──
  calendar: "calendar",
  clock: "clock",
  timer: "timer",
  hourglass: "hourglass",

  // ── Status & Feedback ──
  checkCircle: "check-circle",
  checkCircle2: "check-circle-2",
  alertCircle: "alert-circle",
  info: "info",
  helpCircle: "help-circle",
  thumbsUp: "thumbs-up",
  thumbsDown: "thumbs-down",
  smile: "smile",
  frown: "frown",
  meh: "meh",

  // ── Tech & Development ──
  code: "code",
  code2: "code-2",
  terminal: "terminal",
  database: "database",
  server: "server",
  cloud: "cloud",
  wifi: "wifi",
  settings: "settings",
  cog: "cog",
  layers: "layers",
  grid: "grid",
  layout: "layout",
  sidebar: "sidebar",
  columns: "columns",

  // ── Security ──
  shield: "shield",
  lock: "lock",
  unlock: "unlock",
  key: "key",
  eye: "eye",

  // ── Social Media ──
  linkedin: "linkedin",
  twitter: "twitter",
  instagram: "instagram",
  facebook: "facebook",
  github: "github",
  slack: "slack",
  figma: "figma",
  chrome: "chrome",

  // ── Energy & Action ──
  zap: "zap",
  flame: "flame",
  rocket: "rocket",
  lightbulb: "lightbulb",
  sparkles: "sparkles",
  wand: "wand",
  refreshCw: "refresh-cw",

  // ── Awards & Recognition ──
  award: "award",
  trophy: "trophy",
  medal: "medal",
  crown: "crown",
  gem: "gem",
  diamond: "diamond",
  star: "star",
  heart: "heart",
  flag: "flag",
  bookmark: "bookmark",
  tag: "tag",
  hash: "hash",

  // ── Nature & Weather ──
  sun: "sun",
  moon: "moon",
  cloudRain: "cloud-rain",
  umbrella: "umbrella",
  thermometer: "thermometer",
  droplet: "droplet",
  wind: "wind",
  mountain: "mountain",
  leaf: "leaf",
  flower: "flower",

  // ── Travel & Transport ──
  car: "car",
  truck: "truck",
  plane: "plane",
  ship: "ship",
  train: "train",
  bike: "bike",
  footprints: "footprints",
  anchor: "anchor",

  // ── Tools & Creative ──
  search: "search",
  download: "download",
  scissors: "scissors",
  penTool: "pen-tool",
  palette: "palette",
  ruler: "ruler",
  wrench: "wrench",
  hammer: "hammer",
  feather: "feather",
  gift: "gift",
  coffee: "coffee",
  lifeBuoy: "life-buoy",
  graduationCap: "graduation-cap",
  maximize: "maximize",
  minimize: "minimize",
  move: "move",
};

/**
 * Categorised icon keys for the wizard picker.
 * Each category has a label and the icon keys it contains.
 */
export const ICON_CATEGORIES: { label: string; keys: string[] }[] = [
  {
    label: "Business",
    keys: ["briefcase", "building", "building2", "landmark", "handshake", "creditCard", "dollarSign", "wallet",
           "shoppingCart", "shoppingBag", "package", "trendingUp", "barChart", "pieChart", "activity", "target"],
  },
  {
    label: "Communication",
    keys: ["mail", "phone", "send", "messageCircle", "megaphone", "bell", "atSign", "radio"],
  },
  {
    label: "People",
    keys: ["user", "users", "userCheck", "userPlus"],
  },
  {
    label: "Navigation",
    keys: ["globe", "globe2", "link", "link2", "externalLink", "compass", "navigation", "map", "mapPin", "arrowRight", "share"],
  },
  {
    label: "Media",
    keys: ["video", "camera", "image", "mic", "headphones", "play", "youtube"],
  },
  {
    label: "Documents",
    keys: ["fileText", "file", "folder", "clipboard", "book", "newspaper", "scroll", "library"],
  },
  {
    label: "Schedule",
    keys: ["calendar", "clock", "timer", "hourglass"],
  },
  {
    label: "Social",
    keys: ["linkedin", "twitter", "instagram", "facebook", "github", "slack", "chrome"],
  },
  {
    label: "Status",
    keys: ["checkCircle", "thumbsUp", "smile", "info", "helpCircle", "alertCircle"],
  },
  {
    label: "Tech",
    keys: ["code", "terminal", "database", "server", "cloud", "wifi", "settings", "layers", "grid"],
  },
  {
    label: "Security",
    keys: ["shield", "lock", "unlock", "key", "eye"],
  },
  {
    label: "Energy",
    keys: ["zap", "flame", "rocket", "lightbulb", "sparkles", "wand"],
  },
  {
    label: "Awards",
    keys: ["award", "trophy", "medal", "crown", "gem", "diamond", "star", "heart", "flag", "bookmark"],
  },
  {
    label: "Nature",
    keys: ["sun", "moon", "leaf", "flower", "mountain", "droplet"],
  },
  {
    label: "Transport",
    keys: ["car", "truck", "plane", "ship", "train", "bike", "anchor"],
  },
  {
    label: "Tools",
    keys: ["search", "download", "penTool", "palette", "wrench", "hammer", "scissors", "coffee", "gift",
           "feather", "lifeBuoy", "graduationCap", "ruler"],
  },
];

/** All available icon keys */
export const ICON_KEYS = Object.keys(ICON_FILE_MAP);

export function resolveIconUrl(iconName?: string, baseUrl?: string, colorHex?: string): string | undefined {
  if (!iconName || iconName === "none") return undefined;
  // If the user pasted a direct URL or passed an already resolved URL, keep it
  if (iconName.startsWith("http") || iconName.startsWith("/")) return iconName;

  const filename = ICON_FILE_MAP[iconName as keyof typeof ICON_FILE_MAP];
  if (!filename) return undefined;

  const base = baseUrl || "";
  if (colorHex) {
    return `${base}/api/outreach/icon?name=${filename}&color=${colorHex}`;
  }
  return `${base}/api/outreach/icon?name=${filename}`;
}

/**
 * Infer an icon key from a resource's id/label for legacy resources without an icon field.
 */
export function inferIconFromResource(r: { id?: string; label?: string }): string | undefined {
  const combined = `${(r.id || "").toLowerCase()} ${(r.label || "").toLowerCase()}`;
  if (combined.includes("website") || combined.includes("surge") || combined.includes("explore")) return "globe";
  if (combined.includes("calendar") || combined.includes("schedule") || combined.includes("call") || combined.includes("meeting")) return "calendar";
  if (combined.includes("linkedin") || combined.includes("connect")) return "link";
  if (combined.includes("investor") || combined.includes("portal")) return "briefcase";
  if (combined.includes("data") || combined.includes("room") || combined.includes("download")) return "download";
  if (combined.includes("email") || combined.includes("mail")) return "mail";
  if (combined.includes("phone")) return "phone";
  if (combined.includes("video") || combined.includes("demo")) return "video";
  if (combined.includes("book") || combined.includes("read")) return "book";
  return "arrowRight";
}
