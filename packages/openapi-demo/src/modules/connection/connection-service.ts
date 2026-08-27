import { desc, eq } from "drizzle-orm";
import { HttpException, HttpStatus, type VovkBody, type VovkParams } from "vovk";
import { deriveConnectionTools } from "@/connections/derive";
import { db } from "@/db";
import { type Connection, connections } from "@/db/schema";
import type ConnectionController from "./connection-controller";

/**
 * Connections are created by the model, not by a settings screen: the user says
 * "connect Stripe", the model recalls the OpenAPI document URL and how the API
 * authenticates, and renders a form whose Save calls `createConnection`.
 */
export default class ConnectionService {
  /**
   * Never returns the credential. The list feeds the sidebar and the model's own
   * view of what is connected, and neither needs the secret — only whether one
   * is set.
   */
  static getConnections = async () => {
    const rows = await db.select().from(connections).orderBy(desc(connections.createdAt));
    return rows.map(toPublic);
  };

  static getConnection = async (id: VovkParams<typeof ConnectionController.getConnection>["id"]) => {
    const [row] = await db
      .select()
      .from(connections)
      .where(eq(connections.id, Number(id)));
    if (!row) throw new HttpException(HttpStatus.NOT_FOUND, "No such connection");
    return toPublic(row);
  };

  /**
   * Connect an API, or repair an existing connection under the same name.
   *
   * The document URL comes from the model's own recall, which is the weak link:
   * a plausible-looking URL that 404s would otherwise be stored, report success,
   * and derive nothing — the connection would look healthy and do nothing. So
   * the spec is fetched and converted BEFORE the row is written, and a failure
   * comes back as an error the model can act on in the same turn.
   *
   * The write is an upsert on `name` because correcting a wrong URL is the
   * expected second step, not a conflict.
   */
  static createConnection = async (
    body: VovkBody<typeof ConnectionController.createConnection>,
  ) => {
    const candidate: Connection = {
      id: -1,
      name: body.name,
      openapiUrl: body.openapiUrl,
      authType: body.authType,
      authName: body.authName ?? null,
      authPrefix: body.authPrefix ?? null,
      credential: body.credential ?? null,
      createdAt: new Date(),
    };

    let operations: string[];
    try {
      const { tools } = await deriveConnectionTools(candidate);
      operations = tools.map((tool) => tool.name);
    } catch (error) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        `Could not read the OpenAPI document at ${body.openapiUrl}: ${
          error instanceof Error ? error.message : String(error)
        }. Check the URL — it must point at the specification document itself, not the documentation page.`,
      );
    }

    if (operations.length === 0) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        `The document at ${body.openapiUrl} parsed but describes no operations.`,
      );
    }

    const values = {
      name: candidate.name,
      openapiUrl: candidate.openapiUrl,
      authType: candidate.authType,
      authName: candidate.authName,
      authPrefix: candidate.authPrefix,
      credential: candidate.credential,
    };
    const [row] = await db
      .insert(connections)
      .values(values)
      .onConflictDoUpdate({ target: connections.name, set: values })
      .returning();

    return { ...toPublic(row), operations };
  };

  static deleteConnection = async (
    id: VovkParams<typeof ConnectionController.deleteConnection>["id"],
  ) => {
    const [row] = await db
      .delete(connections)
      .where(eq(connections.id, Number(id)))
      .returning({ id: connections.id });
    if (!row) throw new HttpException(HttpStatus.NOT_FOUND, "No such connection");
    return { id: row.id };
  };
}

/** The only shape that leaves the server — structurally cannot carry a secret. */
function toPublic(row: Connection) {
  return {
    id: row.id,
    name: row.name,
    openapiUrl: row.openapiUrl,
    authType: row.authType,
    authName: row.authName,
    configured: Boolean(row.credential),
    createdAt: row.createdAt.toISOString(),
  };
}
