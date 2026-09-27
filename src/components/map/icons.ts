/** Billboard images as SVG data URIs, cached by their visual key. */

const cache = new Map<string, string>();

function uri(key: string, svg: () => string): string {
  let value = cache.get(key);
  if (!value) {
    value = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg())}`;
    cache.set(key, value);
  }
  return value;
}

const CYAN = "#39d0d8";
const BG = "#0d1117";

export function droneIcon(color: string, selected: boolean): string {
  return uri(`drone|${color}|${selected}`, () => {
    const stroke = selected ? CYAN : "#ffffff";
    const ring = selected
      ? `<circle cx="20" cy="20" r="18" fill="none" stroke="${CYAN}" stroke-width="1.5" stroke-dasharray="3 3"/>`
      : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${ring}<polygon points="20,5 29,32 20,26 11,32" fill="${color}" stroke="${stroke}" stroke-width="${selected ? 2.5 : 1.5}" stroke-linejoin="round"/></svg>`;
  });
}

export function waypointIcon(
  label: string,
  color: string,
  selected: boolean,
): string {
  return uri(`wp|${label}|${color}|${selected}`, () => {
    const fontSize = label.length > 2 ? 9 : 11;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="11" fill="${selected ? color : BG}" stroke="${color}" stroke-width="2"/><text x="14" y="14" dy="0.36em" text-anchor="middle" font-family="monospace" font-size="${fontSize}" font-weight="700" fill="${selected ? BG : color}">${label}</text></svg>`;
  });
}

export function targetIcon(color: string, selected: boolean): string {
  return uri(`target|${color}|${selected}`, () => {
    const w = selected ? 2.5 : 1.8;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="11" fill="${color}22" stroke="${color}" stroke-width="${w}"/><circle cx="20" cy="20" r="2.5" fill="${color}"/><path d="M20 2v10M20 28v10M2 20h10M28 20h10" stroke="${color}" stroke-width="${w}"/></svg>`;
  });
}

export function homeIcon(color: string): string {
  return uri(
    `home|${color}`,
    () =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><rect x="2" y="2" width="18" height="18" fill="${BG}" stroke="${color}" stroke-width="2"/><text x="11" y="11" dy="0.36em" text-anchor="middle" font-family="monospace" font-size="11" font-weight="700" fill="${color}">H</text></svg>`,
  );
}

export function pointIcon(color: string): string {
  return uri(
    `point|${color}`,
    () =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><polygon points="11,2 20,11 11,20 2,11" fill="${color}33" stroke="${color}" stroke-width="2"/><circle cx="11" cy="11" r="2" fill="${color}"/></svg>`,
  );
}
