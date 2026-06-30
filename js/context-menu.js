// Small floating context menu shown on long-press (e.g. over a queue row),
// positioned near the press point and clamped to stay on-screen. Only one
// instance exists at a time — opening a new one closes whatever's open.

let menuEl = null;
let outsideHandler = null;

export function closeContextMenu(){
  if (!menuEl) return;
  menuEl.remove();
  menuEl = null;
  if (outsideHandler) {
    document.removeEventListener('pointerdown', outsideHandler, true);
    outsideHandler = null;
  }
}

// items: [{ label, onSelect }]
export function openContextMenu(x, y, items){
  closeContextMenu();

  const menu = document.createElement('div');
  menu.className = 'tok-ctx-menu';
  const hasIcons = items.some(item => item.icon);
  menu.innerHTML = items.map((item, i) =>
    '<button class="tok-ctx-item" data-i="' + i + '">' +
      (hasIcons ? '<span class="tok-ctx-icon">' + (item.icon || '') + '</span>' : '') +
      '<span>' + item.label + '</span>' +
    '</button>'
  ).join('');
  (document.querySelector('.tok-app') || document.body).appendChild(menu);
  menuEl = menu;

  // Position after insertion so we know its real size, then clamp to viewport.
  const rect = menu.getBoundingClientRect();
  const left = Math.min(Math.max(8, x - rect.width / 2), window.innerWidth - rect.width - 8);
  const top = Math.min(Math.max(8, y - rect.height / 2), window.innerHeight - rect.height - 8);
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  requestAnimationFrame(() => menu.classList.add('open'));

  menu.addEventListener('click', (e) => {
    const btn = e.target.closest('.tok-ctx-item');
    if (!btn) return;
    const item = items[parseInt(btn.getAttribute('data-i'), 10)];
    closeContextMenu();
    if (item && item.onSelect) item.onSelect();
  });

  outsideHandler = (e) => {
    if (!menu.contains(e.target)) closeContextMenu();
  };
  // Capture phase + next tick so the same long-press pointerup that opened
  // the menu doesn't immediately close it again.
  setTimeout(() => document.addEventListener('pointerdown', outsideHandler, true), 0);
}
