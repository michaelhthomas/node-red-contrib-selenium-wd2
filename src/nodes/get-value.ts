import { Node, NodeDef, nodes } from "node-red"
import { By, until, WebDriver } from "selenium-webdriver";
import { WD2Manager } from "../wd2-manager";
import { SeleniumMsg, SeleniumNode, waitForElement } from "./node";

export interface NodeGetValueDef extends NodeDef, SeleniumNode {
    expected : string;
}

export interface NodeGetValue extends Node<any> {

}

export function NodeGetValueConstructor (this : NodeGetValue, conf : NodeGetValueDef) {
    WD2Manager.RED.nodes.createNode(this, conf);
    this.status({});    
    
    this.on("input", async (message : any, send, done) => {
        // Cheat to allow correct typing in typescript
        let msg : SeleniumMsg = message;
        let node = this;
        this.status({});    
        if (msg.driver == null) {
            let error = new Error("Open URL must be call before any other action. For node : " + conf.name);
            this.status({ fill : "red", shape : "ring", text : "error"});
            done(error);
        } else {
            let expected = msg.expected ?? conf.expected;
            waitForElement(conf, msg).subscribe ({
                next (val)  {
                    if (typeof val === "string") {
                        node.status({ fill : "blue", shape : "dot", text : val});
                    } else {
                        msg.element = val;
                    }
                },
                error(err) {
                    if (WD2Manager.checkIfCritical(err)) {
                        node.status({ fill : "red", shape : "dot", text : "critical error"});
                        done(err);
                    } else {    
                        node.status({ fill : "yellow", shape : "dot", text : "location error"});
                        msg.error = err;
                        send([null, msg]);
                        done();
                    }
                },
                async complete () {
                    node.status({ fill : "blue", shape : "dot", text : "located"});
                    let step = "";
                    try {
                        msg.payload = await msg.element.getAttribute("value");
                        if (expected && expected !== msg.payload) {
                            msg.error = {
                                message : "Expected value is not aligned, expected : " + expected + ", value : " + msg.payload
                            };
                            node.status({ fill : "yellow", shape : "dot", text : step + "error"})
                            send([null, msg]);
                            done();                           
                        } else {
                            node.status({ fill : "green", shape : "dot", text : "success"})
                            if (msg.error) { delete msg.error; }
                            send([msg, null]);
                            done();
                        }
                    } catch(err) {
                        if (WD2Manager.checkIfCritical(err)) {
                            node.status({ fill : "red", shape : "dot", text : "critical error"});
                            done(err);
                        } else {
                            msg.error = {
                                message : "Can't send keys on the the element : " + err.message
                            };
                            node.status({ fill : "yellow", shape : "dot", text : step + "error"})
                            send([null, msg]);
                            done();
                        }
                    }
                }
            });
        }
    });

	WD2Manager.RED.httpAdmin.post("/onclick/:id", WD2Manager.RED.auth.needsPermission("inject.write"), function(req, res) {
		var node = WD2Manager.RED.nodes.getNode(req.params.id);
		if (node != null) {
			try {
                //@ts-ignore
				node.receive({ click : true });
				res.sendStatus(200);
			} catch(err) {
				res.sendStatus(500);
				node.error(WD2Manager.RED._("inject.failed", {
					error : err.toString()
				}));
			}
		} else {
			res.sendStatus(404);
		}
	});
}