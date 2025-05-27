import { Link, useRouterState } from "@tanstack/react-router";
import { MenuIcon, XIcon, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Button } from "./ui/button";
import { RecipeSearch } from "./recipe-search";
import { motion } from "framer-motion";

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

                <div className="hidden w-1/5 md:flex">
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

            {isMobile && mobileNavbar && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div
                        className={clsx(
                            "bg-card border-b-primary/20 fixed right-0 left-0 grid grid-cols-2 gap-4 border-b p-5 shadow-xl",
                        )}
                    >
                        {props.navItems.map((item) => (
                            <button onClick={() => setMobileNavbar(!mobileNavbar)}>
                                <Link to={item.url}>
                                    <span
                                        className={clsx(
                                            pathname === item.url
                                                ? "border-sidebar-primary border-b-2 pb-1 text-zinc-900 dark:text-zinc-100"
                                                : "text-zinc-500 dark:text-zinc-400",
                                            "block w-full self-end hover:text-zinc-900 dark:hover:text-zinc-100",
                                        )}
                                    >
                                        {item.title}
                                    </span>
                                </Link>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </nav>
    );
}
