import { css, html, LitElement } from "lit";
import { property, queryAssignedElements } from "lit/decorators.js";

export interface DraggableGridItem {
	get draggableElement(): HTMLElement;
}

export type DraggableGridReorderDetail = {
	/** ID of the dragged item. */
	id: string;
	/** Where the dragged item should be placed relative to the anchor item. */
	placement: "before" | "after";
	/** ID of the existing item used as the placement anchor. */
	anchorId: string;
};

export type DraggableGridAxis = "x" | "y" | "both";

type GridSnapshotItem = {
	draggable: boolean;
	width: number;
	height: number;
	x: number;
	y: number;
};

type GridSnapshot = {
	grid: {
		width: number;
		height: number;
		columnWidths: number[];
		rowGap: number;
		columnGap: number;
	};
	items: Map<string, GridSnapshotItem>;
};

export class DraggableGrid extends LitElement {
	static styles = css`
		slot {
			display: contents;
		}
	`;

	private static readonly TRANSITION_MS = 200;
	private static readonly TRANSITION = `transform ${DraggableGrid.TRANSITION_MS}ms cubic-bezier(0.2, 0, 0, 1)`;

	private snapshot: GridSnapshot | null = null;
	private order: string[] = [];
	private state: "idle" | "pending" | "dragging" | "settling" = "idle";
	private pendingDragState: {
		id: string;
		pointerId: number;
		start: { x: number; y: number };
	} | null = null;
	private dragState: {
		id: string;
		pointerId: number;
		startCorner: { x: number; y: number };
		start: { x: number; y: number };
		current: { x: number; y: number };
	} | null = null;
	private releaseOrder: string[] = [];
	private pendingReorder: DraggableGridReorderDetail | null = null;
	private dragFrame: number | null = null;
	private autoScrollContainer: HTMLElement | null = null;
	private autoScrollMaxScrollY: number | null = null;
	private previousDocumentCursor: string | null = null;
	private suppressClick = false;
	private listeningForPendingDrag = false;

	@property({ type: String, attribute: true })
	accessor dragHandleSelector: string = "[data-drag-handle]";

	@property({ type: String, attribute: true })
	accessor dragNoHandleSelector: string = "[data-drag-no-handle]";

	@property({ type: String, attribute: true })
	accessor axis: DraggableGridAxis = "both";

	@property({ type: Number, attribute: true })
	accessor dragStartThreshold: number = 5;

	@queryAssignedElements({ flatten: true })
	private accessor slotElements!: HTMLElement[];

	connectedCallback(): void {
		super.connectedCallback();
		this.addEventListener("pointerdown", this.onPointerDown);
		this.addEventListener("pointermove", this.onPointerMove);
		document.addEventListener("scroll", this.onScroll);
		this.addEventListener("pointerup", this.onPointerUp);
		this.addEventListener("pointercancel", this.onPointerUp);
		this.addEventListener("lostpointercapture", this.onPointerUp);
		this.addEventListener("click", this.onClick, true);
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		this.removePendingDragListeners();
		this.removeEventListener("pointerdown", this.onPointerDown);
		this.removeEventListener("pointermove", this.onPointerMove);
		document.removeEventListener("scroll", this.onScroll);
		this.removeEventListener("pointerup", this.onPointerUp);
		this.removeEventListener("pointercancel", this.onPointerUp);
		this.removeEventListener("lostpointercapture", this.onPointerUp);
		this.removeEventListener("click", this.onClick, true);
	}

	private resolve(id: string): HTMLElement {
		// Since we are working with ProseMirror, we always have to freshly resolve the element based on the ID,
		// as ProseMirror may have replaced the element in the DOM. We cannot rely on the cached element in the dragState.
		const element = this.slotElements.find(el => el.id === id);
		return element && "draggableElement" in element ? (element as DraggableGridItem).draggableElement : element!;
	}

	private captureSnapshot() {
		const cs = window.getComputedStyle(this);
		const axis = this.normalizedAxis;
		const rect = this.getBoundingClientRect();
		const grid = {
			width: Math.max(rect.width, this.scrollWidth),
			height: Math.max(rect.height, this.scrollHeight),
			columnWidths: axis === "y"
				? [rect.width]
				: cs.gridTemplateColumns.split(" ").map(parseFloat),
			rowGap: parseFloat(cs.rowGap.replace("normal", "0")),
			columnGap: parseFloat(cs.columnGap.replace("normal", "0")),
		};

		this.order = [];

		const items = new Map<string, GridSnapshotItem>();
		for (const item of this.slotElements) {
			if (!item.id) {
				console.warn("ReorderableGrid: child element is missing an id", item);
				continue;
			}
			const element = this.resolve(item.id);
			element.style.transition = DraggableGrid.TRANSITION;
			const itemRect = element.getBoundingClientRect();
			items.set(item.id, {
				draggable: !item.hasAttribute("data-not-draggable"),
				width: itemRect.width,
				height: itemRect.height,
				x: itemRect.x - rect.x,
				y: itemRect.y - rect.y,
			});
			this.order.push(item.id);
		}

		this.snapshot = { grid, items };
	}

	private get normalizedAxis(): DraggableGridAxis {
		return this.axis === "x" || this.axis === "y" || this.axis === "both" ? this.axis : "both";
	}

	/**
	 * Walks the grid slot by slot for the given order, yielding the top-left
	 * corner of each slot. Emits `order.length + 1` positions: one per item plus
	 * the trailing slot, so it can be used both to lay out items and to hit-test
	 * insertion points. This is the single source of truth for the grid geometry.
	 */
	private *layoutPositions(
		order: string[],
	): Generator<{ index: number; id: string | undefined; x: number; y: number }> {
		if (!this.snapshot) return;
		const { columnWidths, columnGap, rowGap } = this.snapshot.grid;
		const columns = columnWidths.length;

		let currentRowHeight = 0;
		let x = 0;
		let y = 0;

		for (let i = 0; i <= order.length; i++) {
			const id = order[i];
			yield { index: i, id, x, y };

			const item = id !== undefined ? this.snapshot.items.get(id) : undefined;
			if (!item) continue;

			currentRowHeight = Math.max(currentRowHeight, item.height);
			x += columnGap + columnWidths[i % columns];
			if ((i + 1) % columns === 0) {
				x = 0;
				y += currentRowHeight + rowGap;
				currentRowHeight = 0;
			}
		}
	}

	private animateToPosition(newOrder: string[]) {
		if (!this.snapshot) return;

		for (const { id, x, y } of this.layoutPositions(newOrder)) {
			if (id === undefined) continue;
			const item = this.snapshot.items.get(id);
			if (!item) continue; // This should not happen

			if (id !== this.dragState?.id || this.state === "settling") {
				this.resolve(id).style.transform = `translate(${x - item.x}px, ${y - item.y}px)`;
			}
		}
	}

	private dragDistanceFromStart(current: { x: number; y: number }) {
		if (!this.pendingDragState) return 0;
		const deltaX = current.x - this.pendingDragState.start.x;
		const deltaY = current.y - this.pendingDragState.start.y;
		const axis = this.normalizedAxis;
		if (axis === "x") return Math.abs(deltaX);
		if (axis === "y") return Math.abs(deltaY);
		return Math.hypot(deltaX, deltaY);
	}

	private clamp(value: number, min: number, max: number) {
		const lower = Math.min(min, max);
		const upper = Math.max(min, max);
		return Math.min(upper, Math.max(lower, value));
	}

	private addPendingDragListeners() {
		if (this.listeningForPendingDrag) return;
		document.addEventListener("pointermove", this.onPointerMove);
		document.addEventListener("pointerup", this.onPointerUp);
		document.addEventListener("pointercancel", this.onPointerUp);
		this.listeningForPendingDrag = true;
	}

	private removePendingDragListeners() {
		if (!this.listeningForPendingDrag) return;
		document.removeEventListener("pointermove", this.onPointerMove);
		document.removeEventListener("pointerup", this.onPointerUp);
		document.removeEventListener("pointercancel", this.onPointerUp);
		this.listeningForPendingDrag = false;
	}

	private onPointerDown = (event: PointerEvent) => {
		if (this.state !== "idle") return;

		const path = event.composedPath();

		if (!path.find(el => el instanceof HTMLElement && el.matches(this.dragHandleSelector))) return;
		if (path.find(el => el instanceof HTMLElement && el.matches(this.dragNoHandleSelector))) return;

		const id = (
			path.find(
				el => el instanceof HTMLElement && this.slotElements.includes(el) && !el.hasAttribute("data-not-draggable"),
			) as HTMLElement | undefined
		)?.id;
		if (!id) return;
		const element = this.resolve(id);
		if (!element) return;

		this.pendingDragState = {
			id,
			pointerId: event.pointerId,
			start: { x: event.clientX, y: event.clientY },
		};
		this.state = "pending";
		this.addPendingDragListeners();
	};

	private startDrag(event: PointerEvent) {
		if (!this.pendingDragState) return;
		const id = this.pendingDragState.id;
		const element = this.resolve(id);
		if (!element) {
			this.pendingDragState = null;
			this.state = "idle";
			this.removePendingDragListeners();
			return;
		}

		event.preventDefault();
		this.removePendingDragListeners();
		this.captureSnapshot();
		this.autoScrollContainer = this.findScrollableContainer("x");
		this.autoScrollMaxScrollY = this.getMaxScrollY();
		element.style.transition = "none";
		element.style.zIndex = "1000";
		element.classList.add("ww-dragging");
		this.previousDocumentCursor = document.documentElement.style.cursor;
		document.documentElement.style.cursor = "grabbing";
		this.state = "dragging";
		const rect = this.getBoundingClientRect();
		const itemRect = element.getBoundingClientRect();
		this.dragState = {
			id,
			pointerId: event.pointerId,
			startCorner: { x: itemRect.left - rect.left, y: itemRect.top - rect.top },
			start: { x: this.pendingDragState.start.x - rect.left, y: this.pendingDragState.start.y - rect.top },
			current: { x: event.clientX, y: event.clientY },
		};
		this.pendingDragState = null;
		this.setPointerCapture(event.pointerId);
	}

	private createReorderDetail(id: string, orderWithoutDragged: string[], insertIndex: number) {
		const isDraggable = (index: number) => this.snapshot?.items.get(orderWithoutDragged[index])?.draggable ?? false;

		// Anchor "before" the following item, but if it is non-draggable (e.g. a pinned
		// trailing element the consumer doesn't track), anchor "after" the preceding
		// draggable item instead so the anchor is always a real, reorderable sibling.
		if (insertIndex < orderWithoutDragged.length && isDraggable(insertIndex)) {
			return { id, placement: "before" as const, anchorId: orderWithoutDragged[insertIndex] };
		}
		if (insertIndex > 0 && isDraggable(insertIndex - 1)) {
			return { id, placement: "after" as const, anchorId: orderWithoutDragged[insertIndex - 1] };
		}
		return null;
	}

	private updateDragPosition() {
		if (!this.dragState || !this.snapshot) return;
		const rect = this.getBoundingClientRect();
		const axis = this.normalizedAxis;
		const item = this.snapshot.items.get(this.dragState.id);
		if (!item) return;
		const rawDeltaX = axis === "y" ? 0 : this.dragState.current.x - rect.left - this.dragState.start.x;
		const rawDeltaY = axis === "x" ? 0 : this.dragState.current.y - rect.top - this.dragState.start.y;
		const deltaX =
			axis === "y"
				? 0
				: this.clamp(rawDeltaX, -this.dragState.startCorner.x, this.snapshot.grid.width - this.dragState.startCorner.x - item.width);
		const deltaY =
			axis === "x"
				? 0
				: this.clamp(rawDeltaY, -this.dragState.startCorner.y, this.snapshot.grid.height - this.dragState.startCorner.y - item.height);
		this.resolve(this.dragState.id).style.transform = `translate(${deltaX}px, ${deltaY}px)`;

		// If there there is only one draggable item, it cannot be reordered
		let hasOtherDraggable = false;
		for (const [id, item] of this.snapshot.items) {
			if (id !== this.dragState.id && item.draggable) {
				hasOtherDraggable = true;
				break;
			}
		}
		if (!hasOtherDraggable) {
			this.releaseOrder = this.order;
			this.pendingReorder = null;
			return;
		}

		const orderWithoutDragged = this.order.filter(id => id != this.dragState!.id);
		let insertIndex = -1;
		let bestDistance = Infinity;

		const targetX = this.dragState.startCorner.x + deltaX;
		const targetY = this.dragState.startCorner.y + deltaY;

		for (const { index, x, y } of this.layoutPositions(orderWithoutDragged)) {
			// Prevent dropping between two non-draggable items
			const prevDraggable = index > 0 ? this.snapshot.items.get(orderWithoutDragged[index - 1])?.draggable : false;
			const nextDraggable =
				index < orderWithoutDragged.length ? this.snapshot.items.get(orderWithoutDragged[index])?.draggable : false;
			if (!prevDraggable && !nextDraggable) continue;

			const distance = Math.hypot(x - targetX, y - targetY);
			if (distance < bestDistance) {
				bestDistance = distance;
				insertIndex = index;
			}
		}

		if (insertIndex !== -1) {
			const newOrder = [...orderWithoutDragged];
			newOrder.splice(insertIndex, 0, this.dragState.id);
			this.animateToPosition(newOrder);
			this.releaseOrder = newOrder;
			this.pendingReorder = newOrder.every((id, index) => id === this.order[index])
				? null
				: this.createReorderDetail(this.dragState.id, orderWithoutDragged, insertIndex);
		}
	}

	private getMaxScrollY() {
		const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
		return Math.max(0, documentHeight - window.innerHeight);
	}

	private findScrollableContainer(axis: "x" | "y") {
		for (let element = this.parentElement; element; element = element.parentElement) {
			const style = window.getComputedStyle(element);
			const overflow = axis === "x" ? style.overflowX : style.overflowY;
			const canScroll = overflow === "auto" || overflow === "scroll" || overflow === "overlay";
			const hasOverflow = axis === "x" ? element.scrollWidth > element.clientWidth : element.scrollHeight > element.clientHeight;
			if (canScroll && hasOverflow) return element;
		}
		return null;
	}

	private updateAutoScroll(): boolean {
		if (!this.dragState) return false;

		const edgeSize = 80;
		const containerMargin = 120;
		const maxSpeed = 18;
		const axis = this.normalizedAxis;
		let didScroll = false;

		if (axis !== "y" && this.autoScrollContainer) {
			const pointerX = this.dragState.current.x;
			const pointerY = this.dragState.current.y;
			const containerRect = this.autoScrollContainer.getBoundingClientRect();

			if (pointerY >= containerRect.top - containerMargin && pointerY <= containerRect.bottom + containerMargin) {
				let scrollX = 0;
				if (pointerX < containerRect.left + edgeSize) {
					scrollX = -maxSpeed * ((containerRect.left + edgeSize - pointerX) / edgeSize);
				} else if (pointerX > containerRect.right - edgeSize) {
					scrollX = maxSpeed * ((pointerX - (containerRect.right - edgeSize)) / edgeSize);
				}

				if (scrollX !== 0) {
					const currentScrollLeft = this.autoScrollContainer.scrollLeft;
					const maxScrollLeft = this.autoScrollContainer.scrollWidth - this.autoScrollContainer.clientWidth;
					const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, currentScrollLeft + scrollX));
					if (nextScrollLeft !== currentScrollLeft) {
						this.autoScrollContainer.scrollLeft = nextScrollLeft;
						didScroll = true;
					}
				}
			}
		}

		if (axis === "x") return didScroll;

		const pointerY = this.dragState.current.y;
		const viewportHeight = window.innerHeight;
		const containerRect = this.getBoundingClientRect();

		if (pointerY < containerRect.top - containerMargin || pointerY > containerRect.bottom + containerMargin) {
			return didScroll;
		}

		let scrollY = 0;
		if (pointerY < edgeSize) {
			scrollY = -maxSpeed * ((edgeSize - pointerY) / edgeSize);
		} else if (pointerY > viewportHeight - edgeSize) {
			scrollY = maxSpeed * ((pointerY - (viewportHeight - edgeSize)) / edgeSize);
		}

		if (scrollY !== 0) {
			const currentScrollY = window.scrollY;
			const maxScrollY = this.autoScrollMaxScrollY ?? this.getMaxScrollY();
			const nextScrollY = Math.min(maxScrollY, Math.max(0, currentScrollY + scrollY));
			if (nextScrollY === currentScrollY) {
				return didScroll;
			}

			window.scrollTo(window.scrollX, nextScrollY);
			didScroll = true;
		}

		return didScroll;
	}

	private updateDragFrame() {
		this.dragFrame = null;
		if (!this.dragState) return;

		this.updateDragPosition();
		if (this.updateAutoScroll()) this.scheduleDragFrame();
	}

	private scheduleDragFrame() {
		if (this.state !== "dragging" || !this.dragState || this.dragFrame) return;
		this.dragFrame = requestAnimationFrame(() => this.updateDragFrame());
	}

	private stopDragFrame() {
		if (this.dragFrame !== null) cancelAnimationFrame(this.dragFrame);
		this.dragFrame = null;
		this.autoScrollContainer = null;
		this.autoScrollMaxScrollY = null;
	}

	private onPointerMove = (event: PointerEvent) => {
		if (this.state === "pending" && this.pendingDragState) {
			if (event.pointerId !== this.pendingDragState.pointerId) return;
			if (this.dragDistanceFromStart({ x: event.clientX, y: event.clientY }) < this.dragStartThreshold) return;
			this.startDrag(event);
			this.scheduleDragFrame();
			return;
		}

		if (this.state !== "dragging" || !this.snapshot || !this.dragState) return;
		if (event.pointerId !== this.dragState.pointerId) return;
		event.preventDefault();
		this.dragState.current = { x: event.clientX, y: event.clientY };
		this.scheduleDragFrame();
	};

	private onPointerUp = (event: PointerEvent) => {
		if (this.state === "pending" && this.pendingDragState) {
			if (event.pointerId !== this.pendingDragState.pointerId) return;
			this.pendingDragState = null;
			this.state = "idle";
			this.removePendingDragListeners();
			return;
		}

		if (this.state !== "dragging" || !this.dragState) return;
		if (event.pointerId !== this.dragState.pointerId) return;
		event.preventDefault();
		this.state = "settling";
		this.resolve(this.dragState.id).style.transition = DraggableGrid.TRANSITION;
		this.animateToPosition(this.releaseOrder);
		this.releaseOrder = [];
		this.dragState = null;
		this.suppressClick = true;
		this.stopDragFrame();
		try {
			this.releasePointerCapture(event.pointerId);
		} catch {
			// Pointer capture may already be gone after a lostpointercapture event.
		}
		setTimeout(() => {
			if (this.state === "settling") {
				this.state = "idle";
				for (const item of this.slotElements) {
					const element = this.resolve(item.id);
					element.style.transition = "";
					element.style.transform = "";
					element.style.zIndex = "";
					element.classList.remove("ww-dragging");
				}
				document.documentElement.style.cursor = this.previousDocumentCursor ?? "";
				this.previousDocumentCursor = null;
				if (this.pendingReorder) {
					this.dispatchEvent(new CustomEvent("reorder", { detail: this.pendingReorder }));
				}
				this.pendingReorder = null;
			}
		}, DraggableGrid.TRANSITION_MS);
	};

	private onScroll = () => {
		this.scheduleDragFrame();
	};

	private onClick = (event: MouseEvent) => {
		if (!this.suppressClick) return;
		this.suppressClick = false;
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	render() {
		return html`<slot></slot>`;
	}
}
