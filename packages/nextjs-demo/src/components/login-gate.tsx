import { LogIn } from "lucide-react";
import { Button } from "@uicast/shadcn-catalog/ui/button";

export function LoginGate({ what }: { what: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-lg font-semibold">Log in to {what}</h1>
        <p className="text-sm text-muted-foreground">
          OpenRouter authorizes an API key for this demo — generations run on your own credits, and you get a private
          copy of the demo data to build against.
        </p>
        <Button asChild>
          <a href="/api/auth/login">
            <LogIn data-icon="inline-start" />
            Log in with OpenRouter
          </a>
        </Button>
      </div>
    </div>
  );
}
