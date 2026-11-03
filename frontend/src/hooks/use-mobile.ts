import * as React from "react";

/** The screen width in pixels below which the layout switches to its mobile design */
const MOBILE_BREAKPOINT: number = 768;

/**
 * Determines if the current screen is mobile.
 *
 * @returns Whether the screen is narrower than {@link MOBILE_BREAKPOINT}
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

    React.useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        mql.addEventListener("change", onChange);
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return !!isMobile;
}

/** The screen width in pixels below which the sidebar collapses, wider than {@link MOBILE_BREAKPOINT} */
const SIDEBAR_MOBILE_BREAKPOINT: number = 1024;

/**
 * Determines if the current screen is narrow enough to collapse the sidebar.
 *
 * @returns Whether the screen is narrower than {@link SIDEBAR_MOBILE_BREAKPOINT}
 */
export function useIsMobileSidebar() {
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

    React.useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 1}px)`);
        const onChange = () => {
            setIsMobile(window.innerWidth < SIDEBAR_MOBILE_BREAKPOINT);
        };
        mql.addEventListener("change", onChange);
        setIsMobile(window.innerWidth < SIDEBAR_MOBILE_BREAKPOINT);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return !!isMobile;
}
