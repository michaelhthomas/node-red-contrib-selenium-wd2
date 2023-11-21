import { SeleniumAction, SeleniumNode, SeleniumNodeDef } from "./node";
import { GenericSeleniumConstructor } from "./node-constructor";

// tslint:disable-next-line: no-empty-interface
export interface NodeFindElementDef extends SeleniumNodeDef {}

// tslint:disable-next-line: no-empty-interface
export interface NodeFindElement extends SeleniumNode {}

async function inputAction(
	node: NodeFindElement,
	conf: NodeFindElementDef,
	action: SeleniumAction
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const msg = action.msg;
		node.status({ fill: "green", shape: "dot", text: "success" });
		if (msg.error) {
			delete msg.error;
		}
		action.send([msg, null]);
		action.done();
		resolve();
	});
}

const NodeFindElementConstructor = GenericSeleniumConstructor(
	null,
	inputAction
);

export { NodeFindElementConstructor };
