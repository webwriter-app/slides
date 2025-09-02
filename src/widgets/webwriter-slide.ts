/** config */
import {html, css} from "lit"
import {LitElementWw} from "@webwriter/lit"
import {customElement, property} from "lit/decorators.js"

import "@shoelace-style/shoelace/dist/themes/light.css"

/** Single slide for the `webwriter-slides` widget.
* @slot - Content of the slide
*/
@customElement("webwriter-slide")
export class WebwriterSlide extends LitElementWw {

  /** Whether the slide is selected/shown. */
  @property({type: Boolean, attribute: true, reflect: true})
  accessor active = false

  @property({type: String, attribute: true, reflect: true})
  accessor thumbnail = ""

  static styles = css`
    :host {
      height: 100%;
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
      display: block;
      overflow: auto;
    }
  `

  render() {
    return html`<slot></slot>`
  }


}