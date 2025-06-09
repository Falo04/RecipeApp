import * as React from "react";

/**
 * Represents the screen width breakpoint for mobile devices.
 * This value determines the point at which the layout should shift to a mobile-friendly design.
 * Values typically represent pixel widths.
 *
 * @type {number}
 * @const
 * @description This constant defines the screen width (in pixels) at which the layout adjusts for mobile devices.
 */
const MOBILE_BREAKPOINT: number = 1024;

/**
 * Determines if the current screen is mobile.
 *
 * @return {boolean} True if the screen width is less than or equal to the MOBILE_BREAKPOINT, false otherwise.
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
