import { BySelector } from "./nodes/node";

export class ElementSelectorError extends Error {
	name = "ElementSelectorError";
	selector: BySelector;
	target: string;

	constructor({
		message,
		selector,
		target,
	}: {
		message?: string;
		selector?: BySelector | "";
		target?: string;
	}) {
		super(message);
		this.selector = selector != "" ? selector : undefined;
		this.target = target;
	}
}
