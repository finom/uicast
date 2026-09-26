import { getSessionUser } from "@/lib/auth";
import { LoginGate } from "@/components/login-gate";
import { NewPageForm } from "./new-page-form";

export const dynamic = "force-dynamic";

export default async function NewPage() {
  const me = await getSessionUser();
  if (!me) return <LoginGate what="create pages" />;
  return <NewPageForm />;
}
