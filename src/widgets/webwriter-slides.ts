/** Module imports */
import { html, css, PropertyValueMap, PropertyValues } from "lit";
import { LitElementWw } from "@webwriter/lit";
import {
    customElement,
    property,
    queryAll,
    queryAssignedElements,
    state,
} from "lit/decorators.js";
import { msg } from "@lit/localize";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import LOCALIZE from "../../localization/generated";

import "@shoelace-style/shoelace/dist/themes/light.css";

import fullscreenIcon from "bootstrap-icons/icons/fullscreen.svg";
import fullscreenExitIcon from "bootstrap-icons/icons/fullscreen-exit.svg";
import plusSquareIcon from "bootstrap-icons/icons/plus-square.svg";
import minusSquareIcon from "bootstrap-icons/icons/dash-square.svg";
import chevronLeftIcon from "bootstrap-icons/icons/chevron-left.svg";
import chevronRightIcon from "bootstrap-icons/icons/chevron-right.svg";
import { WebwriterSlide } from "./webwriter-slide";

import IconRemove from "bootstrap-icons/icons/x-circle.svg";
import IconAdd from "bootstrap-icons/icons/plus-circle.svg";
import IconDuplicate from "bootstrap-icons/icons/copy.svg";
import {
    SlChangeEvent,
    SlOption,
    SlSelect,
    SlTooltip,
} from "@shoelace-style/shoelace";

import { snapdom } from "@zumer/snapdom";
import { slides_styles } from "../styles/styles";

/**
 * Container for displaying a slideshow of content sequentially.
 *
 * @slot default - Slide elements to be displayed (should be `webwriter-slide` components only).
 */
@customElement("webwriter-slides")
export class WebwriterSlides extends LitElementWw {
    protected localize = LOCALIZE;

    constructor() {
        super();

        this.addEventListener("fullscreenchange", () => this.requestUpdate());

        document.addEventListener(
            "selectionchange",
            (e) => {
                const selectedSlideIndex = this.slides?.findIndex((slide) =>
                    document.getSelection().containsNode(slide, true)
                );
                if (selectedSlideIndex !== -1) {
                    this.changeSlide(selectedSlideIndex);
                    this.requestUpdate();
                }
            },
            { passive: true }
        );
    }

    private _boundKeyHandler!: (e: KeyboardEvent) => void;

    connectedCallback() {
        super.connectedCallback?.();

        // Register keydown listener for slide navigation
        this._boundKeyHandler = this._handleKeyDown.bind(this);
        window.addEventListener("keydown", this._boundKeyHandler);
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();

        // Cleanup keydown listener on disconnect
        window.removeEventListener("keydown", this._boundKeyHandler);
    }

    /**
     * Handles keyboard navigation for the slideshow.
     * ArrowRight advances to the next slide, ArrowLeft goes back.
     * Only possible in preview mode.
     */
    _handleKeyDown(e: KeyboardEvent) {
        if (this.hasAttribute("contenteditable")) return;

        switch (e.key) {
            case "ArrowRight":
                this.handleNextSlideClick(e);
                break;
            case "ArrowLeft":
                this.handleNextSlideClick(e, true);
                break;
        }
    }

    protected firstUpdated(): void {
        this.requestUpdate();
    }

    protected static scopedElements = {
        "sl-button": SlButton,
        "sl-icon-button": SlIconButton,
        "sl-tooltip": SlTooltip,
        "sl-select": SlSelect,
        "sl-option": SlOption,
    };

    /** Index of the currently active slide. */
    @property({ attribute: false, state: true })
    accessor activeSlideIndex = 0;

    /** The active slide element based on the activeSlideIndex. */
    get activeSlide(): WebwriterSlide {
        return this.slides[this.activeSlideIndex];
    }

    private draggingIndex: number | null = null;

    /** Index of the slide currently being dragged over (for drag-and-drop functionality). */
    private lastDraggedOver = -1;

    static styles = slides_styles;

    /** Whether the slideshow is currently displayed in fullscreen mode. */
    protected get isFullscreen() {
        return this.ownerDocument.fullscreenElement === this;
    }

    /** Icon source URL depending on fullscreen state (enter/exit). */
    protected get iconSrc() {
        return this.isFullscreen ? fullscreenExitIcon : fullscreenIcon;
    }

    /**
     * All `webwriter-slide` elements.
     * Represents the individual slides in the slideshow.
     */
    @queryAssignedElements()
    protected accessor slides: WebwriterSlide[];

    /**
     * Defines the type of view for the slideshow.
     * - "slides": Show content as sequential slides.
     * - "tabs": Show content using tabs.
     */
    @property({ type: String, attribute: true, reflect: true })
    public accessor type: "tabs" | "slides" = "slides";

    /** Add a new empty slide element. Optionally insert after given index. */
    addSlide(index?: number) {
        const slide = this.ownerDocument.createElement(
            "webwriter-slide"
        ) as WebwriterSlide;
        const p = this.ownerDocument.createElement("p");
        slide.appendChild(p);

        if (index !== undefined && index >= 0 && index < this.slides.length) {
            const refSlide = this.slides[index];
            refSlide.insertAdjacentElement("afterend", slide);
        } else {
            this.appendChild(slide);
        }

        this.changeSlide(this.slides.indexOf(slide));

        // place cursor at the start of the new slide
        const selection = document.getSelection();
        if (selection) {
            selection.setBaseAndExtent(p, 0, p, 0);
        }
    }

    /** Duplicate an existing slide at given index. */
    duplicateSlide(index: number) {
        const original = this.slides[index];
        if (!original) return;

        const clone = original.cloneNode(true) as WebwriterSlide;
        original.insertAdjacentElement("afterend", clone);

        this.changeSlide(this.slides.indexOf(clone));
    }

    /** Remove the currently active slide element. */
    removeActiveSlide() {
        this.removeSlide(this.activeSlideIndex);
    }

    /** Remove the currently active slide element. */
    removeSlide(slideIndex: number) {
        this.slides[slideIndex].remove();
        if (this.activeSlideIndex > this.slides.length - 1) {
            this.changeSlide(this.slides.length - 1);
        }
        this.requestUpdate();
    }

    /** Activate the next slide element. */
    nextSlide(backwards = false, step = 1) {
        const i = this.activeSlideIndex;
        const n = this.slides?.length - 1;
        this.changeSlide(
            backwards ? Math.max(0, i - step) : Math.min(n, i + step)
        );
    }

    /**
     * Lifecycle method called whenever the component is updated.
     * Updates each slide's `active` property based on the current activeSlideIndex.
     */
    updated(changed: any) {
        super.updated(changed);
        this.slides?.forEach(
            (slide, i) => (slide.active = i === this.activeSlideIndex)
        );
    }

    /** False if slideshow is on the last slide. */
    get hasNextSlide(): boolean {
        return this.activeSlideIndex < this.slides?.length - 1;
    }

    /** False if slideshow is on the first slide. */
    get hasPreviousSlide(): boolean {
        return this.activeSlideIndex > 0;
    }

    /**
     * Handles navigation to the next or previous slide based on user input.
     * - Shift key: jump by the total number of slides.
     * - Ctrl key: jump by 10 slides.
     * - Otherwise: move by one slide.
     *
     * @param e - The triggering mouse or keyboard event.
     * @param backwards - Whether to navigate backward (default is false).
     */
    protected handleNextSlideClick(
        e: MouseEvent | KeyboardEvent,
        backwards = false
    ) {
        if (e.shiftKey) {
            this.nextSlide(backwards, this.slides.length);
        } else if (e.ctrlKey) {
            this.nextSlide(backwards, 10);
        } else {
            this.nextSlide(backwards);
        }
    }

    /**
     * Changes the active slide to the specified index.
     * Waits for rendering to finish, scrolls the active slide into view,
     * and generates a thumbnail preview using snapdom.
     *
     * @param index - The index of the slide to activate.
     */
    protected changeSlide = async (index: number) => {
        this.activeSlideIndex = index;

        const tmpSlideIndex = this.activeSlideIndex;

        // Wait briefly to ensure slide rendering completes
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Scroll the active slide/tab into view smoothly
        const active = this.renderRoot.querySelector(".active");
        if (active) {
            active.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "nearest",
            });
        }

        // Only proceed if slide hasn’t changed in the meantime
        if (this.activeSlideIndex === tmpSlideIndex) {
            const result = await snapdom(this.slides[tmpSlideIndex], {
                width: 240,
                height: 140,
            });
            const img = await result.toPng();
            this.slides[tmpSlideIndex].thumbnail = img.src;
            this.requestUpdate();
        }
    };

    /**
     * Starts dragging a slide element.
     * Adds the 'dragging' CSS class and sets drag data.
     *
     * @param e - The dragstart event.
     * @param index - Index of the slide being dragged.
     */
    private onDragStart(e: DragEvent, index: number) {
        this.draggingIndex = index;
        (e.currentTarget as HTMLElement).classList.add("dragging");
        e.dataTransfer?.setData("text/plain", index.toString());
        e.dataTransfer!.effectAllowed = "move";
    }

    /**
     * Ends dragging a slide.
     * Moves the dragged slide to its new position if it was moved,
     * updates the active slide index, and cleans up drag state.
     *
     * @param e - The dragend event.
     */
    private onDragEnd(e: DragEvent) {
        const draggingIdx = this.draggingIndex;
        if (draggingIdx === null || draggingIdx === this.lastDraggedOver)
            return;

        const draggedSlide = this.slides[draggingIdx];
        const targetSlide = this.slides[this.lastDraggedOver];

        if (draggedSlide && targetSlide && draggedSlide !== targetSlide) {
            if (draggingIdx < this.lastDraggedOver) {
                // Insert dragged slide after the target slide
                targetSlide.insertAdjacentElement("afterend", draggedSlide);
            } else {
                // Insert dragged slide before the target slide
                targetSlide.insertAdjacentElement("beforebegin", draggedSlide);
            }

            this.activeSlideIndex = this.lastDraggedOver;
            this.requestUpdate();
        }

        (e.currentTarget as HTMLElement).classList.remove("dragging");
        this.draggingIndex = null;
        this.lastDraggedOver = -1;
    }

    /**
     * Handles dragging over a slide element.
     * Prevents default to allow dropping and records the slide index being hovered.
     *
     * @param e - The dragover event.
     * @param index - Index of the slide being dragged over.
     */
    private onDragOver(e: DragEvent, index: number) {
        e.preventDefault();
        this.lastDraggedOver = index;
    }

    /**
     * Renders the slideshow component UI including:
     * - Slide navigation controls (next, previous, duplicate, add, remove).
     * - View type selector when contenteditable (tabs or slides).
     * - Tabs view with draggable slide tabs and controls.
     * - Slides view with thumbnails, draggable slides, and controls.
     * - The default slot where slide content is displayed.
     *
     * The controls adapt depending on whether the component is editable.
     */
    render() {
        const slideButtons = (index: number) => html`
            <sl-tooltip
                content=${msg("Remove slide")}
                placement="right"
                style=${this.slides.length > 1 &&
                this.hasAttribute("contenteditable")
                    ? ""
                    : "visibility: hidden"}
            >
                <sl-icon-button
                    class="remove-btn"
                    @click=${(e: MouseEvent) => {
                        e.stopPropagation();
                        this.removeSlide(index);
                    }}
                    src=${IconRemove}
                ></sl-icon-button>
            </sl-tooltip>
        `;

        const controls = html` <div class="controls-section author-only">
                <sl-tooltip
                    content=${msg("Duplicate current slide")}
                    placement="bottom"
                >
                    <sl-icon-button
                        class="duplicate-btn"
                        @click=${(e: MouseEvent) => {
                            e.stopPropagation();
                            this.duplicateSlide(this.activeSlideIndex);
                        }}
                        src=${IconDuplicate}
                    ></sl-icon-button>
                </sl-tooltip>

                <sl-tooltip
                    content=${msg("Add slide after current")}
                    placement="bottom"
                >
                    <sl-icon-button
                        class="add-btn"
                        @click=${(e: MouseEvent) => {
                            e.stopPropagation();
                            this.addSlide(this.activeSlideIndex);
                        }}
                        src=${IconAdd}
                    ></sl-icon-button>
                </sl-tooltip>
            </div>
            <div class="controls-section">
                <sl-tooltip
                    content=${msg("Go to previous slide")}
                    placement="bottom"
                >
                    <sl-icon-button
                        @click=${(e: MouseEvent) =>
                            this.handleNextSlideClick(e, true)}
                        src=${chevronLeftIcon}
                        ?disabled=${!this.hasPreviousSlide}
                    ></sl-icon-button>
                </sl-tooltip>
                <div class="slides-index">
                    <span>${this.activeSlideIndex + 1}</span> /
                    <span>${this.slides?.length}</span>
                </div>
                <sl-tooltip
                    content=${msg("Go to next slide")}
                    placement="bottom"
                >
                    <sl-icon-button
                        @click=${(e: MouseEvent) =>
                            this.handleNextSlideClick(e)}
                        src=${chevronRightIcon}
                        ?disabled=${!this.hasNextSlide}
                    ></sl-icon-button>
                </sl-tooltip>
            </div>
            <div class="controls-section">
                <sl-tooltip
                    content=${this.isFullscreen
                        ? msg("Exit fullscreen")
                        : msg("Show in fullscreen")}
                    placement="bottom"
                >
                    <sl-icon-button
                        id="fullscreen"
                        class="fullscreen-btn"
                        src=${this.iconSrc}
                        @click=${() => {
                            !this.isFullscreen
                                ? this.requestFullscreen()
                                : this.ownerDocument.exitFullscreen();
                            this.requestUpdate();
                        }}
                    ></sl-icon-button>
                </sl-tooltip>
            </div>`;

        return html`
            ${this.hasAttribute("contenteditable")
                ? html`<aside class="settings" part="options">
                      <sl-select
                          label=${msg("View")}
                          .value=${this.type}
                          @sl-change=${(e: SlChangeEvent) => {
                              this.type = (e.target as SlSelect).value as any;
                              this.requestUpdate();
                          }}
                          name="view"
                      >
                          <sl-option value="tabs">${msg("Tabs")}</sl-option>
                          <sl-option value="slides">${msg("Slides")}</sl-option>
                      </sl-select>
                  </aside>`
                : html``}
            ${this.type == "tabs"
                ? html`<aside part="tabs">
                      <div class="slide-tabs-wrapper">
                          <div class="slide-tabs">
                              ${this.slides.map(
                                  (slide, index) => html`
                                      <div
                                          class="slide-tab ${index ===
                                          this.activeSlideIndex
                                              ? "active"
                                              : ""}"
                                          @click=${() => {
                                              this.changeSlide(index);
                                          }}
                                          draggable="${this.hasAttribute(
                                              "contenteditable"
                                          )
                                              ? "true"
                                              : "false"}"
                                          @dragstart=${(e: DragEvent) =>
                                              this.onDragStart(e, index)}
                                          @dragend=${this.onDragEnd}
                                          @dragover=${(e: DragEvent) =>
                                              this.onDragOver(e, index)}
                                      >
                                          <div class="slide-number">
                                              ${index + 1}
                                          </div>

                                          ${slideButtons(index)}
                                      </div>
                                  `
                              )}
                          </div>
                      </div>
                      <div class="controls-rows">${controls}</div>
                  </aside>`
                : html``}
            <slot></slot>
            ${this.type == "slides"
                ? html`<aside part="actions">
                      <div class="slide-thumbs">
                          ${this.slides.map(
                              (slide, index) => html`
                                  <div
                                      class="slide-thumb ${index ===
                                      this.activeSlideIndex
                                          ? "active"
                                          : ""}"
                                      @click=${() => {
                                          this.changeSlide(index);
                                      }}
                                      draggable="${this.hasAttribute(
                                          "contenteditable"
                                      )
                                          ? "true"
                                          : "false"}"
                                      @dragstart=${(e: DragEvent) =>
                                          this.onDragStart(e, index)}
                                      @dragend=${this.onDragEnd}
                                      @dragover=${(e: DragEvent) =>
                                          this.onDragOver(e, index)}
                                  >
                                      ${slide.thumbnail
                                          ? html`<img
                                                class="slide-thumb-img"
                                                draggable="false"
                                                src=${slide.thumbnail}
                                            />`
                                          : html`<div
                                                class="slide-thumb-img"
                                            ></div>`}

                                      <div class="slide-options">
                                          <div class="slide-number-flying">
                                              ${index + 1}
                                          </div>

                                          ${slideButtons(index)}
                                      </div>
                                  </div>
                              `
                          )}
                      </div>
                      <div class="controls-columns">${controls}</div>
                  </aside>`
                : html``}
        `;
    }
}
