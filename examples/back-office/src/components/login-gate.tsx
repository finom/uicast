import { LogIn } from "lucide-react";
import { Button } from "@uicast/shadcn-catalog/ui/button";

export function LoginGate({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      <Button asChild className="h-11 px-6 text-base">
        <a href="/api/auth/login">
          <LogIn />
          Log in with OpenRouter
        </a>
      </Button>
    </div>
  );
}
