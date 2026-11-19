import { html, nothing } from "lit";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import type { PagesView } from "../model/pages-view";
import { renderAddPage, renderControls, renderPageButtons } from "./pages-controls";

/** The tab strip with its controls, shown in the "tabs" view. */
export function renderTabs(view: PagesView) {
    return html`<aside part="tabs" contenteditable="false">
        <div class="page-tabs-row ${view.editing ? "has-add" : ""}" style=${`--_tab-count: ${Math.max(1, view.pages.length)}`}>
            <div class="page-tabs-wrapper" @scroll=${view.onTabScroll}>
                <div class="page-tabs" data-ww-drop="page" data-ww-drop-position="index" @ww-dragcommit=${view.onDragCommit}>
                    ${view.pages.map(
                        (page, index) => {
                            const placeholder = view.msg("Page") + " " + (index + 1);
                            const label = page.getAttribute("label") ?? "";
                            const background = index === view.activePageIndex ? getComputedStyle(page).backgroundColor : undefined;
                            return html`
                            <div
                                class="page-tab ${index === view.activePageIndex ? "active" : ""}"
                                data-ww-capture-selection="false"
                                part="tab"
                                style=${styleMap({ "--_page-background": background === "rgba(0, 0, 0, 0)" ? undefined : background })}
                                data-ww-label=${label || placeholder}
                                @click=${() => view.changePage(index)}
                                data-ww-drag=${view.editing ? "page" : nothing}
                                data-ww-drag-via="pointer keyboard"
                                data-ww-key=${index}
                            >
                                ${view.editing && index === view.activePageIndex ? html`
                                    <span class="page-label-field" data-label=${label || placeholder}>
                                        <input
                                            type="text"
                                            class="page-label-input"
                                            aria-label=${placeholder}
                                            aria-current=${index === view.activePageIndex ? "true" : nothing}
                                            placeholder=${placeholder}
                                            .value=${live(label)}
                                            @focus=${() => view.changePage(index)}
                                            @input=${(event: InputEvent) => view.setPageLabel(page, (event.currentTarget as HTMLInputElement).value)}
                                            @keydown=${(event: KeyboardEvent) => {
                                                if (event.key === "Enter") {
                                                    event.preventDefault();
                                                    (event.currentTarget as HTMLInputElement).blur();
                                                }
                                            }}
                                        />
                                    </span>
                                ` : html`<button
                                    type="button"
                                    class="page-select"
                                    aria-label=${label || placeholder}
                                    title=${label || placeholder}
                                    aria-current=${index === view.activePageIndex ? "true" : nothing}
                                ><span class=${label ? "" : "page-label-placeholder"}>${label || placeholder}</span></button>`}

                                ${renderPageButtons(view, index)}
                            </div>
                            `;
                        }
                    )}
                </div>
            </div>
            ${renderAddPage(view)}
        </div>
        <div class="controls-rows">${renderControls(view, "tabs")}</div>
    </aside>`;
}

/** The thumbnail strip with its controls, shown in the "pages" view outside fullscreen. */
export function renderThumbs(view: PagesView) {
    return html`<aside part="actions" contenteditable="false">
        <div class="page-thumbs" role="region" aria-label=${view.msg("Pages")} tabindex="0" data-ww-drop="page" data-ww-drop-position="index" @ww-dragcommit=${view.onDragCommit}>
            ${view.pages.map(
                (page, index) => html`
                    <div
                        class="page-thumb ${index === view.activePageIndex ? "active" : ""}"
                        data-ww-capture-selection="false"
                        part="thumbnail"
                        data-ww-label=${view.msg("Page") + " " + (index + 1)}
                        @click=${() => view.changePage(index)}
                        data-ww-drag=${view.editing ? "page" : nothing}
                        data-ww-drag-via="pointer keyboard"
                        data-ww-key=${index}
                    >
                        <button
                            type="button"
                            class="page-select page-thumb-select"
                            aria-label=${view.msg("Page") + " " + (index + 1)}
                            aria-current=${index === view.activePageIndex ? "true" : nothing}
                        >
                            ${page.thumbnail
                                ? html`<img class="page-thumb-img" alt="" draggable="false" src=${page.thumbnail} />`
                                : html`<div class="page-thumb-img"></div>`}
                        </button>

                        <div class="page-options">
                            <div class="page-number">${index + 1}</div>
                        </div>
                        ${renderPageButtons(view, index)}
                    </div>
                `
            )}
        </div>
        <div class="preview-actions">
            ${renderAddPage(view)}
            <div class="controls-columns">${renderControls(view, "none")}</div>
        </div>
    </aside>`;
}
