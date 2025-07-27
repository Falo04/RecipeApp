import { useTranslation } from "react-i18next";
import type { LinkProps } from "@tanstack/react-router";
import {
    Pagination,
    PaginationEllipsis,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination.tsx";

/**
 * The properties for {@link TablePagination}
 */
export type TablePaginationProps = {
    /** Current page */
    currentPage: number;
    /** max pages */
    maxPages: number;
    /** Link */
    href: LinkProps["to"];
    /** Params */
    params?: LinkProps["params"];
    /** */
    getSearchParams: (newPage: number) => LinkProps["search"];
};

/**
 * Pagination for tanstack table
 */
export default function TablePagination(props: TablePaginationProps) {
    const [tg] = useTranslation();
    const { currentPage, maxPages } = props;

    return (
        <Pagination>
            <PaginationPrevious
                disabled={currentPage === 1}
                children={tg("label.prev")}
                to={props.href}
                params={props.params}
                search={props.getSearchParams(currentPage - 1)}
            />
            {[...Array(props.maxPages).keys()].map((_, idx) => {
                if (idx === 1 && currentPage > 3) {
                    return <PaginationEllipsis key={idx} />;
                } else if (idx === maxPages - 2 && currentPage < maxPages - 2) {
                    return <PaginationEllipsis key={idx} />;
                } else if (idx < 1) {
                    return (
                        <PaginationLink
                            to={props.href}
                            params={props.params}
                            search={props.getSearchParams(idx + 1)}
                            key={idx}
                            isActive={idx + 1 === currentPage}
                        >
                            {idx + 1}
                        </PaginationLink>
                    );
                } else if (idx > maxPages - 2) {
                    return (
                        <PaginationLink
                            to={props.href}
                            params={props.params}
                            search={props.getSearchParams(idx + 1)}
                            key={idx}
                            isActive={idx + 1 === currentPage}
                        >
                            {idx + 1}
                        </PaginationLink>
                    );
                } else if (idx > currentPage - 3 && idx < currentPage + 1) {
                    return (
                        <PaginationLink
                            to={props.href}
                            params={props.params}
                            search={props.getSearchParams(idx + 1)}
                            key={idx}
                            isActive={idx + 1 === currentPage}
                        >
                            {idx + 1}
                        </PaginationLink>
                    );
                }
            })}
            <PaginationNext
                children={tg("label.next")}
                to={props.href}
                params={props.params}
                search={props.getSearchParams(currentPage + 1)}
                disabled={currentPage === maxPages}
            />
        </Pagination>
    );
}
