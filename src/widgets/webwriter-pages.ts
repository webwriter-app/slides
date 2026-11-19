import { html, type PropertyValues } from "lit";
import { LitElementWw, resolveDeclarations, signal } from "@webwriter/lit";
import {
    customElement,
    property,
    queryAssignedElements,
    state,
} from "lit/decorators.js";
import type { MsgFn } from "@lit/localize";
import { localizer } from "@webwriter/lit/localize";
import { Permissions } from "@webwriter/lit/permissions";
import { Drag, type DragCommitDetail } from "@webwriter/lit/drag";
import { transaction } from "@webwriter/widget/transaction";
import type { ActionDeclaration, OptionDeclaration, Declared } from "@webwriter/widget";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import "@shoelace-style/shoelace/dist/themes/light.css";
// @ts-ignore The Lit localization CLI generates this JavaScript module.
import { sourceLocale, targetLocales } from "../../localization/generated/locale-codes.js";

import { WebwriterPage } from "./webwriter-page";
import { pages_styles } from "../components/webwriter-pages.styles";
import { renderControls } from "../components/pages-controls";
import { renderThumbs, renderTabs } from "../components/pages-strip";
import { sectionToPages, pageToDetails } from "../components/pages-convert";
import { captureThumbnail } from "../components/page-thumbnail";
import type { PagesView } from "../model/pages-view";

type Labelled = { msg: MsgFn };

/**
 * Display authored content as pages, with tabs by default or a preview-card layout.
 *
 * Authors add `webwriter-page` children; the `type` attribute switches between the Slides view with preview cards ("pages")
 * and the default tab strip ("tabs"). Thumbnails are drawn in the editor with a capture library that loads on first use.
 * In use mode the arrow keys, the controls and swipes in fullscreen move between pages. The arrow keys leave
 * text entry, Alt and Meta combinations alone. Every thumbnail and tab has a button that selects its page;
 * in edit mode Space or Enter on the thumbnail itself picks it up for reordering.
 *
 * Set `orientation="portrait"` for a 9:16 page, or use the default `landscape` for 16:9.
 * The orientation applies to both views, fullscreen, and preview cards.
 *
 * The widget follows the page theme: `--ww-text-color`, `--ww-font-family`, and `--ww-theme-accent-1` (the
 * selected thumbnail). On paper it prints all pages one after another and leaves out the controls.
 *
 * Conversions: a `section` becomes pages (its nested `section` children become one page each, otherwise the
 * section is one page). Each page converts to a `details` element with its label as the summary.
 * The thumbnails are not carried over.
 *
 * Signals: `page` is the number of the current page, starting at 1; `count` is the number of pages.
 * Both change when readers or authors move to another page.
 *
 * Known limitation: in edit mode the drag module sets `touch-action: none` on the thumbnails, so on a touch
 * screen the thumbnail strip cannot be scrolled by dragging on a thumbnail; the select buttons still work.
 *
 * @slot default - Page elements to be displayed (should be `webwriter-page` components only).
 * @part actions - The pane of thumbnails and controls below or beside the page.
 * @part tabs - The strip of tabs and controls above the page.
 * @part thumbnail - One page thumbnail in the strip.
 * @part tab - One tab in the tab strip.
 */
@customElement("webwriter-pages")
export class WebwriterPages extends LitElementWw {
    static styles = pages_styles;

    static scopedElements = {
        "sl-icon-button": SlIconButton,
        "sl-icon": SlIcon,
    };

    static convertFrom = { section: "loadSections" };
    static convertTo = { details: "toDetails" };

    static options = {
        type: {
            type: "select",
            label: (widget: Labelled) => widget.msg("View"),
            options: [
                { value: "tabs", label: (widget: Labelled) => widget.msg("Tabs") },
                { value: "pages", label: (widget: Labelled) => widget.msg("Slides") },
            ],
        },
    } satisfies Record<string, Declared<OptionDeclaration>>;

    static actions = {
        addPage: { label: (widget: Labelled) => widget.msg("Add"), buttonGroup: "pages", icon: "Plus", intent: "default" },
        removeActivePage: { label: (widget: Labelled) => widget.msg("Remove"), buttonGroup: "pages", icon: "Delete", intent: "danger", disabled: true },
        duplicateActivePage: { label: (widget: Labelled) => widget.msg("Duplicate"), buttonGroup: "pages", icon: "Copy", intent: "default", disabled: true },
    } satisfies Record<string, Declared<ActionDeclaration>>;

    // The drawer labels are computed with `msg`, so the editor reads them again after a language change.
    localize = localizer(this, {
        sourceLocale,
        targetLocales,
        load: (locale) => import(`../../localization/generated/${locale}.ts`),
        drawer: true,
    });
    private readonly msg = this.localize.msg;

    #permissions = new Permissions(this);

    /**
     * Defines the type of view for the sequence of pages.
     * - "pages": Show the Slides view with preview cards.
     * - "tabs": Show content using tabs.
     */
    @property({
        type: String,
        attribute: true,
        reflect: true,
        useDefault: true,
        converter: { fromAttribute: (value: string | null) => value === "pages" ? "pages" : "tabs" },
    })
    public accessor type: "tabs" | "pages" = "tabs";

    /** Page orientation: 16:9 landscape or 9:16 portrait. */
    @property({ type: String, reflect: true, useDefault: true })
    accessor orientation: "landscape" | "portrait" = "landscape";

    /**
     * All `webwriter-page` elements.
     * Represents the individual pages in the sequence of pages.
     */
    @queryAssignedElements()
    protected accessor pages!: WebwriterPage[];

    /** Index of the currently active page. */
    @state()
    accessor activePageIndex = 0;

    @state()
    private accessor tabScroll = { backward: false, forward: false };

    #tabScroller: HTMLElement | null = null;
    #tabResizeObserver?: ResizeObserver;
    #pageAttributesObserver = new MutationObserver((records) => {
        if (records.some(({ target }) => target.parentNode === this && (target as Element).localName === "webwriter-page")) {
            this.requestUpdate();
        }
    });

    #page = signal(1);
    #count = signal(0);

    /** Public signals: the current page number (from 1) and the number of pages. */
    readonly signals = { page: this.#page, count: this.#count };

    #actionsDisabled = { duplicateActivePage: true, removeActivePage: true };
    #lifecycle?: AbortController;
    #changeTimer?: ReturnType<typeof setTimeout>;
    #touchStartX: number | null = null;
    #touchStartY = 0;
    #touchTarget: Element | null = null;

    /** The drawer declarations with the availability of the page actions, which follows the pages. */
    get actions() {
        const actions = resolveDeclarations<ActionDeclaration>(this, WebwriterPages.actions)!;
        return {
            ...actions,
            duplicateActivePage: { ...actions.duplicateActivePage, disabled: this.#actionsDisabled.duplicateActivePage },
            removeActivePage: { ...actions.removeActivePage, disabled: this.#actionsDisabled.removeActivePage },
        };
    }

    /** The active page element based on the activePageIndex. */
    get activePage(): WebwriterPage {
        return this.pages[this.activePageIndex];
    }

    /** False if Pages is on the last page. */
    get hasNextPage(): boolean {
        return this.activePageIndex < this.pages?.length - 1;
    }

    /** False if Pages is on the first page. */
    get hasPreviousPage(): boolean {
        return this.activePageIndex > 0;
    }

    /** Whether the sequence of pages is currently displayed in fullscreen mode. */
    protected get isFullscreen() {
        return this.ownerDocument.fullscreenElement === this;
    }

    constructor() {
        super();
        // Reordering by pointer or keyboard is for authors only.
        new Drag(this, { can: () => this.#permissions.editing });
        this.addEventListener("fullscreenchange", () => this.requestUpdate());
    }

    connectedCallback() {
        super.connectedCallback?.();
        this.#lifecycle = new AbortController();
        const { signal } = this.#lifecycle;

        window.addEventListener("keydown", (e) => this.#handleKeyDown(e), { signal });
        document.addEventListener("selectionchange", () => this.#handleSelectionChange(), { passive: true, signal });
        this.addEventListener("touchstart", (e) => this.#handleTouchStart(e), { passive: true, signal });
        this.addEventListener("touchend", (e) => this.#handleTouchEnd(e), { passive: true, signal });
        this.#pageAttributesObserver.observe(this, { attributes: true, attributeFilter: ["label", "style", "class"], subtree: true });
        this.requestUpdate();
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
        this.#lifecycle?.abort();
        this.#lifecycle = undefined;
        clearTimeout(this.#changeTimer);
        this.#tabResizeObserver?.disconnect();
        this.#tabScroller = null;
        this.#pageAttributesObserver.disconnect();
    }

    protected firstUpdated(): void {
        this.requestUpdate();
    }

    /**
     * Lifecycle method called whenever the component is updated.
     * Updates each page's `active` property based on the current activePageIndex.
     */
    protected updated(changed: PropertyValues<this>) {
        super.updated(changed);
        if (changed.has("orientation") && changed.get("orientation") !== undefined && this.#permissions.editing) {
            this.changePage(this.activePageIndex);
        }
        const scroller = this.renderRoot.querySelector<HTMLElement>(".page-tabs-wrapper");
        if (scroller !== this.#tabScroller) {
            this.#tabResizeObserver?.disconnect();
            this.#tabScroller = scroller;
            if (scroller) {
                this.#tabResizeObserver ??= new ResizeObserver(this.#updateTabScroll);
                this.#tabResizeObserver.observe(scroller);
                if (scroller.firstElementChild) this.#tabResizeObserver.observe(scroller.firstElementChild);
                const stage = this.renderRoot.querySelector(".page-stage");
                if (stage) this.#tabResizeObserver.observe(stage);
                const viewport = this.renderRoot.querySelector(".page-viewport");
                if (viewport) this.#tabResizeObserver.observe(viewport);
            }
        }
        this.#updateTabScroll();
        this.pages?.forEach(
            (page, i) => (page.active = i === this.activePageIndex)
        );
        this.#page.set(this.activePageIndex + 1);
        this.#count.set(this.pages?.length ?? 0);
        const duplicateDisabled = !this.activePage;
        const removeDisabled = duplicateDisabled || this.pages.length <= 1;
        if (this.#actionsDisabled.duplicateActivePage !== duplicateDisabled ||
            this.#actionsDisabled.removeActivePage !== removeDisabled) {
            this.#actionsDisabled = { duplicateActivePage: duplicateDisabled, removeActivePage: removeDisabled };
            this.dispatchEvent(new Event("optionschange", { bubbles: true }));
        }
    }

    #updateTabScroll = () => {
        const tabs = this.renderRoot.querySelector<HTMLElement>('[part="tabs"]');
        const stage = this.renderRoot.querySelector<HTMLElement>(".page-stage");
        if (tabs && stage) {
            const style = getComputedStyle(stage);
            const width = style.inlineSize;
            if (tabs.style.getPropertyValue("--_page-inline-size") !== width) tabs.style.setProperty("--_page-inline-size", width);
            const viewport = this.renderRoot.querySelector<HTMLElement>(".page-viewport");
            const offset = Math.max(0, ((viewport?.clientHeight ?? 0) - parseFloat(style.blockSize)) / 2) + parseFloat(getComputedStyle(tabs).borderBottomWidth);
            const position = `${offset}px`;
            if (tabs.style.getPropertyValue("--_page-block-offset") !== position) tabs.style.setProperty("--_page-block-offset", position);
        }
        const scroller = this.#tabScroller;
        const max = scroller ? Math.max(0, scroller.scrollWidth - scroller.clientWidth) : 0;
        const rtl = scroller && getComputedStyle(scroller).direction === "rtl";
        const position = scroller ? Math.max(0, Math.min(max, scroller.scrollLeft * (rtl ? -1 : 1))) : 0;
        const backward = position > 1;
        const forward = position < max - 1;
        if (backward !== this.tabScroll.backward || forward !== this.tabScroll.forward) {
            this.tabScroll = { backward, forward };
        }
    };

    #scrollTabs = (backwards: boolean) => {
        const scroller = this.#tabScroller;
        if (!scroller?.isConnected) return;
        const direction = getComputedStyle(scroller).direction === "rtl" ? -1 : 1;
        scroller.scrollBy({
            left: scroller.clientWidth * 0.8 * (backwards ? -1 : 1) * direction,
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
    };

    #setPageLabel = (page: WebwriterPage, label: string) => {
        if (!this.#permissions.editing || !page.isConnected || page.parentElement !== this || page !== this.activePage || page.getAttribute("label") === label) return;
        transaction(this, () => {
            if (label) page.setAttribute("label", label);
            else page.removeAttribute("label");
            this.requestUpdate();
        });
    };

    /** Replaces the pages with the pages a `section` stands for; declines anything else. */
    loadSections(fragment: DocumentFragment): boolean {
        const source = fragment.firstElementChild;
        if (source?.localName !== "section") return false;
        this.replaceChildren(...sectionToPages(source, this.ownerDocument));
        this.activePageIndex = 0;
        return true;
    }

    /** One `details` per page with its label as summary; `null` without pages. */
    toDetails(): DocumentFragment | null {
        const pages = Array.from(this.children).filter((child) => child.localName === "webwriter-page");
        if (!pages.length) return null;
        const fragment = this.ownerDocument.createDocumentFragment();
        fragment.append(...pages.map((page, index) => pageToDetails(page, this.ownerDocument, this.msg("Page") + " " + (index + 1))));
        return fragment;
    }

    duplicateActivePage() { this.duplicatePage(this.activePageIndex); }

    /** Add a new empty page element. Optionally insert after given index. */
    addPage(index?: number) {
        transaction(this, () => this.#addPage(index));
    }

    #addPage(index?: number) {
        const page = this.ownerDocument.createElement(
            "webwriter-page"
        ) as WebwriterPage;
        const p = this.ownerDocument.createElement("p");
        page.appendChild(p);

        if (index !== undefined && index >= 0 && index < this.pages.length) {
            const refPage = this.pages[index];
            refPage.insertAdjacentElement("afterend", page);
        } else {
            this.appendChild(page);
        }

        this.changePage(this.pages.indexOf(page));

        // place cursor at the start of the new page
        const selection = document.getSelection();
        if (selection) {
            selection.setBaseAndExtent(p, 0, p, 0);
        }
        return this.updateComplete;
    }

    /** Duplicate an existing page at given index. */
    duplicatePage(index: number) {
        transaction(this, () => this.#duplicatePage(index));
    }

    #duplicatePage(index: number) {
        const original = this.pages[index];
        if (!original) return;

        const clone = original.cloneNode(true) as WebwriterPage;
        original.insertAdjacentElement("afterend", clone);

        this.changePage(this.pages.indexOf(clone));
        return this.updateComplete;
    }

    /** Remove the currently active page element. */
    removeActivePage() {
        if (this.pages.length > 1 && this.activePage) {
            this.removePage(this.activePageIndex);
        }
    }

    /** Remove a page and return editor selection to the surviving active page's start. */
    removePage(pageIndex: number) {
        if (this.pages.length <= 1 || !this.pages[pageIndex]) return;
        transaction(this, async () => {
            const page = this.pages[pageIndex];
            if (this.pages.length <= 1 || !page) return;
            page.remove();
            this.changePage(Math.min(this.activePageIndex, this.pages.length - 1));
            const active = this.activePage;
            this.requestUpdate();
            await this.updateComplete;
            await active?.updateComplete;
            if (this.isConnected && active && this.activePage === active && this.#permissions.editing) {
                this.#selectPageStart(active);
            }
        });
    }

    /** Return document editing to the first content of the surviving page. */
    #selectPageStart(page: WebwriterPage) {
        (this.renderRoot as ShadowRoot).activeElement?.closest<HTMLElement>("sl-icon-button, input, button")?.blur();
        this.blur();
        const selection = this.ownerDocument.getSelection();
        if (!selection) return;
        let node: Node = page;
        let first: Element | undefined;
        let textContainer: Element | undefined;
        while (node instanceof Element) {
            if (node !== page && (node.localName.includes("-") || node.matches("img, picture, svg, math, video, audio, canvas, iframe, object, embed, hr, input, textarea, select, button, [contenteditable='false']"))) break;
            if (node.matches("p, h1, h2, h3, h4, h5, h6, pre, li, td, th, summary")) textContainer = node;
            const child = Array.from(node.childNodes).find((child) => child instanceof Text ? Boolean(child.data.trim())
                : child instanceof Element && !child.matches("[hidden], [inert], script, style, template") && getComputedStyle(child).display !== "none");
            if (!child || child instanceof HTMLBRElement) {
                if (node === page || node.matches("p, h1, h2, h3, h4, h5, h6, div, pre, li, td, th, summary")) {
                    selection.setPosition(node, 0);
                    return;
                }
                break;
            }
            if (node === page && child instanceof Element) first = child;
            node = child;
        }
        if (node instanceof Text) selection.setPosition(node, 0);
        else if (textContainer) selection.setPosition(textContainer, 0);
        else if (first) {
            const range = this.ownerDocument.createRange();
            range.selectNode(first);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    /** Activate the next page element. */
    nextPage(backwards = false, step = 1) {
        const i = this.activePageIndex;
        const n = this.pages?.length - 1;
        this.changePage(
            backwards ? Math.max(0, i - step) : Math.min(n, i + step)
        );
    }

    /** Follows the selection to the page that contains it. */
    #handleSelectionChange() {
        if ((this.renderRoot as ShadowRoot).activeElement?.classList.contains("page-label-input")) return;
        const selectedPageIndex = this.pages?.findIndex((page) =>
            document.getSelection()?.containsNode(page, true)
        );
        if (selectedPageIndex !== undefined && selectedPageIndex !== -1) {
            this.changePage(selectedPageIndex);
            this.requestUpdate();
        }
    }

    /**
     * Handles keyboard navigation for the sequence of pages.
     * ArrowRight advances to the next page, ArrowLeft goes back.
     * Only possible in preview mode.
     */
    #handleKeyDown(e: KeyboardEvent) {
        if (this.#permissions.editing || e.defaultPrevented || e.altKey || e.metaKey) return;
        if (e.composedPath().some((node) => node instanceof HTMLElement && this.#takesText(node))) return;

        switch (e.key) {
            case "ArrowRight":
                this.handleNextPageClick(e);
                break;
            case "ArrowLeft":
                this.handleNextPageClick(e, true);
                break;
        }
    }

    /** Whether the element is a place where arrow keys move a caret or a value. */
    #takesText(el: HTMLElement) {
        if (el.isContentEditable) return true;
        return ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || /^(textbox|combobox|pager|spinbutton|listbox)$/.test(el.getAttribute("role") ?? "");
    }

    /**
     * Handles the start of a touch event for swipe navigation.
     * Records the initial touch position and target element.
     * Only active in fullscreen mode.
     */
    #handleTouchStart(e: TouchEvent) {
        if (!this.isFullscreen) return;
        this.#touchStartX = e.touches[0].clientX;
        this.#touchStartY = e.touches[0].clientY;
        this.#touchTarget = e.target as Element;
    }

    /**
     * Determines if the given element or any of its ancestors (up to the sequence of pages container) is an interactive element.
     * Used to prevent swipe navigation when interacting with widgets or interactive elements.
     */
    #isInteractiveTarget(el: Element | null): boolean {
        const interactiveTags = new Set(["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A", "VIDEO", "AUDIO", "CANVAS", "DETAILS", "SUMMARY"]);
        let node = el;
        while (node && node.tagName !== "WEBWRITER-PAGE") {
            if (interactiveTags.has(node.tagName)) return true;
            if (node.hasAttribute("contenteditable") && node.getAttribute("contenteditable") !== "false") return true;
            if (node.tagName.includes("-")) return true;
            node = node.parentElement;
        }
        return false;
    }

    /**
     * Handles the end of a touch event for swipe navigation.
     * Determines the swipe direction and navigates to the next or previous page accordingly.
     * Ignores swipes on interactive elements or if the swipe distance is too small.
     */
    #handleTouchEnd(e: TouchEvent) {
        if (!this.isFullscreen || this.#touchStartX === null) return;
        const deltaX = e.changedTouches[0].clientX - this.#touchStartX;
        const deltaY = e.changedTouches[0].clientY - this.#touchStartY;
        const target = this.#touchTarget;
        this.#touchStartX = null;
        this.#touchTarget = null;
        if (this.#isInteractiveTarget(target) || Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
        this.nextPage(deltaX >= 0);
    }

    /**
     * Handles navigation to the next or previous page based on user input.
     * - Shift key: jump by the total number of pages.
     * - Ctrl key: jump by 10 pages.
     * - Otherwise: move by one page.
     *
     * @param e - The triggering mouse or keyboard event.
     * @param backwards - Whether to navigate backward (default is false).
     */
    protected handleNextPageClick(
        e: MouseEvent | KeyboardEvent,
        backwards = false
    ) {
        if (e.shiftKey) {
            this.nextPage(backwards, this.pages.length);
        } else if (e.ctrlKey) {
            this.nextPage(backwards, 10);
        } else {
            this.nextPage(backwards);
        }
    }

    /**
     * Changes the active page to the specified index.
     * Waits for rendering to finish, scrolls the active page into view,
     * and generates a thumbnail preview.
     *
     * @param index - The index of the page to activate.
     */
    protected changePage = (index: number) => {
        this.activePageIndex = index;

        // Wait briefly to ensure page rendering completes. Rapid calls (every selection change while
        // typing) collapse into one scroll and one thumbnail capture.
        clearTimeout(this.#changeTimer);
        this.#changeTimer = setTimeout(async () => {
            this.renderRoot.querySelector(".active")?.scrollIntoView({
                behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                block: "nearest",
                inline: "nearest",
            });

            const page = this.pages[index];
            if (!page) return;
            const orientation = this.orientation;
            const thumbnail = await captureThumbnail(page);
            // Only keep the capture if the page has not changed in the meantime.
            if (!this.isConnected || this.activePage !== page || this.orientation !== orientation) return;
            page.thumbnail = thumbnail;
            this.requestUpdate();
        }, 100);
    };

    /**
     * Moves the dragged page to the place the drop resolved to.
     * The thumbnails and tabs stand for the authored `webwriter-page` children,
     * so the commit moves the page itself and the lifted item settles at the new layout.
     */
    private onDragCommit(e: CustomEvent<DragCommitDetail>) {
        const from = Number(e.detail.key);
        const page = this.pages[from];
        const others = this.pages.filter((other) => other !== page);
        if (!page || e.detail.index === null) return;

        const next = others[e.detail.index];
        if (next) next.insertAdjacentElement("beforebegin", page);
        else others[others.length - 1].insertAdjacentElement("afterend", page);

        this.activePageIndex = e.detail.index;
        this.requestUpdate();
    }

    /** The sequence of pages as seen by the strip and control components. */
    #view(): PagesView {
        return {
            msg: this.msg,
            pages: this.pages,
            activePageIndex: this.activePageIndex,
            editing: this.#permissions.editing,
            isFullscreen: this.isFullscreen,
            hasPreviousPage: this.hasPreviousPage,
            hasNextPage: this.hasNextPage,
            canScrollTabsBackward: this.tabScroll.backward,
            canScrollTabsForward: this.tabScroll.forward,
            scrollTabs: this.#scrollTabs,
            onTabScroll: this.#updateTabScroll,
            setPageLabel: this.#setPageLabel,
            changePage: (index) => this.changePage(index),
            addPage: (index) => this.addPage(index),
            duplicatePage: (index) => this.duplicatePage(index),
            removePage: (index) => this.removePage(index),
            handleNextPageClick: (e, backwards) => this.handleNextPageClick(e, backwards),
            toggleFullscreen: () => {
                if (this.isFullscreen) this.ownerDocument.exitFullscreen();
                else this.requestFullscreen();
                this.requestUpdate();
            },
            onDragCommit: (e) => this.onDragCommit(e as CustomEvent<DragCommitDetail>),
        };
    }

    /**
     * Renders the tab strip or the thumbnail strip with the page controls around the default slot.
     * The controls adapt depending on whether the component is editable.
     */
    render() {
        const view = this.#view();
        return html`
            <div class="pages-layout ${this.type === "pages" ? "pages-view" : "tabs-view"}">
                ${this.type !== "pages" ? renderTabs(view) : html``}
                <div class="page-viewport">
                    <div class="page-surface">
                        <div class="page-stage"><slot></slot></div>
                        ${this.type == "pages" && this.isFullscreen
                            ? html`<div class="controls-overlay" contenteditable="false">${renderControls(view)}</div>`
                            : html``}
                    </div>
                </div>
                ${this.type == "pages" && !this.isFullscreen ? renderThumbs(view) : html``}
            </div>
        `;
    }
}
