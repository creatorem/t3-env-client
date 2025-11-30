"use client";

import { useCallback } from "react";
import { Button } from "./ui/button";
import { useCopyToClipboard } from "./use-copy-to-clipboard";
import { CheckIcon, CopyIcon } from "lucide-react";

interface CopyButtonProps {
  toCopy: string;
}

export function CopyButton({
  toCopy,
  children,
  ...props
}: CopyButtonProps & React.ComponentProps<typeof Button>) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      copyToClipboard(toCopy);
    },
    [copyToClipboard, toCopy]
  );

  return (
    <Button
      role="button"
      variant="outline"
      size="icon-sm"
      aria-label="Copy code to clipboard"
      {...props}
      onClick={handleClick}
    >
      {isCopied ? (
        <CheckIcon className="size-3.5 text-green-500" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
      <span className="sr-only">{props["aria-label"]}</span>
      {children}
    </Button>
  );
}
