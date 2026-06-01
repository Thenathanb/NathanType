export interface NTTheme {
  id: string;
  name: string;
  bg: string;
  bg2: string;
  main: string;
  text: string;
  sub: string;
  error: string;
}

// ── DARK THEMES ──────────────────────────────────────────────────
const dark: NTTheme[] = [
  { id: 'serika-dark',       name: 'nathan dark',        bg: '#2c2e31', bg2: '#323437', main: '#e2b714', text: '#d1d0ce', sub: '#646669', error: '#ca4754' },
  { id: 'nord',              name: 'nord',               bg: '#2e3440', bg2: '#3b4252', main: '#88c0d0', text: '#eceff4', sub: '#616e88', error: '#bf616a' },
  { id: 'dracula',           name: 'dracula',            bg: '#282a36', bg2: '#363948', main: '#bd93f9', text: '#f8f8f2', sub: '#6272a4', error: '#ff5555' },
  { id: 'monokai',           name: 'monokai',            bg: '#272822', bg2: '#3e3d32', main: '#a6e22e', text: '#f8f8f2', sub: '#75715e', error: '#f92672' },
  { id: 'solarized-dark',    name: 'solarized dark',     bg: '#002b36', bg2: '#073642', main: '#2aa198', text: '#839496', sub: '#586e75', error: '#dc322f' },
  { id: 'gruvbox-dark',      name: 'gruvbox dark',       bg: '#282828', bg2: '#3c3836', main: '#b8bb26', text: '#ebdbb2', sub: '#928374', error: '#fb4934' },
  { id: 'one-dark',          name: 'one dark',           bg: '#282c34', bg2: '#31353f', main: '#61afef', text: '#abb2bf', sub: '#5c6370', error: '#e06c75' },
  { id: 'tokyo-night',       name: 'tokyo night',        bg: '#1a1b26', bg2: '#24283b', main: '#7aa2f7', text: '#c0caf5', sub: '#565f89', error: '#f7768e' },
  { id: 'catppuccin-mocha',  name: 'catppuccin mocha',   bg: '#1e1e2e', bg2: '#313244', main: '#cba6f7', text: '#cdd6f4', sub: '#6c7086', error: '#f38ba8' },
  { id: 'catppuccin-macchiato', name: 'catppuccin macchiato', bg: '#24273a', bg2: '#363a4f', main: '#c6a0f6', text: '#cad3f5', sub: '#6e738d', error: '#ed8796' },
  { id: 'catppuccin-frappe', name: 'catppuccin frappé',  bg: '#303446', bg2: '#414559', main: '#ca9ee6', text: '#c6d0f5', sub: '#737994', error: '#e78284' },
  { id: 'material-dark',     name: 'material dark',      bg: '#212121', bg2: '#2d2d2d', main: '#80cbc4', text: '#eeffff', sub: '#546e7a', error: '#f07178' },
  { id: 'synthwave',         name: 'synthwave',          bg: '#262335', bg2: '#2a2139', main: '#ff7edb', text: '#ffffff', sub: '#848bbd', error: '#fe4450' },
  { id: 'cyberpunk',         name: 'cyberpunk',          bg: '#000000', bg2: '#130a2e', main: '#ffff00', text: '#00ff9f', sub: '#4d4d4d', error: '#ff003c' },
  { id: 'vaporwave',         name: 'vaporwave',          bg: '#1a1a2e', bg2: '#16213e', main: '#ff71ce', text: '#fffde7', sub: '#7a5c7a', error: '#fe5f55' },
  { id: 'midnight',          name: 'midnight',           bg: '#0d0d0d', bg2: '#1a1a1a', main: '#4fc3f7', text: '#e0e0e0', sub: '#424242', error: '#ef5350' },
  { id: 'oblivion',          name: 'oblivion',           bg: '#1c1c1c', bg2: '#262626', main: '#c8b400', text: '#d4d4d4', sub: '#606060', error: '#d25252' },
  { id: 'vscode',            name: 'vs code',            bg: '#1e1e1e', bg2: '#252526', main: '#0078d4', text: '#d4d4d4', sub: '#6a9955', error: '#f44747' },
  { id: 'discord',           name: 'discord',            bg: '#36393f', bg2: '#2f3136', main: '#5865f2', text: '#dcddde', sub: '#72767d', error: '#ed4245' },
  { id: 'blueberry-dark',    name: 'blueberry dark',     bg: '#212b40', bg2: '#2a3857', main: '#82aaff', text: '#c8d3f5', sub: '#444a73', error: '#ff5370' },
  { id: 'rose-pine',         name: 'rosé pine',          bg: '#191724', bg2: '#1f1d2e', main: '#ebbcba', text: '#e0def4', sub: '#6e6a86', error: '#eb6f92' },
  { id: 'rose-pine-moon',    name: 'rosé pine moon',     bg: '#232136', bg2: '#2a273f', main: '#ea9a97', text: '#e0def4', sub: '#6e6a86', error: '#eb6f92' },
  { id: 'everblush',         name: 'everblush',          bg: '#141b1e', bg2: '#1e2528', main: '#26bbd9', text: '#dadada', sub: '#404040', error: '#e57474' },
  { id: 'aether',            name: 'aether',             bg: '#15161e', bg2: '#1e2030', main: '#7fc8da', text: '#c8d3f5', sub: '#3b4261', error: '#ff757f' },
  { id: 'nightfox',          name: 'nightfox',           bg: '#192330', bg2: '#212e3f', main: '#81b29a', text: '#cdcecf', sub: '#738091', error: '#c94f6d' },
  { id: 'carbon',            name: 'carbon',             bg: '#161616', bg2: '#1e1e1e', main: '#78a9ff', text: '#f4f4f4', sub: '#525252', error: '#fa4d56' },
  { id: 'doom-one',          name: 'doom one',           bg: '#282c34', bg2: '#21242b', main: '#51afef', text: '#bbc2cf', sub: '#5b6268', error: '#ff6c6b' },
  { id: 'horizon',           name: 'horizon',            bg: '#1c1e26', bg2: '#232530', main: '#e95678', text: '#d5d8da', sub: '#6c6f93', error: '#f43e5c' },
  { id: 'oceanic',           name: 'oceanic next',       bg: '#1b2b34', bg2: '#243447', main: '#99c794', text: '#cdd3de', sub: '#65737e', error: '#ec5f67' },
  { id: 'palenight',         name: 'palenight',          bg: '#292d3e', bg2: '#32374d', main: '#c792ea', text: '#bfc7d5', sub: '#676e95', error: '#f07178' },
  { id: 'kanagawa',          name: 'kanagawa',           bg: '#1f1f28', bg2: '#2a2a37', main: '#7e9cd8', text: '#dcd7ba', sub: '#717c7c', error: '#c34043' },
  { id: 'melange-dark',      name: 'mélange dark',       bg: '#2a2520', bg2: '#34302a', main: '#e49b5d', text: '#c9b99a', sub: '#7d6e5a', error: '#d47766' },
  { id: 'gruvbox-material',  name: 'gruvbox material',   bg: '#1d2021', bg2: '#282828', main: '#a9b665', text: '#d4be98', sub: '#7c6f64', error: '#ea6962' },
  { id: 'decay',             name: 'decay',              bg: '#0d0f18', bg2: '#171b26', main: '#70d9b4', text: '#b2c5c5', sub: '#3a4555', error: '#e8697a' },
  { id: 'dark-note',         name: 'dark note',          bg: '#252526', bg2: '#2d2d2d', main: '#4ec9b0', text: '#d4d4d4', sub: '#808080', error: '#f44747' },
  { id: 'alduin',            name: 'alduin',             bg: '#1c1c1c', bg2: '#252525', main: '#c2b790', text: '#ddd5c0', sub: '#746b58', error: '#cf6a4c' },
  { id: 'phantom',           name: 'phantom',            bg: '#191919', bg2: '#242424', main: '#d4a9ff', text: '#e0e0e0', sub: '#555555', error: '#ff4081' },
  { id: 'terra',             name: 'terra',              bg: '#1d2021', bg2: '#262625', main: '#d79921', text: '#ebdbb2', sub: '#7c6f64', error: '#cc241d' },
  { id: 'chaos-theory',      name: 'chaos theory',       bg: '#0e1014', bg2: '#1a1d23', main: '#ff6d00', text: '#e0e0e0', sub: '#4a4a4a', error: '#ff1744' },
  { id: 'joker',             name: 'joker',              bg: '#0f0f13', bg2: '#1a1a20', main: '#9c27b0', text: '#e0e0e0', sub: '#424242', error: '#00e676' },
  { id: 'pulse',             name: 'pulse',              bg: '#16181d', bg2: '#1e2128', main: '#00e5ff', text: '#e0f7fa', sub: '#37474f', error: '#ff1744' },
  { id: 'anti-hero',         name: 'anti hero',          bg: '#0a0a0f', bg2: '#13131a', main: '#ff4081', text: '#e0e0e0', sub: '#303030', error: '#69f0ae' },
  { id: 'tron-orange',       name: 'tron orange',        bg: '#0d0d0d', bg2: '#1a1a1a', main: '#ff6d00', text: '#ffe0b2', sub: '#3e2723', error: '#ff1744' },
  { id: 'aurora',            name: 'aurora',             bg: '#2b2d3a', bg2: '#343647', main: '#a3be8c', text: '#d8dee9', sub: '#4c566a', error: '#bf616a' },
  { id: 'metaverse',         name: 'metaverse',          bg: '#0d0221', bg2: '#1a0536', main: '#00f0ff', text: '#e0e0e0', sub: '#3a2060', error: '#ff0099' },
  { id: 'ryujin',            name: 'ryujin scales',      bg: '#02040a', bg2: '#0a0e1a', main: '#ff0000', text: '#c8c8c8', sub: '#2a2a2a', error: '#ff6600' },
  { id: 'spiderman',         name: 'spiderman',          bg: '#0a0a1a', bg2: '#12122a', main: '#e53935', text: '#e0e0e0', sub: '#303060', error: '#1565c0' },
  { id: 'fire',              name: 'fire',               bg: '#0d0000', bg2: '#1a0000', main: '#ff6d00', text: '#ffccbc', sub: '#3e1a00', error: '#ff1744' },
  { id: 'shadow',            name: 'shadow',             bg: '#000000', bg2: '#0a0a0a', main: '#ffffff', text: '#e0e0e0', sub: '#333333', error: '#ff1744' },
  { id: 'matrix',            name: 'matrix',             bg: '#000000', bg2: '#001400', main: '#00ff41', text: '#008f11', sub: '#003b00', error: '#ff0000' },
  { id: 'voc',               name: 'voc',                bg: '#111111', bg2: '#1c1c1c', main: '#ff4444', text: '#eeeeee', sub: '#444444', error: '#ff8800' },
  { id: 'dark-magic-girl',   name: 'dark magic girl',    bg: '#1a0a2e', bg2: '#26103f', main: '#ff79c6', text: '#f8f8f2', sub: '#7c5fa0', error: '#ff5555' },
  { id: 'red-dragon',        name: 'red dragon',         bg: '#1a0000', bg2: '#2a0000', main: '#ff3333', text: '#ffd0d0', sub: '#5c2222', error: '#ff6600' },
  { id: 'midnight-navy',     name: 'midnight navy',      bg: '#0a0e1f', bg2: '#121829', main: '#4facfe', text: '#e8eaf6', sub: '#283593', error: '#ef5350' },
  { id: 'olive-dark',        name: 'olive dark',         bg: '#1a1a00', bg2: '#252500', main: '#c6c930', text: '#e8e8cc', sub: '#555530', error: '#e05252' },
  { id: 'incognito',         name: 'incognito',          bg: '#181818', bg2: '#222222', main: '#aaaaaa', text: '#cccccc', sub: '#555555', error: '#ff4444' },
  { id: 'arch',              name: 'arch linux',         bg: '#1f2430', bg2: '#2b3347', main: '#1688f0', text: '#cbccc6', sub: '#4d5266', error: '#ff3333' },
  { id: 'hammerhead',        name: 'hammerhead',         bg: '#161e27', bg2: '#1e2a38', main: '#43d9ad', text: '#e6edf3', sub: '#30363d', error: '#ff7b72' },
  { id: 'stealth',           name: 'stealth',            bg: '#111111', bg2: '#1a1a1a', main: '#00bcd4', text: '#b0bec5', sub: '#37474f', error: '#ef5350' },
  { id: 'husqy',             name: 'husqy',              bg: '#1b1b2e', bg2: '#252540', main: '#e94560', text: '#eaeaea', sub: '#4a4a7a', error: '#ff5252' },
  { id: 'iv-spade',          name: 'iv spade',           bg: '#111c1c', bg2: '#162828', main: '#42e682', text: '#c8ecd5', sub: '#2d5040', error: '#ff5252' },
  { id: 'lofi',              name: 'lofi',               bg: '#1a1a2e', bg2: '#23233a', main: '#f7c59f', text: '#ede0d4', sub: '#5e5e80', error: '#e76f51' },
  { id: '8008',              name: '8008',               bg: '#1e1e2e', bg2: '#28283e', main: '#ff0000', text: '#00ff00', sub: '#004400', error: '#ff8800' },
  { id: 'voidless',          name: 'voidless',           bg: '#050505', bg2: '#111111', main: '#39ff14', text: '#e0e0e0', sub: '#2a2a2a', error: '#ff073a' },
];

// ── LIGHT THEMES ─────────────────────────────────────────────────
const light: NTTheme[] = [
  { id: 'paper',             name: 'paper',              bg: '#f8f5f1', bg2: '#ede8e2', main: '#7a6651', text: '#3a3228', sub: '#9e9289', error: '#c0392b' },
  { id: 'milkshake',         name: 'milkshake',          bg: '#f2eee8', bg2: '#e6e0d8', main: '#e85d4a', text: '#3d3530', sub: '#a09890', error: '#c0392b' },
  { id: 'catppuccin-latte',  name: 'catppuccin latte',   bg: '#eff1f5', bg2: '#e6e9ef', main: '#8839ef', text: '#4c4f69', sub: '#9ca0b0', error: '#d20f39' },
  { id: 'solarized-light',   name: 'solarized light',    bg: '#fdf6e3', bg2: '#eee8d5', main: '#268bd2', text: '#657b83', sub: '#93a1a1', error: '#dc322f' },
  { id: 'gruvbox-light',     name: 'gruvbox light',      bg: '#fbf1c7', bg2: '#f2e5bc', main: '#b57614', text: '#3c3836', sub: '#928374', error: '#9d0006' },
  { id: 'nord-light',        name: 'nord light',         bg: '#eceff4', bg2: '#e5e9f0', main: '#5e81ac', text: '#2e3440', sub: '#4c566a', error: '#bf616a' },
  { id: 'one-light',         name: 'one light',          bg: '#fafafa', bg2: '#f0f0f0', main: '#4078f2', text: '#383a42', sub: '#a0a1a7', error: '#e45649' },
  { id: 'rose-pine-dawn',    name: 'rosé pine dawn',     bg: '#faf4ed', bg2: '#f2e9e1', main: '#d7827a', text: '#575279', sub: '#9893a5', error: '#b4637a' },
  { id: 'tangerine',         name: 'tangerine',          bg: '#fce4d0', bg2: '#f5d0b5', main: '#e8593c', text: '#3d2314', sub: '#c08060', error: '#c0392b' },
  { id: 'magic-girl',        name: 'magic girl',         bg: '#fde8f5', bg2: '#f7d4ee', main: '#d966a6', text: '#3d1f35', sub: '#c090b0', error: '#e53935' },
  { id: 'peaches',           name: 'peaches',            bg: '#fff0eb', bg2: '#ffe4dc', main: '#e8714a', text: '#3d2018', sub: '#c09080', error: '#c0392b' },
  { id: 'beach',             name: 'beach',              bg: '#e8f4f8', bg2: '#d4eaf2', main: '#0077b6', text: '#1a3a4a', sub: '#6a9eb5', error: '#e53935' },
  { id: 'desert-oasis',      name: 'desert oasis',       bg: '#fdf0d5', bg2: '#f5e4c0', main: '#c47c2b', text: '#3a2a10', sub: '#9a7a50', error: '#c0392b' },
  { id: 'blueberry-light',   name: 'blueberry light',    bg: '#eef0fb', bg2: '#dde0f5', main: '#3949ab', text: '#1a2060', sub: '#7a82c0', error: '#e53935' },
  { id: 'gruvbox-light-m',   name: 'gruvbox soft',       bg: '#f9f5d7', bg2: '#ebdbb2', main: '#79740e', text: '#3c3836', sub: '#928374', error: '#cc241d' },
  { id: 'witch-girl',        name: 'witch girl',         bg: '#f5eafb', bg2: '#ead5f5', main: '#8e44ad', text: '#2d1240', sub: '#9a7ab0', error: '#e53935' },
  { id: 'repose-light',      name: 'repose light',       bg: '#f0ede8', bg2: '#e5e0da', main: '#5f6b7a', text: '#2d3035', sub: '#9a9890', error: '#c0392b' },
  { id: 'iceberg-light',     name: 'iceberg light',      bg: '#e8e9ec', bg2: '#d8dae0', main: '#2d539e', text: '#1a2050', sub: '#7a8090', error: '#cc3768' },
  { id: 'lil-dragon',        name: 'lil dragon',         bg: '#fff5e6', bg2: '#ffe8cc', main: '#ff9500', text: '#3d2500', sub: '#c08040', error: '#e53935' },
  { id: 'lilac-mist',        name: 'lilac mist',         bg: '#f4f0fa', bg2: '#e8e0f5', main: '#7c5cbf', text: '#2d2050', sub: '#9a88c0', error: '#e53935' },
  { id: 'soaring-skies',     name: 'soaring skies',      bg: '#e8f4fb', bg2: '#d0e8f5', main: '#0288d1', text: '#01344f', sub: '#5a98b5', error: '#e53935' },
  { id: 'camping',           name: 'camping',            bg: '#f0ece0', bg2: '#e4dcc8', main: '#5d7a3e', text: '#2a3818', sub: '#8a9a70', error: '#c0392b' },
  { id: 'cheesecake',        name: 'cheesecake',         bg: '#fdf6e0', bg2: '#f5eccc', main: '#d4a017', text: '#3a2c00', sub: '#a08030', error: '#c0392b' },
  { id: 'terrazzo',          name: 'terrazzo',           bg: '#f5f0ea', bg2: '#ebe4dc', main: '#d4573c', text: '#3d2218', sub: '#9a7a6a', error: '#c0392b' },
  { id: 'godspeed',          name: 'godspeed',           bg: '#f8fbff', bg2: '#e8f0fa', main: '#1a73e8', text: '#202124', sub: '#80909c', error: '#d93025' },
  { id: 'taro',              name: 'taro',               bg: '#f0eaf8', bg2: '#e0d4f2', main: '#6a3fa0', text: '#2a1850', sub: '#9070b8', error: '#e53935' },
  { id: 'mr-sleeves',        name: 'mr sleeves',         bg: '#e8f0e8', bg2: '#d4e4d4', main: '#2e7d32', text: '#1a2c1a', sub: '#6a9a6a', error: '#c0392b' },
  { id: 'pastel',            name: 'pastel',             bg: '#fef9f5', bg2: '#faeee4', main: '#e8a0a0', text: '#5a3030', sub: '#c8a0a0', error: '#d4706a' },
  { id: 'tiramisu',          name: 'tiramisu',           bg: '#faf0e0', bg2: '#f0e0c8', main: '#8b6040', text: '#3d2818', sub: '#a08060', error: '#c0392b' },
  { id: 'lavender',          name: 'lavender',           bg: '#f5f0ff', bg2: '#e8e0fa', main: '#6840c0', text: '#2a1860', sub: '#9880c0', error: '#e53935' },
  { id: 'iv-clover',         name: 'iv clover',          bg: '#edf8ee', bg2: '#d8f0d8', main: '#2e7d32', text: '#1a3a1a', sub: '#6a9a6a', error: '#c0392b' },
  { id: 'pink-lemonade',     name: 'pink lemonade',      bg: '#fff0f8', bg2: '#ffdcf0', main: '#e040a0', text: '#4a0830', sub: '#c080a8', error: '#e53935' },
  { id: 'creamsicle',        name: 'creamsicle',         bg: '#fff8f0', bg2: '#ffe8d8', main: '#ff6d22', text: '#3d1800', sub: '#c09060', error: '#c0392b' },
  { id: 'miami',             name: 'miami',              bg: '#fff0f8', bg2: '#ffe0f0', main: '#ff1493', text: '#4a0028', sub: '#c05090', error: '#00bcd4' },
  { id: 'fruit-chew',        name: 'fruit chew',         bg: '#fff0f5', bg2: '#ffdce8', main: '#e91e8c', text: '#4a0828', sub: '#c08098', error: '#00c853' },
  { id: 'frozen-llama',      name: 'frozen llama',       bg: '#e8f8ff', bg2: '#d0f0ff', main: '#00b4d8', text: '#023e58', sub: '#60a8c0', error: '#e53935' },
  { id: 'mizu',              name: 'mizu',               bg: '#f0f8ff', bg2: '#dceeff', main: '#0077b6', text: '#012a48', sub: '#5a98c0', error: '#e53935' },
  { id: 'strawberry',        name: 'strawberry',         bg: '#fff0f0', bg2: '#ffdcdc', main: '#e53935', text: '#3d0a0a', sub: '#c08080', error: '#c0392b' },
  { id: 'fleuriste',         name: 'fleuriste',          bg: '#fdf0f8', bg2: '#f5dcec', main: '#c2185b', text: '#4a0828', sub: '#b07090', error: '#e53935' },
  { id: 'honey',             name: 'honey',              bg: '#fffde7', bg2: '#fff8c5', main: '#f9a825', text: '#3d2a00', sub: '#c0a030', error: '#c0392b' },
  { id: 'slambook',          name: 'slambook',           bg: '#ffffff', bg2: '#f5f5f5', main: '#ff4081', text: '#212121', sub: '#9e9e9e', error: '#f44336' },
  { id: 'rainbow-trail',     name: 'rainbow trail',      bg: '#fafafa', bg2: '#f0f0f0', main: '#e040fb', text: '#212121', sub: '#9e9e9e', error: '#f44336' },
  { id: 'breeze',            name: 'breeze',             bg: '#f5f8ff', bg2: '#e8edff', main: '#3b5bdb', text: '#1a1f3d', sub: '#7a88c0', error: '#e53935' },
  { id: 'hanok',             name: 'hanok',              bg: '#fdf8f0', bg2: '#f2ece0', main: '#c44b00', text: '#2d1800', sub: '#9a7050', error: '#c0392b' },
  { id: 'retro',             name: 'retro',              bg: '#f5f0e8', bg2: '#ebe4d8', main: '#c17f3a', text: '#3d2800', sub: '#9a7050', error: '#c0392b' },
];

// ── SPECIAL THEMES ───────────────────────────────────────────────
const special: NTTheme[] = [
  // rgb: --main animates via @keyframes rgb-cycle when class "theme-rgb" is on :root
  { id: 'rgb',               name: 'rgb',                bg: '#000000', bg2: '#0d0d0d', main: '#ff0000', text: '#ffffff', sub: '#444444', error: '#ff4444' },
  { id: 'future-funk',       name: 'future funk',        bg: '#241734', bg2: '#2e1d44', main: '#ffdd00', text: '#ff88dd', sub: '#8844aa', error: '#ff4444' },
  { id: 'aurora-borealis',   name: 'aurora borealis',    bg: '#0d1b2a', bg2: '#1a2a3a', main: '#57cc99', text: '#e0fbfc', sub: '#22577a', error: '#ff4d6d' },
  { id: 'cosmic-latte',      name: 'cosmic latte',       bg: '#fff8e7', bg2: '#fff0d0', main: '#9b59b6', text: '#2c3e50', sub: '#8e8e8e', error: '#e74c3c' },
  { id: 'deep-sea',          name: 'deep sea',           bg: '#050a18', bg2: '#0a1228', main: '#00b4d8', text: '#caf0f8', sub: '#1a3a5a', error: '#e63946' },
  { id: 'our-theme',         name: 'nathantype',         bg: '#1a1a2e', bg2: '#16213e', main: '#e2b714', text: '#ffffff', sub: '#0f3460', error: '#e94560' },
  { id: 'metaverse-2',       name: 'metaverse ii',       bg: '#0d0221', bg2: '#1a0536', main: '#e040fb', text: '#e0e0e0', sub: '#3a2060', error: '#ff0099' },
  { id: 'forest',            name: 'forest',             bg: '#0d1a0d', bg2: '#162516', main: '#4caf50', text: '#c8e6c9', sub: '#2e5430', error: '#f44336' },
  { id: 'sunset',            name: 'sunset',             bg: '#1a0a00', bg2: '#2d1500', main: '#ff8c42', text: '#ffe0c0', sub: '#7a3a10', error: '#ff4444' },
  { id: 'hacker',            name: 'hacker',             bg: '#000000', bg2: '#001100', main: '#33ff33', text: '#00bb00', sub: '#004400', error: '#ff0000' },
  { id: 'serika-light',      name: 'serika light',       bg: '#e1e0d7', bg2: '#d5d4cc', main: '#e2b714', text: '#2c2e31', sub: '#888a8b', error: '#da3333' },
];

export const allThemes: NTTheme[] = [...dark, ...light, ...special];

export function getTheme(id: string): NTTheme | undefined {
  return allThemes.find(t => t.id === id);
}
