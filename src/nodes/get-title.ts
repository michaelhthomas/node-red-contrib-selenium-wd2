import { until } from "selenium-webdriver";
import { WD2Manager } from "../wd2-manager";
import { SeleniumNode, SeleniumNodeDef, assertIsSeleniumMessage } from "./node";
import { NodeMessageInFlow } from "node-red";
import { isError, toError } from "../utils";

export interface NodeGetTitleDef extends SeleniumNodeDef {
	expected: string;
}

export interface NodeGetTitle extends SeleniumNode {}

export function NodeGetTitleConstructor(
	this: NodeGetTitle,
	conf: NodeGetTitleDef
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
			const expected = msg.expected ?? conf.expected;
			const waitFor: number = parseInt(msg.waitFor ?? conf.waitFor, 10);
			const timeout: number = parseInt(msg.timeout ?? conf.timeout, 10);
			setTimeout(async () => {
				if (expected && expected !== "") {
					try {
						await msg.driver.wait(until.titleIs(expected), timeout);
						send([msg, null]);
						this.status({ fill: "green", shape: "dot", text: "success" });
						done();
					} catch (e) {
						if (isError(e) && WD2Manager.checkIfCritical(e)) {
							this.status({
								fill: "red",
								shape: "dot",
								text: "critical error",
							});
							done(e);
						} else {
							try {
								msg.payload = await msg.driver.getTitle();
							} catch {
								msg.payload = "[Unknown]";
							}
							const error = {
								message:
									"Browser windows title does not have the expected value",
								expected,
								found: msg.webTitle,
							};
							this.warn(error.message);
							msg.error = error;
							this.status({
								fill: "yellow",
								shape: "dot",
								text: "wrong title",
							});
							send([null, msg]);
							done();
						}
					}
				} else {
					try {
						msg.payload = await msg.driver.getTitle();
						this.status({ fill: "green", shape: "dot", text: "success" });
						if (msg.error) {
							delete msg.error;
						}
						send([msg, null]);
						done();
					} catch (e) {
						this.status({ fill: "red", shape: "dot", text: "error" });
						this.error(
							"Can't get title of the browser window. Check msg.error for more information"
						);
						done(toError(e));
					}
				}
			}, waitFor);
		}
	});
}
