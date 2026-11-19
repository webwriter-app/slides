import { html, nothing } from "lit";
import fullscreenIcon from "@tabler/icons/outline/arrows-maximize.svg";
import fullscreenExitIcon from "@tabler/icons/outline/arrows-minimize.svg";
import chevronLeftIcon from "@tabler/icons/outline/chevron-left.svg";
import chevronRightIcon from "@tabler/icons/outline/chevron-right.svg";
import removeIcon from "@tabler/icons/outline/x.svg";
import plusIcon from "@tabler/icons/outline/plus.svg";
import type { PagesView } from "../model/pages-view";

/** Remove button of the active page in the tab or thumbnail strip. */
export function renderPageButtons(view: PagesView, index: number) {
    if (index !== view.activePageIndex) return nothing;
    return html`<div class="page-actions" data-ww-capture-selection="false">
        <sl-icon-button
            class="remove-btn"
            data-ww-can="edit"
            title=${view.msg("Remove page")}
            label=${view.msg("Remove page")}
            ?disabled=${view.pages.length <= 1}
            @click=${(e: MouseEvent) => {
                e.stopPropagation();
                view.removePage(index);
            }}
            src=${removeIcon}
        ></sl-icon-button>
    </div>`;
}

/** An author-only card at the end of the page list that appends a new page. */
export function renderAddPage(view: PagesView) {
    return view.editing ? html`
        <button
            type="button"
            class="add-page"
            data-ww-capture-selection="false"
            data-ww-can="edit"
            aria-label=${view.msg("Add page")}
            title=${view.msg("Add page")}
            @click=${() => view.addPage()}
        ><sl-icon src=${plusIcon} aria-hidden="true"></sl-icon></button>
    ` : nothing;
}

/** Page navigation or tab scrolling, plus fullscreen controls. */
export function renderControls(view: PagesView, navigation: "pages" | "tabs" | "none" = "pages") {
    const tabs = navigation === "tabs";
    const previousTitle = tabs ? view.msg("Scroll tabs backward") : view.msg("Go to previous page");
    const nextTitle = tabs ? view.msg("Scroll tabs forward") : view.msg("Go to next page");
    return html`${navigation === "none" ? nothing : html`<div class="controls-section" data-ww-capture-selection="false">
            <sl-icon-button
                class=${tabs ? "tabs-scroll-backward" : ""}
                title=${previousTitle}
                label=${previousTitle}
                @click=${(e: MouseEvent) => tabs ? view.scrollTabs(true) : view.handleNextPageClick(e, true)}
                src=${chevronLeftIcon}
                ?disabled=${tabs ? !view.canScrollTabsBackward : !view.hasPreviousPage}
            ></sl-icon-button>
            ${tabs ? nothing : html`<div class="pages-index" role="status">
                <span>${view.activePageIndex + 1}</span> /
                <span>${view.pages?.length}</span>
            </div>`}
            <sl-icon-button
                class=${tabs ? "tabs-scroll-forward" : ""}
                title=${nextTitle}
                label=${nextTitle}
                @click=${(e: MouseEvent) => tabs ? view.scrollTabs(false) : view.handleNextPageClick(e)}
                src=${chevronRightIcon}
                ?disabled=${tabs ? !view.canScrollTabsForward : !view.hasNextPage}
            ></sl-icon-button>
        </div>`}
        <div class="controls-section" data-ww-capture-selection="false">
            <sl-icon-button
                id="fullscreen"
                class="fullscreen-btn"
                title=${view.isFullscreen ? view.msg("Exit fullscreen") : view.msg("Show in fullscreen")}
                label=${view.isFullscreen ? view.msg("Exit fullscreen") : view.msg("Show in fullscreen")}
                src=${view.isFullscreen ? fullscreenExitIcon : fullscreenIcon}
                @click=${() => view.toggleFullscreen()}
            ></sl-icon-button>
        </div>`;
}
