"use client";

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

  return (
    <Button {...props} onClick={() => copyToClipboard(toCopy)}>
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
