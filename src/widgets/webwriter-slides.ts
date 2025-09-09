/** config */
import {html, css, PropertyValueMap, PropertyValues} from "lit"
import {LitElementWw} from "@webwriter/lit"
import {customElement, property, queryAll, queryAssignedElements, state} from "lit/decorators.js"
import {msg} from "@lit/localize"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js"
import LOCALIZE from "../../localization/generated"

import "@shoelace-style/shoelace/dist/themes/light.css"

import fullscreenIcon from "bootstrap-icons/icons/fullscreen.svg"
import fullscreenExitIcon from "bootstrap-icons/icons/fullscreen-exit.svg"
import plusSquareIcon from "bootstrap-icons/icons/plus-square.svg"
import minusSquareIcon from "bootstrap-icons/icons/dash-square.svg"
import chevronLeftIcon from "bootstrap-icons/icons/chevron-left.svg"
import chevronRightIcon from "bootstrap-icons/icons/chevron-right.svg"
import { WebwriterSlide } from "./webwriter-slide"

import IconRemove from 'bootstrap-icons/icons/x-circle.svg';
import IconAdd from 'bootstrap-icons/icons/plus-circle.svg';
import IconDuplicate from 'bootstrap-icons/icons/copy.svg';
import { SlChangeEvent, SlOption, SlSelect, SlTooltip } from "@shoelace-style/shoelace"

import { snapdom } from '@zumer/snapdom';
import { slides_styles } from "../styles/styles"

/** Slideshow container for sequential display of content.
* @slot - Content of the slideshow (should be slides only)
*/
@customElement("webwriter-slides")
export class WebwriterSlides extends LitElementWw {

  protected localize = LOCALIZE
  
  constructor() {
    super()
    this.addEventListener("fullscreenchange", () => this.requestUpdate())
    document.addEventListener("selectionchange", e => {
      const selectedSlideIndex = this.slides?.findIndex(slide => document.getSelection().containsNode(slide, true))
      if(selectedSlideIndex !== -1) {
        this.changeSlide(selectedSlideIndex)
        this.requestUpdate()
      }
    }, {passive: true})
  }

  private _boundKeyHandler!: (e: KeyboardEvent) => void;

  connectedCallback() {
    super.connectedCallback?.();
  
    // Keydown-Listener hinzufügen
    this._boundKeyHandler = this._handleKeyDown.bind(this);
    window.addEventListener('keydown', this._boundKeyHandler);
  }
  
  disconnectedCallback() {
    super.disconnectedCallback?.();
    window.removeEventListener('keydown', this._boundKeyHandler);
  }

  _handleKeyDown(e) {
    if (this.hasAttribute('contenteditable')) return;
  
    switch (e.key) {
      case 'ArrowRight':
        this.handleNextSlideClick(e);
        break;
      case 'ArrowLeft':
        this.handleNextSlideClick(e, true);
        break;
    }
  }
  
  

  protected firstUpdated(): void {
    this.requestUpdate()
  }

  protected static scopedElements = {
    "sl-button": SlButton,
    "sl-icon-button": SlIconButton,
    "sl-tooltip": SlTooltip,
    'sl-select': SlSelect,
    'sl-option': SlOption
  }

  /** Index of the active slide. */
  @property({attribute: false, state: true})
  accessor activeSlideIndex = 0

  /** Active slide element. */
  get activeSlide(): WebwriterSlide {
    return this.slides[this.activeSlideIndex]
  }
  
  private draggingIndex: number | null = null;

  // Index of slide the currently dragged slide was dragged over
  private lastDraggedOver = -1

  static styles = slides_styles

  protected get isFullscreen() {
    return this.ownerDocument.fullscreenElement === this
  }

  protected get iconSrc() {
    return this.isFullscreen? fullscreenExitIcon: fullscreenIcon
  }

  @queryAssignedElements()
  protected accessor slides: WebwriterSlide[]


  /**
  * View of the slides
  */
  @property({ type: String, attribute: true, reflect: true })
  public accessor type: 'tabs' | 'slides' = 'slides';

 /** Add a new empty slide element. Optionally insert after given index. */
addSlide(index?: number) {
  const slide = this.ownerDocument.createElement("webwriter-slide") as WebwriterSlide
  const p = this.ownerDocument.createElement("p")
  slide.appendChild(p)

  if (index !== undefined && index >= 0 && index < this.slides.length) {
    const refSlide = this.slides[index]
    refSlide.insertAdjacentElement("afterend", slide)
  } else {
    this.appendChild(slide)
  }

  this.changeSlide(this.slides.indexOf(slide))

  // place cursor at the start of the new slide
  const selection = document.getSelection()
  if (selection) {
    selection.setBaseAndExtent(p, 0, p, 0)
  }
}

/** Duplicate an existing slide at given index. */
duplicateSlide(index: number) {
  const original = this.slides[index]
  if (!original) return

  const clone = original.cloneNode(true) as WebwriterSlide
  original.insertAdjacentElement("afterend", clone)

  this.changeSlide(this.slides.indexOf(clone))
}


  /** Remove the currently active slide element. */
  removeActiveSlide() {
    this.removeSlide(this.activeSlideIndex)
  }

  /** Remove the currently active slide element. */
  removeSlide(slideIndex: number) {
    this.slides[slideIndex].remove()
    if(this.activeSlideIndex > this.slides.length-1) {
      this.changeSlide(this.slides.length-1)
    }
    this.requestUpdate();
  }

  /** Activate the next slide element. */
  nextSlide(backwards=false, step=1) {
    const i = this.activeSlideIndex
    const n = this.slides?.length - 1
    this.changeSlide(backwards
      ? Math.max(0, i - step)
      : Math.min(n, i + step))
  }

  updated(changed: any) {
    super.updated(changed)
    this.slides?.forEach((slide, i) => slide.active = i === this.activeSlideIndex)
  }

  /** False if slideshow is on the last slide. */
  get hasNextSlide(): boolean {
    return this.activeSlideIndex < this.slides?.length - 1
  }

  /** False if slideshow is on the first slide. */
  get hasPreviousSlide(): boolean {
    return this.activeSlideIndex > 0
  }

  protected handleNextSlideClick(e: MouseEvent, backwards=false) {
    if(e.shiftKey) {
      this.nextSlide(backwards, this.slides.length)
    }
    else if(e.ctrlKey) {
      this.nextSlide(backwards, 10)
    }
    else {
      this.nextSlide(backwards)
    }
  }

  protected changeSlide = async (index: number) => {
    this.activeSlideIndex = index

    const tmpSlideIndex = this.activeSlideIndex
    // Wait until rendering of slide is finished (approximately latest)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Scroll slide tab or thumbnail into view
    const active = this.renderRoot.querySelector('.active');
    if (active) {
      active.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }

    // Check if user changed slide in the meantime
    if(this.activeSlideIndex == tmpSlideIndex) {
      const result = await snapdom(this.slides[tmpSlideIndex], { width: 240, height: 140 });
      const img = await result.toPng();
      this.slides[tmpSlideIndex].thumbnail = img.src
      this.requestUpdate()
    }
  }

  private onDragStart(e: DragEvent, index: number) {
    this.draggingIndex = index;
    (e.currentTarget as HTMLElement).classList.add('dragging');
    e.dataTransfer?.setData('text/plain', index.toString());
    e.dataTransfer!.effectAllowed = 'move';
  }

  private onDragEnd(e: DragEvent) {
    const draggingIdx = this.draggingIndex;
    if (draggingIdx === null || draggingIdx === this.lastDraggedOver) return;
  
    const draggedSlide = this.slides[draggingIdx];
    const targetSlide = this.slides[this.lastDraggedOver];
  
    if (draggedSlide && targetSlide && draggedSlide !== targetSlide) {
      if (draggingIdx < this.lastDraggedOver) {
        // Move draggedSlide after targetSlide
        targetSlide.insertAdjacentElement('afterend', draggedSlide);
      } else {
        // Move draggedSlide before targetSlide
        targetSlide.insertAdjacentElement('beforebegin', draggedSlide);
      }
  
      this.activeSlideIndex = this.lastDraggedOver;
      this.requestUpdate();
    }

    (e.currentTarget as HTMLElement).classList.remove('dragging');
    this.draggingIndex = null;
    this.lastDraggedOver = -1;
  }

  private onDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    this.lastDraggedOver = index
  }

  render() {

    const slideButtons = (index: number) => html`
    <div class="author-only">
      <sl-tooltip content="Add slide after this" placement="right">
        <sl-icon-button class="add-btn"
          @click=${(e: MouseEvent) => {
            e.stopPropagation();
            this.addSlide(index);
          }}
          src=${IconAdd}></sl-icon-button>
      </sl-tooltip>

      <sl-tooltip content="Duplicate slide" placement="right">
        <sl-icon-button class="duplicate-btn"
          @click=${(e: MouseEvent) => {
            e.stopPropagation();
            this.duplicateSlide(index);
          }}
          src=${IconDuplicate}></sl-icon-button>
      </sl-tooltip>

      <sl-tooltip content="Remove slide" placement="right">
          <sl-icon-button class="remove-btn"
            @click=${(e: MouseEvent) => {
              e.stopPropagation();
              this.removeSlide(index);
            }}
            src=${IconRemove}></sl-icon-button>
      </sl-tooltip>
    </div>`

    const controls = html`
        <div class="controls-section">
          <sl-icon-button class="author-only" ?disabled=${this.slides.length <= 1} @click=${() => this.removeActiveSlide()} src=${minusSquareIcon} title=${msg("Remove slide")}></sl-icon-button>
          <sl-icon-button class="author-only" @click=${() => this.addSlide()} src=${plusSquareIcon} title=${msg("Add slide")}></sl-icon-button>
        </div>
        <div class="controls-section">
          <sl-icon-button @click=${(e: MouseEvent) => this.handleNextSlideClick(e, true)} src=${chevronLeftIcon} ?disabled=${!this.hasPreviousSlide} title=${msg("Go to previous slide")}></sl-icon-button>
          <div class="slides-index">
            <span>${this.activeSlideIndex + 1}</span> / <span>${this.slides?.length}</span>
          </div>
          <sl-icon-button @click=${(e: MouseEvent) => this.handleNextSlideClick(e)} src=${chevronRightIcon}  ?disabled=${!this.hasNextSlide} title=${msg("Go to next slide")}></sl-icon-button>
        </div>
        <div class="controls-section">
          <sl-icon-button id="fullscreen" src=${this.iconSrc} @click=${() => {(!this.isFullscreen ? this.requestFullscreen(): this.ownerDocument.exitFullscreen()); this.requestUpdate();}} title=${msg("Show in fullscreen")}></sl-icon-button>
        </div>`
    
    return html`
      ${this.hasAttribute("contenteditable") ? html`<aside class="settings" part="options">
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
            </aside>` : html``}
      ${this.type == "tabs" ? html`<aside part="tabs">
        <div class="slide-tabs-wrapper">
          <div class="slide-tabs">
            ${this.slides.map(
              (slide, index) => html`
                <div
                  class="slide-tab ${index === this.activeSlideIndex ? 'active' : ''}"
                  @click=${() => {this.changeSlide(index)}}
                  draggable="${this.hasAttribute("contenteditable") ? "true" : "false"}"
                  @dragstart=${(e: DragEvent) => this.onDragStart(e, index)}
                  @dragend=${this.onDragEnd}
                  @dragover=${(e: DragEvent) => this.onDragOver(e, index)}
                >
                  <div class="slide-number">${index+1}</div>

                  ${slideButtons(index)}
                </div>
              `
            )}
          </div>
        </div>
        <div class="controls-rows">
          ${controls}
        </div>
      </aside>` : html``}
      <slot></slot>
      ${this.type == "slides" ? html`<aside part="actions">
        <div class="slide-thumbs">
          ${this.slides.map(
            (slide, index) => html`
              <div
                class="slide-thumb ${index === this.activeSlideIndex ? 'active' : ''}"
                @click=${() => {this.changeSlide(index)}}
                draggable="${this.hasAttribute("contenteditable") ? "true" : "false"}"
                @dragstart=${(e: DragEvent) => this.onDragStart(e, index)}
                @dragend=${this.onDragEnd}
                @dragover=${(e: DragEvent) => this.onDragOver(e, index)}
              >
                ${slide.thumbnail ? html`<img class="slide-thumb-img" draggable="false" src=${slide.thumbnail} />` :  html`<div class="slide-thumb-img"></div>`}

                <div class="slide-options">
                  <div class="slide-number-flying">${index+1}</div>

                  ${slideButtons(index)}
                </div>
              </div>
            `
          )}
        </div>
        <div class="controls-columns">
          ${controls}
        </div>
      </aside>` : html``}
    `
  }


}