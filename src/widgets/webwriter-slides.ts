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
import { SlTooltip } from "@shoelace-style/shoelace"

import { snapdom } from '@zumer/snapdom';

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
        this.activeSlideIndex = selectedSlideIndex
        this.requestUpdate()
      }
    }, {passive: true})
  }

  protected firstUpdated(): void {
    this.requestUpdate()
  }

  protected static scopedElements = {
    "sl-button": SlButton,
    "sl-icon-button": SlIconButton,
    "sl-tooltip": SlTooltip
  }

  /** Index of the active slide. */
  @property({attribute: false, state: true})
  accessor activeSlideIndex = 0

  /** Active slide element. */
  get activeSlide(): WebwriterSlide {
    return this.slides[this.activeSlideIndex]
  }
  
  private draggingIndex: number | null = null;

  static styles = css`
    :host {
      position: relative;
      background: white;
      display: block;
    }

    :host(:not(:fullscreen)) {
      border: 1px solid darkgray;
      aspect-ratio: 16/9;
      width: 100%;
    }

    :host(:not([contenteditable=true]):not([contenteditable=""])) .author-only {
      display: none;
    }

    [part=actions] {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      gap: 4px;
    }

    .slides-index {
      user-select: none;
      font-size: 1rem;
      color: var(--sl-color-gray-800);
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.5ch;
    }

    :host(:fullscreen) [part=actions] sl-icon-button {
      color: black;
    }
    
    ::slotted(webwriter-slide:not([active])) {
      display: none !important;
    }

    slot:not([name]) {
      display: block;
      width: 100%;
      height: 100%;
      
      &::slotted {
        width: 100%;
        height: 100%;
      }
    }

    .controls {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 4px;
    }

    .slide-thumbs {
      display: flex;
      flex-direction: row;
      gap: 4px;
      padding: 10px;
      overflow-x: scroll;
    }

    .slide-thumb {
      width: 120px;
      height: 100px;
      border: 2px solid #ccc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 2px;
      cursor: pointer;
      background: #f9f9f9;
      border-radius: 4px;
      flex: 0 0 auto;
    }

    .slide-thumb.dragging {
      opacity: 0.5;
    }

    .slide-thumb.active {
      border-color: #007bff;
      background: #e7f1ff; 
    }

    .slide-thumb span {
      font-size: 14px;
      font-weight: bold;
    }

    .slide-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: none;
      border-radius: 5px;
    }


    .remove-btn,
    .add-btn,
    .duplicate-btn,
    .slide-number {
      cursor: pointer;
      color: white;
      font-size: 0.9rem;
      color: var(--sl-color-gray-800);
    }

    .slide-tabs {
      display: flex;
      gap: 5px;
      padding: 5px 5px 0px 5px;
    }

    .slide-tab {
      background-color: #fff;
      display: flex;
      border-radius: 10px 10px 0px 0px;
      padding: 0px 10px;
      align-items: center;
      border: 1px solid #ccc;
    }

    .slide-tab.active {
      border-color: #007bff;
      background: #e7f1ff; 
    }

    .slide-number {
      margin-right: 20px;
    }

  `

  protected get isFullscreen() {
    return this.ownerDocument.fullscreenElement === this
  }

  protected get iconSrc() {
    return this.isFullscreen? fullscreenExitIcon: fullscreenIcon
  }

  @queryAssignedElements()
  protected accessor slides: WebwriterSlide[]

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

  this.activeSlideIndex = this.slides.indexOf(slide)

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

  this.activeSlideIndex = this.slides.indexOf(clone)
}


  /** Remove the currently active slide element. */
  removeActiveSlide() {
    this.removeSlide(this.activeSlideIndex)
  }

  /** Remove the currently active slide element. */
  removeSlide(slideIndex: number) {
    this.slides[slideIndex].remove()
    if(this.activeSlideIndex > this.slides.length-1) {
      this.activeSlideIndex = this.slides.length-1
    }
  }

  /** Activate the next slide element. */
  nextSlide(backwards=false, step=1) {
    const i = this.activeSlideIndex
    const n = this.slides?.length - 1
    this.activeSlideIndex = backwards
      ? Math.max(0, i - step)
      : Math.min(n, i + step)
  }

  updated(changed: any) {
    super.updated(changed)
    this.slides?.forEach((slide, i) => slide.active = i === this.activeSlideIndex)

    const updateThumb = async () => {
      const result = await snapdom(this.slides[this.activeSlideIndex], { width: 120, height: 70 });
      const img = await result.toPng();
      this.slides[this.activeSlideIndex].thumbnail = img.src
    }

    updateThumb();
    this.updateComplete
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

  private onDragStart(e: DragEvent, index: number) {
    this.draggingIndex = index;
    (e.currentTarget as HTMLElement).classList.add('dragging');
    e.dataTransfer?.setData('text/plain', index.toString());
    e.dataTransfer!.effectAllowed = 'move';
  }

  private onDragEnd(e: DragEvent) {
    (e.currentTarget as HTMLElement).classList.remove('dragging');
    this.draggingIndex = null;
  }

  private onDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    const draggingIdx = this.draggingIndex;
    if (draggingIdx === null || draggingIdx === index) return;
  
    const draggedSlide = this.slides[draggingIdx];
    const targetSlide = this.slides[index];


    console.log(draggingIdx + " to " + index)
  
    if (draggedSlide && targetSlide && draggedSlide !== targetSlide) {
      if (draggingIdx < index) {
        // Move draggedSlide after targetSlide
        targetSlide.insertAdjacentElement('afterend', draggedSlide);
      } else {
        // Move draggedSlide before targetSlide
        targetSlide.insertAdjacentElement('beforebegin', draggedSlide);
      }
  
      this.requestUpdate();
    }
  }
  
  // draggable="true"
  // @dragstart=${(e: DragEvent) => this.onDragStart(e, index)}
  // @dragend=${this.onDragEnd}
  // @dragover=${(e: DragEvent) => this.onDragOver(e, index)}

  render() {
    return html`
      <aside part="tabs">
        <div class="slide-tabs">
          ${this.slides.map(
            (slide, index) => html`
              <div
                class="slide-tab ${index === this.activeSlideIndex ? 'active' : ''}"
                @click=${() => {this.activeSlideIndex = index}}
              >
                <div class="slide-number">${index+1}</div>

                <sl-tooltip content="Add slide after this">
                  <sl-icon-button class="add-btn"
                    @click=${(e: MouseEvent) => {
                      e.stopPropagation();
                      this.addSlide(index);
                    }}
                    src=${IconAdd}></sl-icon-button>
                </sl-tooltip>

                <sl-tooltip content="Duplicate slide">
                  <sl-icon-button class="duplicate-btn"
                    @click=${(e: MouseEvent) => {
                      e.stopPropagation();
                      this.duplicateSlide(index);
                    }}
                    src=${IconDuplicate}></sl-icon-button>
                </sl-tooltip>

                <sl-tooltip content="Remove slide">
                    <sl-icon-button class="remove-btn"
                      @click=${(e: MouseEvent) => {
                        e.stopPropagation();
                        this.removeSlide(index);
                      }}
                      src=${IconRemove}></sl-icon-button>
                </sl-tooltip>

              </div>
            `
          )}
        </div>
        <div class="controls">
          <sl-icon-button class="author-only" ?disabled=${this.slides.length <= 1} @click=${() => this.removeActiveSlide()} src=${minusSquareIcon} title=${msg("Remove slide")}></sl-icon-button>
          <sl-icon-button class="author-only" @click=${() => this.addSlide()} src=${plusSquareIcon} title=${msg("Add slide")}></sl-icon-button>
          <sl-icon-button @click=${(e: MouseEvent) => this.handleNextSlideClick(e, true)} src=${chevronLeftIcon} ?disabled=${!this.hasPreviousSlide} title=${msg("Go to previous slide")}></sl-icon-button>
          <div class="slides-index">
            <span>${this.activeSlideIndex + 1}</span> / <span>${this.slides?.length}</span>
          </div>
          <sl-icon-button @click=${(e: MouseEvent) => this.handleNextSlideClick(e)} src=${chevronRightIcon}  ?disabled=${!this.hasNextSlide} title=${msg("Go to next slide")}></sl-icon-button>
          <sl-icon-button id="fullscreen" src=${this.iconSrc} @click=${() => !this.isFullscreen? this.requestFullscreen(): this.ownerDocument.exitFullscreen()} title=${msg("Show in fullscreen")}></sl-icon-button>
        </div>
      </aside>
      <slot></slot>
      <aside part="options">
      </aside>
      <aside part="actions">
        <div class="slide-thumbs">
          ${this.slides.map(
            (slide, index) => html`
              <div
                class="slide-thumb ${index === this.activeSlideIndex ? 'active' : ''}"
                @click=${() => {this.activeSlideIndex = index}}
              >
                ${slide.thumbnail ? html`<img class="slide-thumb-img" src=${slide.thumbnail} />` :  html`<div class="slide-thumb-img"></div>`}

                <div class="slide-options">

                  <sl-tooltip content="Add slide after this">
                    <sl-icon-button class="add-btn"
                      @click=${(e: MouseEvent) => {
                        e.stopPropagation();
                        this.addSlide(index);
                      }}
                      src=${IconAdd}></sl-icon-button>
                  </sl-tooltip>

                  <sl-tooltip content="Duplicate slide">
                    <sl-icon-button class="duplicate-btn"
                      @click=${(e: MouseEvent) => {
                        e.stopPropagation();
                        this.duplicateSlide(index);
                      }}
                      src=${IconDuplicate}></sl-icon-button>
                  </sl-tooltip>

                  <sl-tooltip content="Remove slide">
                      <sl-icon-button class="remove-btn"
                        @click=${(e: MouseEvent) => {
                          e.stopPropagation();
                          this.removeSlide(index);
                        }}
                        src=${IconRemove}></sl-icon-button>
                  </sl-tooltip>
                </div>


              </div>
            `
          )}
        </div>
        <div class="controls">
          <sl-icon-button class="author-only" ?disabled=${this.slides.length <= 1} @click=${() => this.removeActiveSlide()} src=${minusSquareIcon} title=${msg("Remove slide")}></sl-icon-button>
          <sl-icon-button class="author-only" @click=${() => this.addSlide()} src=${plusSquareIcon} title=${msg("Add slide")}></sl-icon-button>
          <sl-icon-button @click=${(e: MouseEvent) => this.handleNextSlideClick(e, true)} src=${chevronLeftIcon} ?disabled=${!this.hasPreviousSlide} title=${msg("Go to previous slide")}></sl-icon-button>
          <div class="slides-index">
            <span>${this.activeSlideIndex + 1}</span> / <span>${this.slides?.length}</span>
          </div>
          <sl-icon-button @click=${(e: MouseEvent) => this.handleNextSlideClick(e)} src=${chevronRightIcon}  ?disabled=${!this.hasNextSlide} title=${msg("Go to next slide")}></sl-icon-button>
          <sl-icon-button id="fullscreen" src=${this.iconSrc} @click=${() => !this.isFullscreen? this.requestFullscreen(): this.ownerDocument.exitFullscreen()} title=${msg("Show in fullscreen")}></sl-icon-button>
        </div>
      </aside>
    `
  }


}