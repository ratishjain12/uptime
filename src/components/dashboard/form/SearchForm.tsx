"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchFormProps = {
  defaultValue?: string;
};

export const SearchForm = ({ defaultValue = "" }: SearchFormProps) => {
  const router = useRouter();
  const params = useSearchParams();

  const onSubmit = (formData: FormData) => {
    const next = new URLSearchParams(params);
    const value = (formData.get("search") as string)?.trim();

    if (value) next.set("search", value);
    else next.delete("search");

    router.push(`/dashboard?${next.toString()}`);
  };

  return (
    <form
      action={onSubmit}
      className="flex w-full gap-3 rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm"
    >
      <div className="flex w-full flex-col gap-1">
        <label
          htmlFor="monitor-search"
          className="text-sm font-medium text-muted-foreground"
        >
          Search monitors
        </label>
        <Input
          id="monitor-search"
          name="search"
          placeholder="e.g. marketing site, api uptime..."
          defaultValue={defaultValue}
        />
      </div>

      <Button type="submit" className="self-end">
        Search
      </Button>
    </form>
  );
};
