import { NodeMessage } from "node-red";
import { WDManager } from "../wd-manager";
import {
	SeleniumAction,
	SeleniumMsg,
	SeleniumNode,
	SeleniumNodeDef,
} from "./node";
import { GenericSeleniumConstructor } from "./node-constructor";
import { isError } from "../utils";

export interface NodeClickOnDef extends SeleniumNodeDef {
	clickOn?: boolean;
}

export interface NodeClickOn extends SeleniumNode {
	__msg: SeleniumMsg;
}

async function inputPreCondAction(
	node: NodeClickOn,
	conf: NodeClickOnDef,
	action: SeleniumAction
): Promise<boolean> {
	let msg = action.msg;
	if (msg.click && node.__msg) {
		msg = node.__msg; // msg restoration
		try {
			await msg.element.click();
			node.status({ fill: "green", shape: "dot", text: "success" });
			if (msg.error) {
				delete msg.error;
			}
			action.send([msg, null]);
			action.done();
		} catch (err) {
			if (!isError(err) || WDManager.checkIfCritical(err)) {
				throw err;
			} else {
				msg.error = {
					value: "Can't click on the the element: " + err.message,
				};
				node.status({ fill: "yellow", shape: "dot", text: "click error" });
				action.send([null, msg]);
				action.done();
			}
		}
		return false; // We don't want to execute the full node
	}
	if (msg.click && !node.__msg) {
		node.status({ fill: "yellow", shape: "ring", text: "ignored" });
		setTimeout(() => {
			node.status({});
		}, 3000);
		return false;
	}
	return true;
}

async function inputAction(
	node: NodeClickOn,
	conf: NodeClickOnDef,
	action: SeleniumAction
): Promise<void> {
	const msg = action.msg;

	if (!conf.clickOn) {
		try {
			await msg.element.click();
			node.status({ fill: "green", shape: "dot", text: "success" });
			if (msg.error) {
				delete msg.error;
			}
			action.send([msg, null]);
			action.done();
		} catch (err) {
			if (!isError(err) || WDManager.checkIfCritical(err)) {
				throw err;
			} else {
				msg.error = {
					value: "Can't click on the the element : " + err.message,
				};
				node.status({ fill: "yellow", shape: "dot", text: "click error" });
				action.send([null, msg]);
				action.done();
			}
		}
	} else {
		// If we have to wait for the user click and we save the msg
		node.status({
			fill: "blue",
			shape: "dot",
			text: "waiting for user click",
		});
		node.__msg = msg;
	}
}

const NodeClickOnConstructor = GenericSeleniumConstructor(
	inputPreCondAction,
	inputAction
);

export { NodeClickOnConstructor };

export function NodeClickPrerequisite() {
	WDManager.RED.httpAdmin.post(
		"/onclick/:id",
		WDManager.RED.auth.needsPermission("inject.write"),
		(req, res) => {
			const node = WDManager.RED.nodes.getNode(req.params.id);
			if (node != null) {
				try {
					node.receive({ click: true } as NodeMessage);
					res.sendStatus(200);
				} catch (err) {
					res.sendStatus(500);
					if (isError(err))
						node.error(
							WDManager.RED._("inject.failed", {
								error: err.toString(),
							})
						);
				}
			} else {
				res.sendStatus(404);
			}
		}
	);
}
