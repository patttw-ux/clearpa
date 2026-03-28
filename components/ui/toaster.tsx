"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "font-sans",
          title: "font-display font-medium",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
