import { Socket } from "net";

type RecursiveObj = { [key: string]: RecursiveObj } | string | undefined;

function getValueFromPropertyNameRec(obj: RecursiveObj, listProp: string[]) {
	let res = obj;
	for (const prop of listProp) {
		if (typeof res !== "object" || !(prop in res)) break;
		res = res[prop];
		if (!res) break;
	}
	return res;
}

export function replaceVar(str: string, msg: RecursiveObj) {
	if (typeof str !== "string") return str;
	if (str.match(/^\{\{.*\}\}$/g)) {
		// if the string is in double brackets like {{ foo }}
		const s = str.substring(2, str.length - 2);
		const v = s.split(".");
		if (v.length < 2) return str;
		switch (v[0]) {
			case "msg":
				return getValueFromPropertyNameRec(msg, v.splice(1, v.length));
			default:
				return str;
		}
	} else {
		return str;
	}
}

export async function portCheck(host: string, port: number): Promise<boolean> {
	return new Promise<boolean>((resolve) => {
		const socket = new Socket();
		let status: boolean = false;
		// Socket connection established, port is open
		socket.on("connect", () => {
			status = true;
			socket.end();
		});
		socket.setTimeout(2000); // If no response, assume port is not listening
		socket.on("timeout", () => {
			socket.destroy();
			resolve(status);
		});
		socket.on("error", () => {
			resolve(status);
		});
		socket.on("close", () => {
			resolve(status);
		});
		socket.connect(port, host);
	});
}

export function isError(x: unknown): x is Error {
	return x != null && typeof x === "object" && x instanceof Error;
}
