import type { WebwriterPages } from "../src/widgets/webwriter-pages";

const mounted: HTMLElement[] = [];

export const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
export const frame = (count = 1) => new Promise<void>(resolve => {
  const go = (left: number) => requestAnimationFrame(() => left > 1 ? go(left - 1) : resolve());
  go(count);
});

export async function until<T>(fn: () => T | Promise<T>, message = "condition not met", timeout = 8000): Promise<NonNullable<T>> {
  const end = performance.now() + timeout;
  while (performance.now() < end) {
    const value = await fn();
    if (value) return value as NonNullable<T>;
    await wait(30);
  }
  throw new Error(message);
}

const center = (el: Element) => {
  const rect = el.getBoundingClientRect();
  return { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
};

const fire = (el: Element, type: string, pos: { clientX: number; clientY: number }) =>
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, cancelable: true, pointerId: 7, button: 0, isPrimary: true, pointerType: "mouse", ...pos }));

export async function drag(item: HTMLElement, target: HTMLElement, { cancel = false } = {}) {
  item.scrollIntoView({ block: "center" });
  await frame();
  const from = center(item);
  fire(item, "pointerdown", from);
  fire(item, "pointermove", { clientX: from.clientX + 8, clientY: from.clientY + 8 });
  await frame(2);
  const lifted = item.hasAttribute("data-ww-dragging");
  const to = center(target);
  fire(item, "pointermove", to);
  await frame(2);
  if (cancel) window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  else fire(item, "pointerup", to);
  await frame(3);
  return { lifted };
}

export const pages = (count: number) =>
  Array.from({ length: count }, (_, i) => `<webwriter-page id="s${i + 1}"><p>Page ${i + 1}</p></webwriter-page>`).join("");

/** Adds the markup to the page and waits until the sequence of pages has rendered its thumbnails or tabs. */
export async function mount(html: string) {
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  document.body.append(wrap);
  mounted.push(wrap);
  const widget = wrap.querySelector("webwriter-pages") as WebwriterPages;
  await customElements.whenDefined("webwriter-pages");
  await widget.updateComplete;
  await until(() => widget.shadowRoot!.querySelector(".page-thumb, .page-tab"), "no thumbs");
  return widget;
}

export function track(element: HTMLElement) {
  mounted.push(element);
}

export function unmountAll() {
  for (const element of mounted.splice(0)) element.remove();
}

export const order = (widget: Element) => [...widget.children].filter(child => child.localName === "webwriter-page").map(child => child.id);
export const items = <T extends Element = HTMLElement>(widget: Element, selector: string) => [...widget.shadowRoot!.querySelectorAll<T>(selector)];

export function steps(widget: Element) {
  const log: string[] = [];
  const types = ["ww-transactionstart", "ww-dragcommit", "ww-transactionend"];
  const on = (event: Event) => log.push(event.type.replace("ww-", ""));
  for (const type of types) widget.addEventListener(type, on, true);
  return { log, stop: () => { for (const type of types) widget.removeEventListener(type, on, true); return log; } };
}

export const visible = (el: Element) => getComputedStyle(el).display !== "none" && !(el as HTMLElement).hidden;
