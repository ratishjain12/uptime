"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export const WebhookTestButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-webhook", {
        method: "POST",
      });

      if (response.ok) {
        setResult("✅ Test webhook sent successfully!");
      } else {
        const error = await response.text();
        setResult(`❌ Test failed: ${error}`);
      }
    } catch (error) {
      setResult(`❌ Test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleTest}
        disabled={isLoading}
        className="text-xs"
      >
        {isLoading ? "Testing..." : "Test webhook"}
      </Button>
      {result && (
        <p className="text-xs text-muted-foreground">{result}</p>
      )}
    </div>
  );
};
