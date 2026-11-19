import type { MsgFn } from "@lit/localize";
import type { WebwriterPage } from "../widgets/webwriter-page";

/** What the page strip and the controls need from the sequence of pages to render and to act. */
export interface PagesView {
    msg: MsgFn;
    pages: WebwriterPage[];
    activePageIndex: number;
    editing: boolean;
    isFullscreen: boolean;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    canScrollTabsBackward: boolean;
    canScrollTabsForward: boolean;
    scrollTabs(backwards: boolean): void;
    onTabScroll(): void;
    setPageLabel(page: WebwriterPage, label: string): void;
    changePage(index: number): void;
    addPage(index?: number): void;
    duplicatePage(index: number): void;
    removePage(index: number): void;
    handleNextPageClick(e: MouseEvent | KeyboardEvent, backwards?: boolean): void;
    toggleFullscreen(): void;
    onDragCommit(e: Event): void;
}
