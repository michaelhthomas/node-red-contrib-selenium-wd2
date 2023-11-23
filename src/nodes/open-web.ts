import { NodeMessageInFlow } from "node-red";
import { WDManager } from "../wd-manager";
import { SeleniumMsg, SeleniumNode, SeleniumNodeDef } from "./node";
import { toError } from "../utils";

export interface NodeOpenWebDef extends SeleniumNodeDef {
	serverURL: string;
	name: string;
	browser: string;
	webURL: string;
	width: number;
	height: number;
	maximized: boolean;
	headless: boolean;
}

export interface NodeOpenWeb extends SeleniumNode {}

export function NodeOpenWebConstructor(
	this: NodeOpenWeb,
	conf: NodeOpenWebDef
) {
	WDManager.RED.nodes.createNode(this, conf);

	if (!conf.serverURL) {
		this.log("Selenium server URL is undefined");
		this.status({ fill: "red", shape: "ring", text: "no server defined" });
	} else {
		WDManager.setServerConfig(conf.serverURL)
			.then((result) => {
				if (result) {
					this.log(conf.serverURL + " is reachable by Node-RED");
					this.status({
						fill: "green",
						shape: "ring",
						text: conf.serverURL + ": reachable",
					});
				} else {
					this.log(conf.serverURL + " is not reachable by Node-RED");
					this.status({
						fill: "red",
						shape: "ring",
						text: conf.serverURL + ": unreachable",
					});
				}
			})
			.catch((error) => {
				this.log(error);
			});
	}
	this.on("input", async (message: NodeMessageInFlow, send, done) => {
		let driverError = false;
		const msg: SeleniumMsg = {
			...message,
			driver: WDManager.getDriver(conf),
		};
		this.status({ fill: "blue", shape: "ring", text: "opening browser" });
		try {
			await msg.driver.get(conf.webURL);
		} catch (e) {
			msg.driver = null;
			this.error("Can't open an instance of " + conf.browser);
			this.status({ fill: "red", shape: "ring", text: "launch error" });
			driverError = true;
			msg.driver = null;
			done(toError(e));
		}
		try {
			if (msg.driver) {
				if (!driverError)
					if (!conf.headless)
						if (!conf.maximized)
							await msg.driver
								.manage()
								.window()
								.setSize(conf.width, conf.height);
						else await msg.driver.manage().window().maximize();
				send(msg);
				this.status({ fill: "green", shape: "dot", text: "success" });
				done();
			}
		} catch (e) {
			this.error("Can't resize the instance of " + conf.browser);
			this.status({ fill: "red", shape: "ring", text: "resize error" });
			driverError = true;
			done(toError(e));
		}
	});
}
