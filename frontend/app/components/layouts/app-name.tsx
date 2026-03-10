"use client"

import * as React from "react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppName({
  appInfo,
}: {
  appInfo: {
    name: string
    logo: React.ComponentType<{ className?: string }>
    slogan: string
  }[]
}) {
  const [appName] = React.useState(appInfo[0])
  const Logo = appName.logo

  if (!appName) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Logo className="size-2" />
          </div>
          <div className="grid flex-1 text-left text-xl leading-tight">
            <span className="truncate font-medium">{appName.name}</span>
            <span className="truncate text-xs">{appName.slogan}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
