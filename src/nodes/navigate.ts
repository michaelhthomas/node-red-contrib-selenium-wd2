import { until } from "selenium-webdriver";
import { WD2Manager } from "../wd2-manager";
import { SeleniumMsg, SeleniumNode, SeleniumNodeDef } from "./node";

// tslint:disable-next-line: no-empty-interface
export interface NodeNavigateDef extends SeleniumNodeDef {
	url: string;
	navType: string;
}

// tslint:disable-next-line: no-empty-interface
export interface NodeNavigate extends SeleniumNode {}

export function NodeNavigateConstructor(
	this: NodeNavigate,
	conf: NodeNavigateDef
) {
	WD2Manager.RED.nodes.createNode(this, conf);
	this.status({});

	this.on("input", async (message: any, send, done) => {
		// Cheat to allow correct typing in typescript
		const msg: SeleniumMsg = message;
		const node = this;
		node.status({});
		if (msg.driver == null) {
			const error = new Error(
				"Open URL must be call before any other action. For node : " + conf.name
			);
			node.status({ fill: "red", shape: "ring", text: "error" });
			done(error);
		} else {
			const webTitle = msg.url ?? conf.url;
			const type = msg.navType ?? conf.navType;
			const url = msg.url ?? conf.url;
			const waitFor: number = parseInt(msg.waitFor ?? conf.waitFor, 10);
			setTimeout(async () => {
				try {
					node.status({ fill: "blue", shape: "ring", text: "loading" });
					switch (type) {
						case "forward":
							await msg.driver.navigate().forward();
							break;
						case "back":
							await msg.driver.navigate().back();
							break;
						case "refresh":
							await msg.driver.navigate().refresh();
							break;
						default:
							await msg.driver.navigate().to(url);
					}
					send([msg, null]);
					node.status({ fill: "green", shape: "dot", text: "success" });
					done();
				} catch (e) {
					if (WD2Manager.checkIfCritical(e)) {
						node.status({ fill: "red", shape: "dot", text: "critical error" });
						done(e);
					} else {
						const error = {
							message:
								"Can't navigate " + type + (type === "to") ? " : " + url : "",
						};
						node.warn(error.message);
						msg.error = error;
						node.status({
							fill: "yellow",
							shape: "dot",
							text: "navigate error",
						});
						send([null, msg]);
						done();
					}
				}
			}, waitFor);
		}
	});
}
