/** @type {import('vovk').VovkConfig} */
const vovkConfig = {
  modulesDir: "./src/modules",
  schemaOutDir: "./.vovk-schema",
  rootEntry: "api",
  composedClient: {
    fromTemplates: ["ts"],
    outDir: "./src/generated-client",
  },
  // Scaffolding templates are unused here — modules are written by hand.
  moduleTemplates: {
    service: "none",
    controller: "none",
  },
  outputConfig: {
    openAPIObject: {
      info: {
        title: "uicast OpenAPI demo",
        description:
          "The demo's own API. Because it is built from Vovk controllers, `vovk generate` emits an OpenAPI document for it — which the app can then connect to as an API like any other.",
        version: "0.0.0",
      },
    },
  },
};

export default vovkConfig;
