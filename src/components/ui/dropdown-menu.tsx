"use client";

import * as React from "react";
import { DropdownMenu as DropdownPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return <DropdownPrimitive.Portal><DropdownPrimitive.Content sideOffset={sideOffset} className={cn("z-50 min-w-44 rounded-lg border bg-popover p-1 text-popover-foreground shadow-xl", className)} {...props} /></DropdownPrimitive.Portal>;
}
export function DropdownMenuItem({ className, inset, ...props }: React.ComponentProps<typeof DropdownPrimitive.Item> & { inset?: boolean }) {
  return <DropdownPrimitive.Item className={cn("relative flex cursor-default select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none transition focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", inset && "ps-8", className)} {...props} />;
}
export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Separator>) {
  return <DropdownPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}
