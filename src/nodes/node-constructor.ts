import { Node, NodeMessageInFlow } from "node-red";
import { WDManager } from "../wd-manager";
import {
	SeleniumAction,
	SeleniumNodeDef,
	assertIsSeleniumMessage,
	waitForElement,
} from "./node";
import { isError, toError } from "../utils";

export function GenericSeleniumConstructor<
	TNode extends Node<unknown>,
	TNodeDef extends SeleniumNodeDef
>(
	inputPreCondAction: (
		node: TNode,
		conf: TNodeDef,
		action: SeleniumAction
	) => Promise<boolean>,
	inputAction: (
		node: TNode,
		conf: TNodeDef,
		action: SeleniumAction
	) => Promise<void>,
	nodeCreation: () => void = null
) {
	return function (this: TNode, conf: TNodeDef): void {
		WDManager.RED.nodes.createNode(this, conf);

		this.status({});
		this.on("input", async (msg: NodeMessageInFlow, send, done) => {
			assertIsSeleniumMessage(msg);

			const action: SeleniumAction = { msg, send, done };
			this.status({});
			try {
				if (
					!inputPreCondAction ||
					(await inputPreCondAction(this, conf, action))
				) {
					if (msg.driver == null) {
						const error = new Error(
							"Open URL must be call before any other action. For node : " +
								conf.name
						);
						this.status({ fill: "red", shape: "ring", text: "error" });
						done(error);
					} else {
						// If InputPreCond return false, next steps will not be executed
						waitForElement(conf, msg).subscribe({
							next: (val) => {
								if (typeof val === "string") {
									this.status({ fill: "blue", shape: "dot", text: val });
								} else {
									msg.element = val;
								}
							},
							error: (err) => {
								if (isError(err) && WDManager.checkIfCritical(err)) {
									this.status({
										fill: "red",
										shape: "dot",
										text: "critical error",
									});
									this.error(err.toString());
									done(err);
								} else {
									this.status({
										fill: "yellow",
										shape: "dot",
										text: "location error",
									});
									msg.error = err;
									send([null, msg]);
									done();
								}
							},
							complete: async () => {
								this.status({ fill: "blue", shape: "dot", text: "located" });
								try {
									await inputAction(this, conf, action);
								} catch (e) {
									this.status({
										fill: "red",
										shape: "dot",
										text: "critical error",
									});
									this.error(String(e));
									delete msg.driver;
									done(toError(e));
								}
							},
						});
					}
				}
			} catch (e) {
				this.status({ fill: "red", shape: "dot", text: "critical error" });
				this.error(String(e));
				delete msg.driver;
				done(toError(e));
			}
		});
		// Activity to do during Node Creation
		if (nodeCreation) nodeCreation();
	};
}
