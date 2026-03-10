"use client"

import { usePathname } from "next/navigation"
import React from "react"
import { AppSidebar } from "./app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathName = usePathname();

    const segments = pathName.split('/').filter(Boolean);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {segments.map((segment, index) => {
                                    const href = `/${segments.slice(0, index + 1).join('/')}`;
                                    const isLast = index === segments.length - 1;
                                    const title = segment.charAt(0).toUpperCase() + segment.slice(1);

                                    return (
                                        <React.Fragment key={href}>
                                            <BreadcrumbItem className="hidden md:block">
                                                {isLast ? (
                                                    <BreadcrumbPage>{title}</BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink href={href}>
                                                        {title}
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                            {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
                                        </React.Fragment>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )

}