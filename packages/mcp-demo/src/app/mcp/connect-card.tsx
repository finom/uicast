"use client";

import { useMutation } from "@tanstack/react-query";
import { Badge } from "@uicast/shadcn-catalog/ui/badge";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@uicast/shadcn-catalog/ui/card";
import { Input } from "@uicast/shadcn-catalog/ui/input";
import { Label } from "@uicast/shadcn-catalog/ui/label";
import { Textarea } from "@uicast/shadcn-catalog/ui/textarea";
import { KeyRound, Link2, LoaderCircle, Plug, Zap } from "lucide-react";
import { useId, useState } from "react";
import { FEATURED_SERVERS, type FeaturedServer } from "./featured";

/**
 * The connect form. Featured chips prefill it — they are a convenience layer,
 * never a gate: the Custom chip is the same open "any Streamable HTTP server"
 * form the app started with, and both paths POST to the same route.
 */

/** What a preset's auth means for the person connecting, at a glance. */
const AUTH_BADGE: Record<FeaturedServer["auth"], { label: string; icon: typeof KeyRound }> = {
  none: { label: "no key needed", icon: Zap },
  bearer: { label: "needs an API key", icon: KeyRound },
  "personal-url": { label: "personal URL", icon: Link2 },
};

export function ConnectCard({ onConnected }: { onConnected: () => void }) {
  const uid = useId();
  // null = the Custom form.
  const [preset, setPreset] = useState<FeaturedServer | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [headers, setHeaders] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const pick = (next: FeaturedServer | null) => {
    setPreset(next);
    setName(next?.slug ?? "");
    setUrl(next?.url ?? "");
    setSecret("");
    setHeaders("");
    setFormError(null);
  };

  const effectiveName = (preset ? name || preset.slug : name).trim();
  const effectiveUrl = (preset?.url ?? url).trim();
  const needsSecret = preset?.auth === "bearer";
  const ready =
    Boolean(effectiveName && effectiveUrl) && (!needsSecret || Boolean(secret.trim()));

  const connect = useMutation({
    mutationFn: async () => {
      let parsedHeaders: Record<string, string> | undefined;
      if (needsSecret) {
        // Accept a pasted "Bearer xyz" as gracefully as a bare key.
        const token = secret.trim().replace(/^Bearer\s+/i, "");
        parsedHeaders = { Authorization: `Bearer ${token}` };
      } else if (!preset && headers.trim()) {
        try {
          parsedHeaders = JSON.parse(headers);
        } catch {
          throw new Error('Headers must be JSON, e.g. { "Authorization": "Bearer …" }');
        }
      }
      const res = await fetch("/api/mcp/servers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: effectiveName, url: effectiveUrl, headers: parsedHeaders }),
      });
      if (!res.ok) throw new Error(`Could not save the server (${res.status})`);
    },
    onSuccess: () => {
      pick(null);
      onConnected();
    },
    onError: (error: Error) => setFormError(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect a server</CardTitle>
        <CardDescription>
          Pick a featured server for a guided setup, or Custom for any Streamable HTTP endpoint.
          Credentials stay on this app's server — a generated document never sees them.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={preset === null ? "default" : "outline"}
            onClick={() => pick(null)}
          >
            Custom
          </Button>
          {FEATURED_SERVERS.map((candidate) => (
            <Button
              key={candidate.slug}
              size="sm"
              variant={preset?.slug === candidate.slug ? "default" : "outline"}
              onClick={() => pick(candidate)}
            >
              {candidate.label}
            </Button>
          ))}
        </div>

        {preset ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">{preset.blurb}</p>
              {(() => {
                const badge = AUTH_BADGE[preset.auth];
                const Icon = badge.icon;
                return (
                  <Badge variant="secondary" className="shrink-0">
                    <Icon className="size-3" />
                    {badge.label}
                  </Badge>
                );
              })()}
            </div>

            <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
              {preset.steps.map((step) => (
                <li key={step.text}>
                  {step.text}{" "}
                  {step.href && (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      {step.linkLabel ?? step.href}
                    </a>
                  )}
                </li>
              ))}
            </ol>

            {preset.auth === "bearer" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${uid}-secret`}>API key</Label>
                <Input
                  id={`${uid}-secret`}
                  type="password"
                  autoComplete="off"
                  value={secret}
                  placeholder={preset.secretPlaceholder}
                  onChange={(event) => setSecret(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Sent as <code>Authorization: Bearer …</code>; stored locally in{" "}
                  <code>data/store.json</code>.
                </p>
              </div>
            )}

            {preset.auth === "personal-url" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${uid}-url`}>Your server URL</Label>
                <Input
                  id={`${uid}-url`}
                  value={url}
                  placeholder={preset.urlPlaceholder}
                  onChange={(event) => setUrl(event.target.value)}
                />
              </div>
            )}

            {preset.note && <p className="text-xs text-muted-foreground">{preset.note}</p>}
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${uid}-name`}>Name</Label>
                <Input
                  id={`${uid}-name`}
                  value={name}
                  placeholder="linear"
                  onChange={(event) => setName(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Prefixes every tool, so two servers can both expose <code>search</code>.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${uid}-custom-url`}>URL</Label>
                <Input
                  id={`${uid}-custom-url`}
                  value={url}
                  placeholder="https://mcp.example.com/mcp"
                  onChange={(event) => setUrl(event.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${uid}-headers`}>Headers (optional, JSON)</Label>
              <Textarea
                id={`${uid}-headers`}
                value={headers}
                placeholder={'{ "Authorization": "Bearer …" }'}
                className="min-h-20 font-mono text-xs"
                onChange={(event) => setHeaders(event.target.value)}
              />
            </div>
          </>
        )}

        {formError && <p className="text-xs text-destructive">{formError}</p>}
      </CardContent>
      <CardFooter className="justify-end">
        <Button disabled={!ready || connect.isPending} onClick={() => connect.mutate()}>
          {connect.isPending ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <Plug data-icon="inline-start" />
          )}
          Connect{preset ? ` ${preset.label}` : ""}
        </Button>
      </CardFooter>
    </Card>
  );
}
