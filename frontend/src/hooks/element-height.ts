import { useEffect, useRef, useState } from "react";

/**
 * Returns a hook that tracks the height of a specified HTML element.
 */
export function useElementHeight<T extends HTMLElement>() {
    const elementRef = useRef<T>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (!elementRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === elementRef.current) {
                    setHeight(entry.contentRect.height);
                }
            }
        });

        observer.observe(elementRef.current);

        setHeight(elementRef.current.getBoundingClientRect().height);

        return () => {
            observer.disconnect();
        };
    }, []);

    return [elementRef, height] as const;
}
