import { NodeMessageInFlow } from "node-red";
import { WDManager } from "../wd-manager";
import { SeleniumNode, SeleniumNodeDef, assertIsSeleniumMessage } from "./node";
import * as fs from "fs/promises";
import { isError } from "../utils";

export interface NodeScreenshotDef extends SeleniumNodeDef {
	filePath: string;
}

export interface NodeScreenshot extends SeleniumNode {}

export function NodeScreenshotConstructor(
	this: NodeScreenshot,
	conf: NodeScreenshotDef
) {
	WDManager.RED.nodes.createNode(this, conf);
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
			const waitFor: number = parseInt(msg.waitFor ?? conf.waitFor, 10);
			const filePath: string = msg.filePath ?? conf.filePath;
			setTimeout(async () => {
				try {
					const sc = await msg.driver.takeScreenshot();
					if (filePath) await fs.writeFile(filePath, sc, "base64");
					msg.payload = sc;
					send([msg, null]);
					this.status({ fill: "green", shape: "dot", text: "success" });
					done();
				} catch (e) {
					if (isError(e) && WDManager.checkIfCritical(e)) {
						this.status({ fill: "red", shape: "dot", text: "critical error" });
						done(e);
					} else {
						const error = { message: "Can't take a screenshot" };
						this.warn(error.message);
						msg.error = error;
						this.status({
							fill: "yellow",
							shape: "dot",
							text: "screenshot error",
						});
						send([null, msg]);
						done();
					}
				}
			}, waitFor);
		}
	});
}
