# node-red-contrib-selenium-wd3

Selenium WebDriver nodes for Node-RED, allowing web browser automation using the [Selenium-Webdriver](https://www.selenium.dev/documentation/) API. Based on the [node-red-constrib-selenium-webdriver](https://flows.nodered.org/node/node-red-contrib-selenium-webdriver) library, it was rewritten in Typescript to ease its maintenance, improve the overall stability and upgrade a little bit the set of features.

![wd2 workflow example](https://raw.githubusercontent.com/michaelhthomas/node-red-contrib-selenium-wd3/master/doc/img/workflow.png "wd2 workflow example")

## Prerequisites

To use `node-red-contrib-selenium-wd3`, you must fulfill the following prerequisites:

- Install Java 8 or later
- Install a Selenium server:
  ```sh
  npm install webdriver-manager
  ```
- Install a Node-RED server:
  ```sh
  npm install --unsafe-perm node-red
  ```

## Installation

- Install the `node-red-contrib-selenium-wd3` library:

  ```sh
  npm install node-red-contrib-selenium-wd3
  ```

- Profit

## Run

Launch Node-red `node-red` and the selenium-wd3 will be loaded automatically. You should see the list of nodes under the WebDriver section.

![wd2 section overview](https://raw.githubusercontent.com/michaelhthomas/node-red-contrib-selenium-wd3/master/doc/img/wd2.png "wd2 section")

## Develop

If you want to contribute, you can clone the project and run the following command:

- `npm run clean && npm run prepublishOnly` (linux only)

To test it, you will have to:

- Install a node-red locally (in another folder) `npm install -g node-red`
- Launch, from the `node-red` folder, the following command to debug :

  `npm install [PATH_TO_SELENIUM_WD2] && node --inspect node_modules/node-red/red.js`

## Behavior

Each automation flow must begin with an "Open Web" node.

Some nodes will provide two outputs: success and failure

- The success output is used if the node execution is successful and the flow execution can continue (i.e. the driver is still ok)
- The failure output is used in case of a "soft" error (an element can't be found or an expected value is not correct). It aims to support expected use cases. (If something can't be clicked or found)
- Error is launched in case of a "critical" error (i.e. the driver can't be used anymore). These errors must be handled manually, and the driver must be cleaned up.

## Documentation

All nodes provide documentation directly inside Node-RED.

![wd2 help overview](https://raw.githubusercontent.com/michaelhthomas/node-red-contrib-selenium-wd3/master/doc/img/node-help.png "wd2 help")
