export interface FontOption {
  id: string;
  name: string;
  googleFamily: string;
  cssFamily: string;
  googleFont: boolean;
  ligatures?: boolean;
}

export const allFonts: FontOption[] = [
  { id: 'roboto-mono',       name: 'Roboto Mono',        googleFont: true,  googleFamily: 'Roboto+Mono',          cssFamily: "'Roboto Mono', monospace" },
  { id: 'fira-code',         name: 'Fira Code',          googleFont: true,  googleFamily: 'Fira+Code',            cssFamily: "'Fira Code', monospace",  ligatures: true },
  { id: 'jetbrains-mono',    name: 'JetBrains Mono',     googleFont: true,  googleFamily: 'JetBrains+Mono',       cssFamily: "'JetBrains Mono', monospace" },
  { id: 'source-code-pro',   name: 'Source Code Pro',    googleFont: true,  googleFamily: 'Source+Code+Pro',      cssFamily: "'Source Code Pro', monospace" },
  { id: 'ibm-plex-mono',     name: 'IBM Plex Mono',      googleFont: true,  googleFamily: 'IBM+Plex+Mono',        cssFamily: "'IBM Plex Mono', monospace" },
  { id: 'inconsolata',       name: 'Inconsolata',        googleFont: true,  googleFamily: 'Inconsolata',          cssFamily: "'Inconsolata', monospace" },
  { id: 'space-mono',        name: 'Space Mono',         googleFont: true,  googleFamily: 'Space+Mono',           cssFamily: "'Space Mono', monospace" },
  { id: 'courier-prime',     name: 'Courier Prime',      googleFont: true,  googleFamily: 'Courier+Prime',        cssFamily: "'Courier Prime', monospace" },
  { id: 'overpass-mono',     name: 'Overpass Mono',      googleFont: true,  googleFamily: 'Overpass+Mono',        cssFamily: "'Overpass Mono', monospace" },
  { id: 'ubuntu-mono',       name: 'Ubuntu Mono',        googleFont: true,  googleFamily: 'Ubuntu+Mono',          cssFamily: "'Ubuntu Mono', monospace" },
  { id: 'anonymous-pro',     name: 'Anonymous Pro',      googleFont: true,  googleFamily: 'Anonymous+Pro',        cssFamily: "'Anonymous Pro', monospace" },
  { id: 'oxygen-mono',       name: 'Oxygen Mono',        googleFont: true,  googleFamily: 'Oxygen+Mono',          cssFamily: "'Oxygen Mono', monospace" },
  { id: 'nanum-gothic-coding', name: 'Nanum Gothic Coding', googleFont: true, googleFamily: 'Nanum+Gothic+Coding', cssFamily: "'Nanum Gothic Coding', monospace" },
  { id: 'share-tech-mono',   name: 'Share Tech Mono',    googleFont: true,  googleFamily: 'Share+Tech+Mono',      cssFamily: "'Share Tech Mono', monospace" },
  { id: 'cutive-mono',       name: 'Cutive Mono',        googleFont: true,  googleFamily: 'Cutive+Mono',          cssFamily: "'Cutive Mono', monospace" },
  { id: 'vt323',             name: 'VT323',              googleFont: true,  googleFamily: 'VT323',                cssFamily: "'VT323', monospace" },
  { id: 'press-start-2p',    name: 'Press Start 2P',     googleFont: true,  googleFamily: 'Press+Start+2P',       cssFamily: "'Press Start 2P', monospace" },
  { id: 'special-elite',     name: 'Special Elite',      googleFont: true,  googleFamily: 'Special+Elite',        cssFamily: "'Special Elite', monospace" },
  { id: 'xanh-mono',         name: 'Xanh Mono',          googleFont: true,  googleFamily: 'Xanh+Mono',            cssFamily: "'Xanh Mono', monospace" },
  { id: 'martian-mono',      name: 'Martian Mono',       googleFont: true,  googleFamily: 'Martian+Mono',         cssFamily: "'Martian Mono', monospace" },
  { id: 'dm-mono',           name: 'DM Mono',            googleFont: true,  googleFamily: 'DM+Mono',              cssFamily: "'DM Mono', monospace" },
  { id: 'azeret-mono',       name: 'Azeret Mono',        googleFont: true,  googleFamily: 'Azeret+Mono',          cssFamily: "'Azeret Mono', monospace" },
  { id: 'syne-mono',         name: 'Syne Mono',          googleFont: true,  googleFamily: 'Syne+Mono',            cssFamily: "'Syne Mono', monospace" },
  { id: 'chivo-mono',        name: 'Chivo Mono',         googleFont: true,  googleFamily: 'Chivo+Mono',           cssFamily: "'Chivo Mono', monospace" },
  { id: 'spline-sans-mono',  name: 'Spline Sans Mono',   googleFont: true,  googleFamily: 'Spline+Sans+Mono',     cssFamily: "'Spline Sans Mono', monospace" },
  { id: 'fragment-mono',     name: 'Fragment Mono',      googleFont: true,  googleFamily: 'Fragment+Mono',        cssFamily: "'Fragment Mono', monospace" },
  { id: 'recursive',         name: 'Recursive Mono',     googleFont: true,  googleFamily: 'Recursive',            cssFamily: "'Recursive', monospace" },
  { id: 'noto-sans-mono',    name: 'Noto Sans Mono',     googleFont: true,  googleFamily: 'Noto+Sans+Mono',       cssFamily: "'Noto Sans Mono', monospace" },
  { id: 'input-mono',        name: 'Input Mono',         googleFont: false, googleFamily: '',                     cssFamily: "'Input Mono', 'Courier New', monospace" },
  { id: 'cascadia-code',     name: 'Cascadia Code',      googleFont: false, googleFamily: '',                     cssFamily: "'Cascadia Code', Consolas, monospace" },
  { id: 'menlo',             name: 'Menlo',              googleFont: false, googleFamily: '',                     cssFamily: "Menlo, 'DejaVu Sans Mono', monospace" },
  { id: 'consolas',          name: 'Consolas',           googleFont: false, googleFamily: '',                     cssFamily: "Consolas, 'Courier New', monospace" },
  { id: 'monaco',            name: 'Monaco',             googleFont: false, googleFamily: '',                     cssFamily: "Monaco, 'Lucida Console', monospace" },
  { id: 'courier-new',       name: 'Courier New',        googleFont: false, googleFamily: '',                     cssFamily: "'Courier New', Courier, monospace" },
  { id: 'hack',              name: 'Hack',               googleFont: false, googleFamily: '',                     cssFamily: "Hack, 'Fira Mono', monospace" },
  { id: 'geist-mono',        name: 'Geist Mono',         googleFont: false, googleFamily: '',                     cssFamily: "'Geist Mono', 'Fira Mono', monospace" },
  { id: 'maple-mono',        name: 'Maple Mono',         googleFont: true,  googleFamily: 'Maple+Mono',           cssFamily: "'Maple Mono', 'Fira Code', monospace", ligatures: true },
  { id: 'comic-mono',        name: 'Comic Mono',         googleFont: false, googleFamily: '',                     cssFamily: "'Comic Mono', 'Comic Sans MS', monospace" },
  { id: 'pixelify-sans',     name: 'Pixelify Sans',      googleFont: true,  googleFamily: 'Pixelify+Sans',        cssFamily: "'Pixelify Sans', monospace" },
  { id: 'geologica',         name: 'Geologica',          googleFont: true,  googleFamily: 'Geologica',            cssFamily: "'Geologica', monospace" },
];

export function getFontById(id: string): FontOption | undefined {
  return allFonts.find(f => f.id === id);
}
