"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function NewPage() {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  // Only the page row is created here; generation starts on the page itself.
  const create = useMutation({
    mutationFn: async (): Promise<{ id: number }> => {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: name.trim(), prompt: prompt.trim() }),
      });
      if (!res.ok) throw new Error(`Failed to create the page (${res.status})`);
      return res.json();
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      router.push(`/pages/${page.id}`);
    },
  });

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>New page</CardTitle>
          <CardDescription>Name the page and describe what you want to generate.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="page-name">Page name</Label>
            <Input
              id="page-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Orders dashboard"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="page-prompt">Prompt</Label>
            <Textarea
              id="page-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A dashboard listing all orders with their status and totals, plus a form to add a new order."
              className="min-h-40"
            />
          </div>
          {create.isError && (
            <p className="text-xs text-destructive">
              {create.error instanceof Error ? create.error.message : String(create.error)}
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            disabled={
              !name.trim() || !prompt.trim() || create.isPending || create.isSuccess
            }
            onClick={() => create.mutate()}
          >
            {create.isPending || create.isSuccess ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            Generate
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
