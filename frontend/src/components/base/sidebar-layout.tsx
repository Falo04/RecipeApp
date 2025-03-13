import { t } from "i18next";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator } from "../ui/breadcrumb";
import { Link, useRouterState } from "@tanstack/react-router";

export function SidebarLayout({
  sidebar,
  children,
}: React.PropsWithChildren<{
  sidebar: React.ReactNode;
}>) {

  const pathname = useRouterState().location.pathname.split("/")[2];

  return (
    <div className="relative flex w-full h-full bg-white dark:bg-zinc-900">
      {/* Sidebar on desktop */}
      <div className="">{sidebar}</div>

      <div className="relative flex flex-col w-full">
        <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
          <div className='flex items-center gap-2 px-4'>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <Link to='/food/dashboard'>
                    {t("breadcrumb.dashboard")}
                  </Link>
                </BreadcrumbItem>
                {pathname === "dashboard" ? <></> :
                  <>
                    < BreadcrumbSeparator className='hidden md:block' />
                    <BreadcrumbItem> {pathname}
                    </BreadcrumbItem>
                  </>}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {/* Content */}
        <div className="grow px-6 md:py-2 md:px-10 lg:shadow-xs">
          <div className="max-auto">{children}</div>
        </div>

      </div>

    </div>
  );
}
