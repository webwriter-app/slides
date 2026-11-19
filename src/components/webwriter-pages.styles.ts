import { css } from "lit";

/**
 * Styles for the pages overview.
 */
export const pages_styles = css`
    :host {
        position: relative;
        background: var(--sl-panel-background-color);
        color: var(--ww-text-color, inherit);
        font-family: var(--ww-font-family, inherit);
        --_accent: var(--ww-theme-accent-1, var(--sl-color-primary-600));
        --_accent-soft: color-mix(in srgb, var(--ww-theme-accent-1) 12%, white);
        --_page-action-size: 24px;
        --_page-action-space: calc(var(--_page-action-size) / 2 + var(--sl-focus-ring-offset));
        --_page-ratio: 16 / 9;
        display: block;
        box-sizing: border-box;
        min-width: min(300px, 100%);
        max-width: 2100px;
        margin-inline: auto;
        container-type: inline-size;
        container-name: pages;
    }

    :host(:not(:fullscreen):not(.ww-fullscreen)) {
        width: 100%;
        block-size: auto;
    }

    :host([orientation="portrait"]) {
        --_page-ratio: 9 / 16;
    }

    .pages-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
    }

    .page-stage {
        position: relative;
        min-inline-size: 0;
        inline-size: 100%;
        block-size: auto;
        align-self: center;
        aspect-ratio: var(--_page-ratio);
    }

    .page-viewport {
        display: contents;
    }

    .page-surface {
        display: contents;
    }

    :host(:fullscreen),
    :host(.ww-fullscreen) {
        max-width: none;
        background: var(--sl-color-neutral-50);
    }

    :host::backdrop {
        background: var(--sl-color-neutral-50, #f9f9f9);
    }

    :host(:fullscreen) .pages-layout,
    :host(.ww-fullscreen) .pages-layout {
        display: flex;
        flex-direction: column;
        block-size: 100%;
    }

    :host(:fullscreen) .page-viewport,
    :host(.ww-fullscreen) .page-viewport {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        place-items: center;
        flex: 1 1 0;
        min-block-size: 0;
        container-type: size;
    }

    :host(:fullscreen) .page-stage,
    :host(.ww-fullscreen) .page-stage {
        inline-size: min(100cqi, calc(100cqb * var(--_page-ratio)));
        background: var(--sl-panel-background-color);
        margin: 0;
    }

    :host(:fullscreen) .pages-view .page-surface,
    :host(.ww-fullscreen) .pages-view .page-surface {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: end;
        gap: var(--sl-spacing-small);
        inline-size: max-content;
        max-inline-size: 100%;
    }

    :host(:fullscreen) .pages-view .page-stage,
    :host(.ww-fullscreen) .pages-view .page-stage {
        grid-column: 1;
        grid-row: 1;
        inline-size: calc(100cqb * var(--_page-ratio));
        max-inline-size: 100%;
    }

    :host(:fullscreen) .pages-view .page-surface:dir(rtl),
    :host(.ww-fullscreen) .pages-view .page-surface:dir(rtl) {
        grid-template-columns: auto minmax(0, 1fr);
    }

    :host(:fullscreen) .pages-view .page-surface:dir(rtl) > .page-stage,
    :host(.ww-fullscreen) .pages-view .page-surface:dir(rtl) > .page-stage {
        grid-column: 2;
    }

    :host(:fullscreen) .pages-view .page-surface:dir(rtl) > .controls-overlay,
    :host(.ww-fullscreen) .pages-view .page-surface:dir(rtl) > .controls-overlay {
        grid-column: 1;
    }

    [part="tabs"] {
        inline-size: 100%;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: end;
        gap: var(--sl-spacing-x-small);
        position: relative;
        z-index: 1;
        border: var(--sl-panel-border-width) solid var(--sl-panel-border-color);
        border-radius: var(--sl-border-radius-medium) var(--sl-border-radius-medium) 0 0;
        background: var(--sl-color-neutral-50);
        flex: 0 0 auto;
    }

    :host(:fullscreen) [part="tabs"],
    :host(.ww-fullscreen) [part="tabs"] {
        padding-inline: max(0px, calc((100% - var(--_page-inline-size, 100%)) / 2 - var(--sl-panel-border-width)));
        column-gap: 0;
        border-color: transparent;
        transform: translateY(var(--_page-block-offset, 0px));
    }

    :host(:fullscreen) [part="tabs"]::before,
    :host(.ww-fullscreen) [part="tabs"]::before {
        content: "";
        position: absolute;
        inline-size: var(--_page-inline-size, 100%);
        block-size: var(--sl-panel-border-width);
        inset-inline-start: 50%;
        inset-block-end: calc(var(--sl-panel-border-width) * -1);
        transform: translateX(-50%);
        background: var(--sl-panel-border-color);
        pointer-events: none;
        z-index: -1;
    }

    [part="tabs"],
    [part="actions"],
    .controls-overlay {
        user-select: none;
    }

    [part="actions"] {
        --_preview-height: 4rem;
        --_thumb-width: calc(var(--_preview-height) * var(--_page-ratio));
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--sl-spacing-x-small);
        border: var(--sl-panel-border-width) solid var(--sl-panel-border-color);
        border-block-start: 0;
        border-radius: 0 0 var(--sl-border-radius-medium) var(--sl-border-radius-medium);
        background-color: var(--sl-color-neutral-50);
    }

    :host([orientation="portrait"]) [part="actions"] {
        --_preview-height: 6rem;
    }

    :host([type="pages"]:not(:fullscreen):not(.ww-fullscreen)) ::slotted(webwriter-page) {
        border-end-start-radius: 0;
        border-end-end-radius: 0;
    }

    .tabs-view .page-stage {
        margin-block-start: calc(var(--sl-panel-border-width) * -1);
    }

    :host(:not([type="pages"])) ::slotted(webwriter-page) {
        border-start-start-radius: 0;
        border-start-end-radius: 0;
    }

    .pages-index {
        user-select: none;
        font-size: var(--sl-font-size-medium);
        color: var(--ww-text-color, var(--sl-color-neutral-800));
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5ch;
    }

    ::slotted(webwriter-page:not([active])) {
        display: none !important;
    }

    slot:not([name]) {
        display: block;
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
    }

    ::slotted(webwriter-page) {
        width: 100% !important;
        height: 100% !important;
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
        flex: 0 0 auto;
        border: 0;
        padding: var(--sl-spacing-x-small);
        background: none;
    }

    .controls-rows {
        box-sizing: border-box;
        block-size: 40px;
        flex-direction: row;
        gap: var(--sl-spacing-2x-small);
        margin: 0;
        padding-block: 0;
        border: 0;
        border-radius: 0;
        background: none;
    }

    .controls-section {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--sl-spacing-2x-small);
    }

    .tabs-scroll-backward:dir(rtl),
    .tabs-scroll-forward:dir(rtl) {
        transform: scaleX(-1);
    }

    .page-thumbs {
        grid-column: 1;
        grid-row: 1;
        display: flex;
        align-items: start;
        flex-direction: row;
        flex: 1 1 auto;
        min-inline-size: 0;
        gap: var(--sl-spacing-x-small);
        padding: var(--_page-action-space);
        padding-block-end: var(--sl-spacing-2x-small);
        /* scrollbar-gutter only reserves inline edges, not the bottom edge. */
        overflow-x: scroll;
        scrollbar-width: thin;
        --_scrollbar-thumb: var(--sl-color-neutral-500);
        --_scrollbar-track: var(--sl-color-neutral-50);
        scrollbar-color: var(--_scrollbar-thumb) var(--_scrollbar-track);
    }

    .page-thumb, .add-page {
        inline-size: var(--_thumb-width, 120px);
        aspect-ratio: var(--_page-ratio);
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

    .page-thumb {
        block-size: var(--_preview-height);
        scroll-margin-inline: var(--_page-action-space);
        scroll-margin-block-start: var(--_page-action-space);
        max-inline-size: 100%;
        overflow: visible;
    }

    .preview-actions {
        grid-column: 2;
        grid-row: 1;
        display: flex;
        align-items: center;
        align-self: start;
        margin-block-start: var(--_page-action-space);
        margin-inline-end: var(--sl-spacing-x-small);
    }

    .preview-actions > .add-page {
        block-size: var(--_preview-height);
        margin: 0;
    }

    .add-page {
        align-self: start;
        margin-block-start: var(--sl-spacing-x-small);
        padding: 0;
        font: inherit;
        font-size: var(--sl-font-size-small);
        color: var(--sl-color-neutral-600);
        background: var(--sl-color-neutral-50);
        border-style: dashed;
    }

    .add-page:hover,
    .add-page:focus-visible {
        color: var(--_accent);
        border-color: var(--_accent);
        background: var(--sl-panel-background-color);
    }

    .page-tabs-row > .add-page {
        align-self: end;
        inline-size: 48px;
        block-size: 40px;
        aspect-ratio: auto;
        margin: 0;
        border-radius: var(--sl-border-radius-medium) var(--sl-border-radius-medium) 0 0;
        border-block-end: 0;
        background: transparent;
    }

    .page-thumb[data-ww-dragging], .page-tab[data-ww-dragging] {
        opacity: 0.5;
    }

    .page-thumb.active {
        border-color: var(--_accent);
        background: var(--_accent-soft, var(--sl-color-primary-50));
    }

    .page-thumb:focus-visible,
    .add-page:focus-visible,
    .page-thumbs:focus-visible,
    .page-select:focus-visible {
        outline: var(--sl-focus-ring-width) solid var(--_accent);
        outline-offset: var(--sl-focus-ring-offset);
    }

    .page-select {
        font: inherit;
        color: inherit;
        background: none;
        border: 0;
        cursor: pointer;
        border-radius: var(--sl-border-radius-small);
    }

    .page-thumb-select {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        width: 100%;
        min-height: 0;
        padding: 0;
        border-radius: inherit;
        overflow: clip;
    }

    .page-thumb-select:focus-visible {
        outline-offset: calc(var(--sl-focus-ring-width) * -1);
    }

    .page-thumb-img {
        width: 100%;
        flex: 1;
        min-height: 0;
        object-fit: cover;
    }

    .remove-btn,
    .page-number,
    .fullscreen-btn {
        cursor: pointer;
        color: var(--sl-color-neutral-800);
        font-size: var(--sl-font-size-small);
    }

    .page-tabs-row {
        container: page-tabs / inline-size;
        --_tab-add-space: 0px;
        display: flex;
        align-items: end;
        min-inline-size: 0;
        gap: var(--sl-spacing-2x-small);
        padding: 0 0 0 var(--sl-spacing-x-small);
        margin-block-end: calc(var(--sl-panel-border-width) * -1);
    }

    .page-tabs-row.has-add {
        --_tab-add-space: calc(48px + var(--sl-spacing-2x-small));
    }

    .page-tabs-wrapper {
        flex: 0 1 auto;
        min-inline-size: 0;
        padding: var(--sl-spacing-2x-small) var(--sl-focus-ring-offset) var(--sl-panel-border-width);
        overflow-y: hidden;
        overflow-x: auto;
        scrollbar-width: none;
    }

    .page-tabs-wrapper::-webkit-scrollbar {
        display: none;
    }

    .page-tabs {
        display: flex;
        inline-size: max-content;
        gap: var(--sl-spacing-2x-small);
        cursor: pointer;
    }

    .page-tab {
        position: relative;
        box-sizing: border-box;
        background: transparent;
        display: flex;
        inline-size: auto;
        min-inline-size: clamp(5rem, calc((100cqi - var(--_tab-add-space) - var(--sl-focus-ring-offset) - var(--_page-action-space) - (var(--_tab-count) - 1) * var(--sl-spacing-2x-small)) / var(--_tab-count)), 12rem);
        block-size: 40px;
        border-radius: var(--sl-border-radius-medium) var(--sl-border-radius-medium) 0 0;
        padding: 0 var(--sl-spacing-2x-small) 0 var(--sl-spacing-small);
        align-items: center;
        border: var(--sl-panel-border-width) solid transparent;
        border-block-end: 0;
        flex-shrink: 0;
    }

    .page-tab.active {
        border-color: var(--sl-panel-border-color);
        background: var(--_page-background, var(--sl-panel-background-color));
    }

    .page-tab.active::after {
        content: "";
        position: absolute;
        inset-inline: 0;
        inset-block-end: calc(var(--sl-panel-border-width) * -1);
        block-size: var(--sl-panel-border-width);
        background: var(--_page-background, var(--sl-panel-background-color));
    }

    .page-tab:focus-visible {
        outline: var(--sl-focus-ring-width) solid var(--_accent);
        outline-offset: var(--sl-focus-ring-offset);
    }

    .page-options {
        position: absolute;
        inset-inline: 0;
        inset-block-end: 0;
        display: flex;
        width: 100%;
        align-items: center;
        box-sizing: border-box;
        padding: var(--sl-spacing-2x-small) var(--sl-spacing-2x-small);
        padding-left: var(--sl-spacing-small);
        pointer-events: none;
    }

    .page-options > .page-number {
        opacity: 0.5;
        background: var(--sl-panel-background-color);
        border-radius: var(--sl-border-radius-small);
    }

    .page-options > .page-number {
        padding: var(--sl-spacing-3x-small) var(--sl-spacing-2x-small);
    }

    .page-thumb:hover .page-options > *,
    .page-thumb:focus-within .page-options > * {
        opacity: 1;
    }

    .page-number {
        font-weight: var(--sl-font-weight-semibold);
    }

    .page-tab .page-select {
        text-align: start;
        padding: 0;
        align-self: stretch;
        font-size: var(--sl-font-size-small);
        max-inline-size: 30ch;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .page-label-field {
        display: flex;
        align-items: center;
        font-size: var(--sl-font-size-small);
    }

    .page-label-input {
        field-sizing: content;
        inline-size: auto;
        min-inline-size: 4ch;
        max-inline-size: 30ch;
        align-self: center;
        padding: 0;
        border: 0;
        border-radius: var(--sl-border-radius-small);
        background: transparent;
        color: inherit;
        font: inherit;
        line-height: 1.5;
        user-select: text;
    }

    .page-label-input::placeholder,
    .page-label-placeholder {
        color: var(--sl-color-neutral-500);
        opacity: 1;
    }

    .page-label-input:focus {
        outline: none;
    }

    @supports not (field-sizing: content) {
        .page-label-field {
            display: inline-grid;
            min-inline-size: 4ch;
            max-inline-size: 30ch;
        }

        .page-label-field::after,
        .page-label-input {
            grid-area: 1 / 1;
        }

        .page-label-field::after {
            content: attr(data-label) " ";
            visibility: hidden;
            white-space: pre;
        }

        .page-label-input {
            inline-size: 0;
            min-inline-size: 100%;
        }
    }

    .page-actions {
        position: absolute;
        inset-block-start: calc(var(--_page-action-size) / -2);
        inset-inline-end: calc(var(--_page-action-size) / -2);
        display: flex;
        z-index: 2;
    }

    .page-tab .page-actions {
        inset-block: 0;
        inset-inline-end: var(--sl-spacing-2x-small);
        align-items: center;
    }

    .page-actions sl-icon-button {
        position: relative;
        isolation: isolate;
        inline-size: var(--_page-action-size);
        block-size: var(--_page-action-size);
        font-size: 12px;
        color: color-mix(in srgb, var(--sl-color-neutral-900) 50%, white);
    }

    .page-actions sl-icon-button::before {
        content: "";
        position: absolute;
        inset: 2px;
        border: var(--sl-panel-border-width) solid var(--sl-panel-border-color);
        border-radius: 50%;
        background: white;
        pointer-events: none;
        z-index: -1;
    }

    .page-actions sl-icon-button::part(base) {
        inline-size: 100%;
        block-size: 100%;
        box-sizing: border-box;
        justify-content: center;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: inherit;
    }

    .page-tab .remove-btn::before {
        background: rgb(255 255 255 / 0.5);
        border-color: transparent;
    }

    .page-actions sl-icon-button::part(base):focus-visible {
        outline-offset: -2px;
    }

    .page-thumb:focus-within .page-actions sl-icon-button,
    .page-tab:focus-within .page-actions sl-icon-button {
        color: var(--sl-color-neutral-800);
    }

    .page-actions .remove-btn:not([disabled]):focus-within::part(base) {
        color: var(--sl-color-danger-600);
    }

    .page-actions .remove-btn:not([disabled]):focus-within::before {
        border-color: var(--sl-color-danger-600);
    }

    @media (hover: hover) {
        .page-thumb:hover {
            box-shadow: 0 1px 4px rgb(0 0 0 / 0.15);
        }

        .page-thumb:not(.active):hover {
            border-color: var(--sl-color-neutral-500);
        }

        .page-tab:not(.active):hover {
            background: var(--sl-color-neutral-100);
            border-color: var(--sl-panel-border-color);
        }

        .page-tab.active:hover {
            border-color: var(--sl-color-neutral-400);
        }

        .page-thumb:hover .page-actions sl-icon-button,
        .page-tab:hover .page-actions sl-icon-button {
            color: var(--sl-color-neutral-800);
        }

        .page-actions .remove-btn:not([disabled]):hover::part(base) {
            color: var(--sl-color-danger-600);
        }

        .page-actions .remove-btn:not([disabled]):hover::before {
            border-color: var(--sl-color-danger-600);
        }

        .page-tab .remove-btn:not([disabled]):hover::before {
            background: white;
        }
    }

    .controls-overlay {
        grid-column: 2;
        grid-row: 1;
        margin-block-end: var(--sl-spacing-small);
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

    @container pages (max-width: 520px) {
        .page-tabs-row > .add-page {
            inline-size: 40px;
        }

        .page-tabs-row.has-add {
            --_tab-add-space: calc(40px + var(--sl-spacing-2x-small));
        }

    }

    @container pages (min-width: 1100px) {
        :host(:not(:fullscreen):not(.ww-fullscreen)) .pages-view {
            grid-template-columns: minmax(0, 1fr) auto;
        }

        :host(:not(:fullscreen):not(.ww-fullscreen)) [part="actions"] {
            contain: size;
            inline-size: calc(2 * var(--_thumb-width) + 7rem);
            min-block-size: 0;
            grid-template-columns: minmax(0, 1fr) auto;
            border-block-start: var(--sl-panel-border-width) solid var(--sl-panel-border-color);
            border-inline-start: 0;
            border-radius: 0 var(--sl-border-radius-medium) var(--sl-border-radius-medium) 0;
        }

        :host(:not(:fullscreen):not(.ww-fullscreen)) .page-thumbs {
            grid-column: 1;
            grid-row: 1 / -1;
            flex-direction: column;
            min-block-size: 0;
            padding-block-end: var(--_page-action-space);
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-gutter: stable;
        }

        :host([type="pages"]:not(:fullscreen):not(.ww-fullscreen)) ::slotted(webwriter-page) {
            border-start-end-radius: 0;
            border-end-start-radius: var(--sl-border-radius-medium);
        }

    }

    @media (pointer: coarse) {
        :host {
            --_page-action-size: 32px;
        }

        sl-icon-button {
            font-size: 1.75rem;
        }

        .page-actions sl-icon-button {
            font-size: 14px;
        }

        .page-actions sl-icon-button::before {
            inset: 4px;
        }

        .page-tab {
            block-size: 56px;
        }

        .page-tabs-row > .add-page {
            block-size: 56px;
        }

        .controls-rows {
            block-size: 56px;
        }

        .page-select {
            min-height: 44px;
        }

        .page-thumb-select {
            min-height: 0;
        }
    }

    @supports not (scrollbar-color: auto) {
        .page-thumbs::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        .page-thumbs::-webkit-scrollbar-thumb {
            background: var(--_scrollbar-thumb);
        }

        .page-thumbs::-webkit-scrollbar-track {
            background: var(--_scrollbar-track);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        * {
            scroll-behavior: auto;
        }
    }

    @media print {
        :host,
        :host(:not(:fullscreen):not(.ww-fullscreen)) {
            display: block;
            border: 0;
            padding: 0;
            aspect-ratio: auto;
            max-width: none;
            width: auto;
            background: none;
            container-type: normal;
        }

        aside,
        .controls-overlay {
            display: none !important;
        }

        slot:not([name]) {
            position: static;
            height: auto;
            min-height: 0;
        }

        .pages-layout,
        .page-surface,
        .page-stage {
            display: block !important;
            aspect-ratio: auto;
            inline-size: auto !important;
            block-size: auto !important;
        }

        ::slotted(webwriter-page:not([active])),
        ::slotted(webwriter-page) {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            break-inside: avoid;
            margin-block-end: var(--sl-spacing-small);
        }
    }
`;
