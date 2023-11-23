import { isError } from "../utils";
import { WD2Manager } from "../wd2-manager";
import { SeleniumAction, SeleniumNode, SeleniumNodeDef } from "./node";
import { GenericSeleniumConstructor } from "./node-constructor";

export interface NodeRunScriptDef extends SeleniumNodeDef {
	script: string;
}

export interface NodeRunScript extends SeleniumNode {}

async function inputAction(
	node: NodeRunScript,
	conf: NodeRunScriptDef,
	action: SeleniumAction
): Promise<void> {
	return new Promise<void>(async (resolve, reject) => {
		const msg = action.msg;
		const script = msg.script ?? conf.script;
		try {
			msg.payload = await msg.driver.executeScript(script, msg.element);
			node.status({ fill: "green", shape: "dot", text: "success" });
			if (msg.error) {
				delete msg.error;
			}
			action.send([msg, null]);
			action.done();
		} catch (err) {
			if (isError(err) && WD2Manager.checkIfCritical(err)) {
				reject(err);
			} else {
				const errorMessage =
					"Can't run script on the the element : " +
					(isError(err) ? err.message : String(err));
				msg.error = {
					message: errorMessage,
				};
				node.warn(errorMessage);
				node.status({ fill: "yellow", shape: "dot", text: "run script error" });
				action.send([null, msg]);
				action.done();
			}
		}
		resolve();
	});
}

const NodeRunScriptConstructor = GenericSeleniumConstructor(null, inputAction);

export { NodeRunScriptConstructor };
