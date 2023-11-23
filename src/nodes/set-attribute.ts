import { isError } from "../utils";
import { WDManager } from "../wd-manager";
import { SeleniumAction, SeleniumNode, SeleniumNodeDef } from "./node";
import { GenericSeleniumConstructor } from "./node-constructor";

export interface NodeSetAttributeDef extends SeleniumNodeDef {
	attribute: string;
	value: string;
}

export interface NodeSetAttribute extends SeleniumNode {}

async function inputAction(
	node: NodeSetAttribute,
	conf: NodeSetAttributeDef,
	action: SeleniumAction
): Promise<void> {
	return new Promise<void>(async (resolve, reject) => {
		const msg = action.msg;
		const attribute = msg.attribute ?? conf.attribute;
		const value = msg.value ?? conf.value;
		try {
			await msg.driver.executeScript(
				"arguments[0].setAttribute(" + "'" + attribute + "', '" + value + "')",
				msg.element
			);
			node.status({ fill: "green", shape: "dot", text: "success" });
			if (msg.error) {
				delete msg.error;
			}
			action.send([msg, null]);
			action.done();
		} catch (err) {
			if (isError(err) && WDManager.checkIfCritical(err)) {
				reject(err);
			} else {
				const errorMessage =
					"Can't send keys on the the element: " +
					(isError(err) ? err.message : String(err));

				msg.error = {
					message: errorMessage,
				};
				node.warn(errorMessage);
				node.status({
					fill: "yellow",
					shape: "dot",
					text: "expected value error",
				});
				action.send([null, msg]);
				action.done();
			}
		}
		resolve();
	});
}

const NodeSetAttributeConstructor = GenericSeleniumConstructor(
	null,
	inputAction
);

export { NodeSetAttributeConstructor };
