import * as React from "react"
import * as TabsPrimitives from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitives.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitives.List
    ref={ref}
    className={cn(
      "inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100/50 p-1.5 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitives.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitives.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-2 text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-lg data-[state=active]:shadow-primary/5 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-primary-400 cursor-pointer",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitives.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitives.Content
    ref={ref}
    className={cn(
      "mt-6 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 animate-in fade-in-50 duration-500",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitives.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
