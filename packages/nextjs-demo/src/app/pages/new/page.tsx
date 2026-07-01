"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@ui-fired/shadcn-catalog/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ui-fired/shadcn-catalog/ui/card";
import { Textarea } from "@ui-fired/shadcn-catalog/ui/textarea";

export default function NewPage() {
  const [prompt, setPrompt] = useState("");
  const [note, setNote] = useState(false);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>New page</CardTitle>
          <CardDescription>
            Describe the page you want to generate. Be as specific as you like.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setNote(false);
            }}
            placeholder="e.g. A dashboard listing all orders with their status and totals, plus a form to add a new order."
            className="min-h-40"
          />
        </CardContent>
        <CardFooter className="flex-col items-end gap-2">
          <Button disabled={!prompt.trim()} onClick={() => setNote(true)}>
            <Sparkles data-icon="inline-start" />
            Generate
          </Button>
          {note && (
            <p className="text-xs text-muted-foreground">Generation isn't wired up yet.</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
