"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CopyIcon, EyeIcon, EyeOffIcon, RefreshCwIcon } from "lucide-react";
import { regenerateToken } from "@/actions/monitor";

type TokenDisplayProps = {
  token: string | null;
  monitorId: string;
  onTokenUpdate?: (newToken: string) => void;
};

export function TokenDisplay({
  token,
  monitorId,
  onTokenUpdate,
}: TokenDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRegenerating, startRegenerateTransition] = useTransition();
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const maskToken = (token: string | null): string => {
    if (!token) return "No token available";
    if (token.length <= 8) return token;
    const prefix = token.substring(0, 4);
    const suffix = token.substring(token.length - 4);
    return `${prefix}${"*".repeat(Math.max(0, token.length - 8))}${suffix}`;
  };

  const handleCopy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy token:", err);
    }
  };

  const handleRegenerate = () => {
    startRegenerateTransition(async () => {
      try {
        const result = await regenerateToken(monitorId);
        if (result.token && onTokenUpdate) {
          onTokenUpdate(result.token);
        }
        setShowRegenerateDialog(false);
        setIsVisible(false); // Hide token after regeneration
      } catch (error) {
        console.error("Failed to regenerate token:", error);
        alert("Failed to regenerate token. Please try again.");
      }
    });
  };

  if (!token) {
    return (
      <div className="text-sm text-muted-foreground">No token available</div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            type={isVisible ? "text" : "password"}
            value={isVisible ? token : maskToken(token)}
            readOnly
            className="font-mono text-sm pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsVisible(!isVisible)}
              aria-label={isVisible ? "Hide token" : "Show token"}
            >
              {isVisible ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleCopy}
              aria-label="Copy token"
            >
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {copySuccess && (
        <p className="text-xs text-emerald-600">Copied to clipboard!</p>
      )}
      <Dialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isRegenerating}
          >
            <RefreshCwIcon
              className={`h-4 w-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`}
            />
            Regenerate Token
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate this token? The current token
              will become invalid immediately and you&apos;ll need to update
              your application with the new token.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegenerateDialog(false)}
              disabled={isRegenerating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
