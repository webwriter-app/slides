/** Module imports */
import { html, css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";

import "@shoelace-style/shoelace/dist/themes/light.css";
import "../components/page-media.css";

/**
 * Represents a single page in the `webwriter-pages` widget.
 * Single-media pages remove padding and fit media without stretching or cropping.
 *
 * @slot default - The content displayed within the page.
 */
@customElement("webwriter-page")
export class WebwriterPage extends LitElementWw {
    /** Indicates whether the page is currently active/visible. */
    @property({ type: Boolean, attribute: true, reflect: true })
    accessor active = false;

    /** Plaintext tab label. An empty label shows the page-number placeholder. */
    @property({ type: String, reflect: true, useDefault: true })
    accessor label = "";

    /**
     * Data URI string for the page thumbnail (e.g., "data:image/png;base64,...").
     * Used to display a preview image for the page.
     */
    @property({ type: String, attribute: true, reflect: true })
    accessor thumbnail = "";

    static styles = css`
        :host {
            --ww-widget-max: none;
            height: 100%;
            width: 100%;
            padding: var(--sl-spacing-small);
            box-sizing: border-box;
            display: block;
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            border: var(--sl-panel-border-width) solid var(--sl-panel-border-color) !important;
            border-radius: var(--sl-border-radius-medium);
        }
    `;

    render(): unknown {
        return html`<slot></slot>`;
    }
}
