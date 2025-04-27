import { Link, useRouterState } from "@tanstack/react-router";
import { MenuIcon, XIcon, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Button } from "./ui/button";
import { RecipeSearch } from "./recipe-search";

export interface NavItem {
    title: string;
    url: string;
}

/**
 * The properties for {@link Navbar}
 */
export type NavbarProps = {
    title: String;
    icon: LucideIcon;
    navItems: NavItem[];
};

export function Navbar(props: NavbarProps) {
    const [mobileNavbar, setMobileNavbar] = useState(false);
    const pathname = useRouterState().location.pathname;
    const isMobile = useIsMobile();

    return (
        <nav className="bg-card w-full p-4 px-6">
            <div className="flex flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        <props.icon className="size-4" />
                    </div>
                    <div className="items-center justify-start">
                        <Link to={"/app/recipes"}>
                            <span className="truncate font-semibold">{props.title}</span>
                        </Link>
                    </div>
                </div>

                <ul className="text-card-foreground hidden items-center gap-10 md:flex">
                    {props.navItems.map((item) => (
                        <li key={item.url}>
                            <Link to={item.url}>
                                <span
                                    className={clsx(
                                        pathname.includes(item.url)
                                            ? "border-sidebar-primary border-b-2 pb-1 text-zinc-900 dark:text-zinc-100"
                                            : "text-zinc-500 dark:text-zinc-400",
                                        "hover:text-zinc-900 dark:hover:text-zinc-100",
                                    )}
                                >
                                    {item.title}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="hidden w-1/5 md:block">
                    <RecipeSearch />
                </div>
                {isMobile && (
                    <div className="flex">
                        <RecipeSearch />
                        <Button variant="ghost" onClick={() => setMobileNavbar(!mobileNavbar)}>
                            {mobileNavbar ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
                        </Button>
                    </div>
                )}
            </div>

            {isMobile && (
                <div
                    className={clsx(
                        "mt-8 flex-1 justify-self-center pb-3 transition-all duration-300 ease-in-out md:mt-0 md:block md:pb-0", // Transition for smooth effect
                        mobileNavbar ? "flex translate-y-0 opacity-100" : "hidden translate-y-4 opacity-0",
                    )}
                >
                    <ul className="items-center justify-center space-y-4 md:flex">
                        {props.navItems.map((item) => (
                            <li key={item.url}>
                                <button onClick={() => setMobileNavbar(!mobileNavbar)}>
                                    <Link to={item.url}>
                                        <span
                                            className={clsx(
                                                pathname === item.url
                                                    ? "border-sidebar-primary border-b-2 pb-1 text-zinc-900 dark:text-zinc-100"
                                                    : "text-zinc-500 dark:text-zinc-400",
                                                "hover:text-zinc-900 dark:hover:text-zinc-100",
                                            )}
                                        >
                                            {item.title}
                                        </span>
                                    </Link>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </nav>
    );
}
