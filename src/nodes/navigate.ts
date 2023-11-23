import { WD2Manager } from "../wd2-manager";
import { SeleniumNode, SeleniumNodeDef, assertIsSeleniumMessage } from "./node";
import { NodeMessageInFlow } from "node-red";
import { isError } from "../utils";

export interface NodeNavigateDef extends SeleniumNodeDef {
	url: string;
	navType: string;
}

export interface NodeNavigate extends SeleniumNode {}

export function NodeNavigateConstructor(
	this: NodeNavigate,
	conf: NodeNavigateDef
) {
	WD2Manager.RED.nodes.createNode(this, conf);
	this.status({});

	this.on("input", (msg: NodeMessageInFlow, send, done) => {
		assertIsSeleniumMessage(msg);

		this.status({});
		if (msg.driver == null) {
			const error = new Error(
				"Open URL must be call before any other action. For node : " + conf.name
			);
			this.status({ fill: "red", shape: "ring", text: "error" });
			done(error);
		} else {
			const type = msg.navType ?? conf.navType;
			const url = msg.url ?? conf.url;
			const waitFor: number = parseInt(msg.waitFor ?? conf.waitFor, 10);
			setTimeout(async () => {
				try {
					this.status({ fill: "blue", shape: "ring", text: "loading" });
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
					this.status({ fill: "green", shape: "dot", text: "success" });
					done();
				} catch (e) {
					if (isError(e) && WD2Manager.checkIfCritical(e)) {
						this.status({ fill: "red", shape: "dot", text: "critical error" });
						done(e);
					} else {
						const error = {
							message:
								"Can't navigate " + type + (type === "to") ? " : " + url : "",
						};
						this.warn(error.message);
						msg.error = error;
						this.status({
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
