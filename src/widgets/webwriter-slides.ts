/** config */
import {html, css, PropertyValueMap} from "lit"
import {LitElementWw} from "@webwriter/lit"
import {customElement, property, queryAll, queryAssignedElements} from "lit/decorators.js"
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
    "sl-icon-button": SlIconButton
  }

  /** Index of the active slide. */
  @property({attribute: false, state: true})
  accessor activeSlideIndex = 0

  /** Active slide element. */
  get activeSlide(): WebwriterSlide {
    return this.slides[this.activeSlideIndex]
  }

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
      position: absolute;
      right: 8px;
      bottom: 8px;
      display: flex;
      flex-direction: row;
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
  `

  protected get isFullscreen() {
    return this.ownerDocument.fullscreenElement === this
  }

  protected get iconSrc() {
    return this.isFullscreen? fullscreenExitIcon: fullscreenIcon
  }

  @queryAssignedElements()
  protected accessor slides: WebwriterSlide[]

  /** Add a new empty slide element. */
  addSlide() {
    const slide = this.ownerDocument.createElement("webwriter-slide") as WebwriterSlide
    const p = this.ownerDocument.createElement("p")
    slide.appendChild(p)
    this.appendChild(slide)
    this.activeSlideIndex = this.slides.indexOf(slide)
    document.getSelection().setBaseAndExtent(p, 0, p, 0)
  }

  /** Remove the currently active slide element. */
  removeSlide() {
    this.slides[this.activeSlideIndex].remove()
    this.nextSlide()
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

  render() {
    return html`
      <slot></slot>
      <aside part="options">
      </aside>
      <aside part="actions">
        <sl-icon-button class="author-only" ?disabled=${this.slides.length <= 1} @click=${() => this.removeSlide()} src=${minusSquareIcon} title=${msg("Remove slide")}></sl-icon-button>
        <sl-icon-button class="author-only" @click=${() => this.addSlide()} src=${plusSquareIcon} title=${msg("Add slide")}></sl-icon-button>
        <sl-icon-button @click=${(e: MouseEvent) => this.handleNextSlideClick(e, true)} src=${chevronLeftIcon} ?disabled=${!this.hasPreviousSlide} title=${msg("Go to previous slide")}></sl-icon-button>
        <div class="slides-index">
          <span>${this.activeSlideIndex + 1}</span> / <span>${this.slides?.length}</span>
        </div>
        <sl-icon-button @click=${(e: MouseEvent) => this.handleNextSlideClick(e)} src=${chevronRightIcon}  ?disabled=${!this.hasNextSlide} title=${msg("Go to next slide")}></sl-icon-button>
        <sl-icon-button id="fullscreen" src=${this.iconSrc} @click=${() => !this.isFullscreen? this.requestFullscreen(): this.ownerDocument.exitFullscreen()} title=${msg("Show in fullscreen")}></sl-icon-button>
      </aside>
    `
  }


}