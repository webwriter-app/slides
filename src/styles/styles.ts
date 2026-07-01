import { css } from "lit";

/**
 * Styles for the slides overview.
 */
export const slides_styles = css`
    :host {
        position: relative;
        background: var(--sl-panel-background-color);
        display: block;
        box-sizing: border-box;
        padding: var(--sl-spacing-x-small);
    }

    :host(:not(:fullscreen):not(.ww-fullscreen)) {
        border: var(--sl-panel-border-width) solid var(--sl-color-neutral-300);
        border-radius: var(--sl-border-radius-large);
        aspect-ratio: 16/9;
        width: 100%;
    }

    :host(:fullscreen),
    :host(.ww-fullscreen) {
        display: flex !important;
        flex-direction: column;
    }

    :host(:fullscreen) slot:not([name]),
    :host(.ww-fullscreen) slot:not([name]) {
        flex: 1 1 auto;
        min-height: 0;
        height: auto;
    }

    :host(:not([contenteditable="true"]):not([contenteditable=""]))
        .author-only {
        display: none;
    }

    [part="actions"], [part="tabs"] {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .slides-index {
        user-select: none;
        font-size: var(--sl-font-size-medium);
        color: var(--sl-color-neutral-800);
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5ch;
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

    .controls-columns, .controls-rows {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--sl-spacing-x-small);
        border-radius: var(--sl-border-radius-medium);
        border: var(--sl-panel-border-width) solid var(--sl-panel-border-color);
        background-color: var(--sl-color-neutral-50);
    }

    .controls-columns {
        flex-direction: column;
        height: 108px;
        box-sizing: border-box;
        margin-top: var(--sl-spacing-x-small);
    }

    .controls-rows {
        flex-direction: row;
        margin: var(--sl-spacing-2x-small) var(--sl-spacing-x-small) 0 0;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom: none;
    }

    .controls-section {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--sl-spacing-2x-small);
    }

    .slide-thumbs {
        display: flex;
        flex-direction: row;
        gap: var(--sl-spacing-x-small);
        padding: var(--sl-spacing-x-small);
        overflow-x: scroll;
        margin-left: calc(var(--sl-spacing-x-small) * -1);
    }

    .slide-thumb {
        width: 120px;
        height: 108px;
        box-sizing: border-box;
        border: var(--sl-panel-border-width) solid var(--sl-panel-border-color);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        border-radius: var(--sl-border-radius-medium);
        flex: 0 0 auto;
        overflow: hidden;
    }

    .slide-thumb.dragging, .slide-tab.dragging {
        opacity: 0.5;
    }

    .slide-thumb.active {
        border-color: var(--sl-color-primary-600);
        background: var(--sl-color-primary-50);
    }

    .slide-thumb-img {
        width: 100%;
        flex: 1;
        object-fit: cover;
        border-bottom: var(--sl-panel-border-width) solid var(--sl-panel-border-color);
    }

    .remove-btn,
    .add-btn,
    .duplicate-btn,
    .slide-number,
    .fullscreen-btn {
        cursor: pointer;
        color: var(--sl-color-neutral-800);
        font-size: var(--sl-font-size-small);
    }

    .slide-tabs-wrapper {
        overflow-y: hidden;
        overflow-x: auto;
    }

    .slide-tabs {
        display: flex;
        gap: var(--sl-spacing-2x-small);
        padding: var(--sl-spacing-2x-small);
        padding-bottom: 0;
        cursor: pointer;
    }

    .slide-tabs-wrapper, .slide-tabs {
        transform:rotateX(180deg);
        -moz-transform:rotateX(180deg); /* Mozilla */
        -webkit-transform:rotateX(180deg); /* Safari and Chrome */
        -ms-transform:rotateX(180deg); /* IE 9+ */
        -o-transform:rotateX(180deg); /* Opera */
    }

    .slide-tab {
        background-color: var(--sl-color-neutral-0);
        display: flex;
        width: 100px;
        height: 32px;
        border-radius: var(--sl-border-radius-large) var(--sl-border-radius-large) 0 0;
        padding: var(--sl-spacing-3x-small) var(--sl-spacing-2x-small) var(--sl-spacing-3x-small) var(--sl-spacing-small);
        align-items: center;
        border: var(--sl-panel-border-width) solid var(--sl-panel-border-color);
        border-bottom: none;
        flex-shrink: 0;
    }

    .slide-tab.active {
        border-color: var(--sl-color-primary-600);
        background: var(--sl-color-primary-50);
    }

    .slide-options {
        display: flex;
        width: 100%;
        align-items: center;
        box-sizing: border-box;
        padding: var(--sl-spacing-2x-small) var(--sl-spacing-2x-small);
        padding-left: var(--sl-spacing-small);
    }

    .slide-number {
        font-weight: var(--sl-font-weight-semibold);
    }

    .spacer {
        flex: 1;
    }

    .controls-overlay {
        position: absolute;
        bottom: var(--sl-spacing-small);
        right: var(--sl-spacing-small);
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--sl-spacing-2x-small);
        padding: var(--sl-spacing-2x-small) var(--sl-spacing-x-small);
        background: rgba(255, 255, 255, 0.75);
        border-radius: var(--sl-border-radius-large);
        border: var(--sl-panel-border-width) solid var(--sl-panel-border-color);
        z-index: 1000000000;
    }
`;
