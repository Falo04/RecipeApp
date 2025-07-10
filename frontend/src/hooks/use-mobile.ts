import * as React from "react";

/**
 * Represents the screen width breakpoint for mobile devices.
 * This value determines the point at which the layout should shift to a mobile-friendly design.
 * Values typically represent pixel widths.
 *
 * @description This constant defines the screen width (in pixels) at which the layout adjusts for mobile devices.
 */
const MOBILE_BREAKPOINT: number = 768;

/**
 * Determines if the current screen is mobile.
 *
 * @returns True if the screen width is less than or equal to the MOBILE_BREAKPOINT, false otherwise.
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

    React.useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        /**
         *
         */
        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        mql.addEventListener("change", onChange);
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return !!isMobile;
}

/**
 * Represents the screen width breakpoint for mobile devices.
 * This is special for sidebar. I want to have break the sidebar at a bigger width.
 *
 * @description This constant defines the screen width (in pixels) at which the layout adjusts for mobile devices.
 */
const SIDEBAR_MOBILE_BREAKPOINT: number = 1024;

/**
 * Determines if the current screnn is mobile for sidebar has a sligthly more breakpoint
 */
export function useIsMobileSidebar() {
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

    React.useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 1}px)`);
        /**
         *
         */
        const onChange = () => {
            setIsMobile(window.innerWidth < SIDEBAR_MOBILE_BREAKPOINT);
        };
        mql.addEventListener("change", onChange);
        setIsMobile(window.innerWidth < SIDEBAR_MOBILE_BREAKPOINT);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return !!isMobile;
}
