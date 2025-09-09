/** Module imports */
import { html, css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";

import "@shoelace-style/shoelace/dist/themes/light.css";
import { snapdom } from "@zumer/snapdom";

/**
 * Represents a single slide in the `webwriter-slides` widget.
 *
 * @slot default - The content displayed within the slide.
 */
@customElement("webwriter-slide")
export class WebwriterSlide extends LitElementWw {
    /** Indicates whether the slide is currently active/visible. */
    @property({ type: Boolean, attribute: true, reflect: true })
    accessor active = false;

    /**
     * Data URI string for the slide thumbnail (e.g., "data:image/png;base64,...").
     * Used to display a preview image for the slide.
     */
    @property({ type: String, attribute: true, reflect: true })
    accessor thumbnail = "";

    static styles = css`
        :host {
            height: 100%;
            width: 100%;
            padding: 10px;
            box-sizing: border-box;
            display: block;
            overflow-y: auto;
            overflow-x: hidden;
            border: 2px solid #007bff !important;
            border-radius: 5px;
        }
    `;

    render(): unknown {
        return html`<slot></slot>`;
    }
}
