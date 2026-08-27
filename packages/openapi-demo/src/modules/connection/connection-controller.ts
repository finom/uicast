import { del, get, operation, post, prefix, procedure } from "vovk";
import { z } from "zod";
import ConnectionService from "./connection-service";

/** The only shape that leaves the server — structurally cannot carry a credential. */
const connectionPublic = z.object({
  id: z.number().int(),
  name: z.string().meta({ description: "Short identifier, and the prefix of every derived tool name." }),
  openapiUrl: z.string().meta({ description: "URL of the API's OpenAPI document." }),
  authType: z.enum(["none", "header", "query"]),
  authName: z.string().nullable().meta({ description: "Header or query parameter carrying the credential." }),
  configured: z.boolean().meta({ description: "Whether a credential is stored. The credential itself is never returned." }),
  createdAt: z.string(),
});

const connectionBody = z.object({
  name: z
    .string()
    .min(1)
    .max(40)
    // Prefixes every derived tool name, and a uicast expression calls a host
    // function by bare identifier — `stripe-api_listCharges` would not parse.
    .regex(/^[A-Za-z][A-Za-z0-9_]*$/)
    .meta({ description: "Short identifier for the API, e.g. `stripe`." }),
  openapiUrl: z.string().url().meta({ description: "URL of the API's OpenAPI document." }),
  authType: z
    .enum(["none", "header", "query"])
    .meta({ description: "How the credential travels with each request." }),
  authName: z
    .string()
    .nullish()
    .meta({ description: "Header or query parameter name, e.g. `Authorization`." }),
  authPrefix: z.string().nullish().meta({ description: "Prepended to the credential, e.g. `Bearer `." }),
  credential: z.string().nullish().meta({ description: "The API key or token itself." }),
});

@prefix("connections")
export default class ConnectionController {
  @operation({ summary: "List connected APIs" })
  @get()
  static getConnections = procedure({
    output: z.array(connectionPublic),
  }).handle(() => ConnectionService.getConnections());

  @operation({ summary: "Get one connected API" })
  @get("{id}")
  static getConnection = procedure({
    params: z.object({ id: z.string() }),
    output: connectionPublic,
  }).handle((_req, { id }) => ConnectionService.getConnection(id));

  @operation({
    summary: "Connect an API",
    description:
      "Stores the OpenAPI document URL and how the API authenticates. Called from the connection form the model generates, so its shape is what the model is taught to fill in.",
  })
  @post()
  static createConnection = procedure({
    body: connectionBody,
    output: connectionPublic.extend({
      operations: z.array(z.string()).meta({
        description:
          "The operations this API now exposes. They become callable functions on the next turn, not this one.",
      }),
    }),
  }).handle(async (req) => ConnectionService.createConnection(await req.json()));

  @operation({ summary: "Disconnect an API" })
  @del("{id}")
  static deleteConnection = procedure({
    params: z.object({ id: z.string() }),
    output: z.object({ id: z.number().int() }),
  }).handle((_req, { id }) => ConnectionService.deleteConnection(id));
}
