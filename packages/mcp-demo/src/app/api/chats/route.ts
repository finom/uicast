import { json } from "@/lib/api";
import { read } from "@/store";

export async function GET() {
  return json([...read().chats].sort((a, b) => b.createdAt - a.createdAt));
}
