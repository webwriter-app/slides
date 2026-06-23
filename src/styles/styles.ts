import { css } from "lit";

/**
 * Styles for the slides overview.
 */
export const slides_styles = css`
    :host {
        position: relative;
        background: white;
        display: block;
        padding: 5px;
        box-sizing: border-box;
    }

    :host(:not(:fullscreen)) {
        border: 1px solid var(--sl-color-neutral-300);
        border-radius: var(--sl-border-radius-medium);
        aspect-ratio: 16/9;
        width: 100%;
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
        font-size: 1rem;
        color: var(--sl-color-gray-800);
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5ch;
    }

    :host(:fullscreen) [part="actions"] sl-icon-button {
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

    .controls-columns, .controls-rows {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 5px;
        border-radius: 5px;
        border: 2px solid #ccc;
    }

    .controls-columns {
        flex-direction: column;
        margin: 5px 5px 5px 0px;
    }

    .controls-rows {
        flex-direction: row;
        margin: 5px 5px 0px 0px;
        border-bottom-left-radius: 0px;
        border-bottom-right-radius: 0px;
        border-bottom: none;
    }

    .controls-section {
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

    .slide-thumb.dragging, .slide-tab.dragging {
        opacity: 0.5;
    }

    .slide-thumb.active {
        border-color: var(--sl-color-primary-600);
        background: var(--sl-color-primary-50);
    }

    .slide-thumb span {
        font-size: 14px;
        font-weight: bold;
    }

    .slide-thumb-img {
        width: 100%;
        height: 70px;
        object-fit: cover;
        border-radius: 5px;
        border: 1px solid var(--sl-color-neutral-300);
    }

    .remove-btn,
    .add-btn,
    .duplicate-btn,
    .slide-number,
    .fullscreen-btn {
        cursor: pointer;
        color: var(--sl-color-gray-800);
        font-size: 0.9rem;
    }

    .slide-tabs-wrapper {
        overflow-y: hidden;
        overflow-x: auto;
    }

    .slide-tabs {
        display: flex;
        gap: 5px;
        padding: 5px 5px 0px 5px;
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
        background-color: #fff;
        display: flex;
        width: 100px;
        height: 32px;
        border-radius: 10px 10px 0px 0px;
        padding: 2px 5px 2px 10px;
        align-items: center;
        border: 2px solid #ccc;
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
        padding-left: 5px;
    }

    .slide-number {
        font-size: 0.9rem;
        color: var(--sl-color-gray-800);
        background-color: white;
        border-radius: 10px;
        width: 20px;
        height: 20px;
        text-align: center;
        border: 1px solid var(--sl-color-gray-800);
    }

    .spacer {
        flex: 1;
    }
`;
