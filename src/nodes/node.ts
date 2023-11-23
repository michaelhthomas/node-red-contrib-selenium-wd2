import { NodeMessageInFlow } from "node-red__registry";
import { Node, NodeDef, NodeMessage } from "node-red";
import { Observable } from "rxjs";
import { By, until, WebDriver, WebElement } from "selenium-webdriver";
import { isError } from "../utils";
import { ElementSelectorError } from "../errors";

export * from "./open-web";
export * from "./close-web";
export * from "./find-element";
export * from "./get-title";
export * from "./click-on";
export * from "./send-keys";
export * from "./get-value";
export * from "./set-value";
export * from "./get-attribute";
export * from "./get-text";
export * from "./run-script";
export * from "./screenshot";
export * from "./set-attribute";

export type BySelector = Exclude<keyof typeof By, "prototype">;

export interface SeleniumNodeDef extends NodeDef {
	selector: BySelector | "";
	target: string;
	// Node-red only push string from properties if modified by user
	timeout: string;
	waitFor: string;
}

export interface SeleniumNode extends Node {}

export interface SeleniumAction {
	done: (err?: Error) => void;
	send: (msg: NodeMessage | NodeMessage[]) => void;
	msg: SeleniumMsg;
}

export interface SeleniumMsg extends NodeMessageInFlow {
	driver: WebDriver | null;
	selector?: BySelector;
	// Node-red only push string from properties if modified by user
	target?: string;
	timeout?: string;
	waitFor?: string;
	error?: unknown;
	element?: WebElement;
	webTitle?: string;
	click?: boolean;
	clearVal?: boolean;
	keys?: string;
	value?: string;
	expected?: string;
	attribute?: string;
	script?: string;
	url?: string;
	navType?: string;
	filePath?: string;
}

export function assertIsSeleniumMessage(
	msg: NodeMessageInFlow
): asserts msg is SeleniumMsg {
	if (!("driver" in msg))
		throw new Error(
			"Can't use this node without a working open-web node first"
		);
}

/**
 * Wait for the location of an element based on a target & selector.
 * @param driver A valid WebDriver instance
 * @param conf A configuration of a node
 * @param msg  A node message
 */
export function waitForElement(
	conf: SeleniumNodeDef,
	msg: SeleniumMsg
): Observable<string | WebElement> {
	return new Observable<string | WebElement>((subscriber) => {
		const waitFor: number = parseInt(msg.waitFor ?? conf.waitFor, 10);
		const timeout: number = parseInt(msg.timeout ?? conf.timeout, 10);
		const target: string = msg.target ?? conf.target;
		const selector: BySelector | "" = msg.selector ?? conf.selector;
		let element: WebElement;
		subscriber.next("waiting for " + (waitFor / 1000).toFixed(1) + " s");
		setTimeout(async () => {
			try {
				subscriber.next("locating");
				if (selector !== "") {
					element = await msg.driver.wait(
						until.elementLocated(By[selector](target)),
						timeout
					);
				} else {
					if (msg.element) {
						element = msg.element;
					}
				}
				subscriber.next(element);
				subscriber.complete();
			} catch (e) {
				let error: ElementSelectorError;
				if (isError(e) && e.toString().includes("TimeoutError"))
					error = new ElementSelectorError({
						message:
							"catch timeout after " +
							timeout +
							" milliseconds for selector type " +
							selector +
							" for  " +
							target,
						selector,
						target,
					});
				else if (isError(e))
					error = new ElementSelectorError({
						message: e.message,
						selector,
						target,
					});
				else
					error = new ElementSelectorError({
						message: "an unknown error occurred: " + String(e),
						selector,
						target,
					});

				subscriber.error(error);
			}
		}, waitFor);
	});
}
