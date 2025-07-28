import { useTranslation } from "react-i18next";
import { Subheading } from "@/components/ui/heading.tsx";
import type { Ingredients } from "@/api/model/ingredients.interface.ts";
import { MinusIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

/**
 * The properties for {@link IngredientsGrid}
 */
export type IngredientsGridProps = {
    /** List of all ingredients to show */
    ingredients: Array<Ingredients>;
    /** Function to remove ingredients from list */
    onDelete?: (index: number) => void;
    /** Should the grid be scrollable? */
    withScrolling: boolean;
    /** The class names */
    className?: string;
};

/**
 * The grid to show ingredients
 */
export default function IngredientsGrid(props: IngredientsGridProps) {
    const [t] = useTranslation("recipe");

    return (
        <div className={cn(props.className, "flex flex-col gap-4")}>
            {!props.onDelete && <Subheading>{t("heading.ingredients")}</Subheading>}
            {props.ingredients.map((ingredient, index) => (
                <div className={"grid grid-cols-[125px_1fr_50px] items-center gap-4 gap-y-4"} key={ingredient.uuid}>
                    <span className={"text-muted-foreground/80 text-right"}>
                        {ingredient.amount + " " + ingredient.unit}
                    </span>
                    <span className={"text-foreground/90"}>{ingredient.name}</span>
                    {props.onDelete && (
                        <Button type="button" variant="ghost" onClick={() => props.onDelete?.(index)}>
                            <MinusIcon />
                        </Button>
                    )}
                </div>
            ))}
        </div>
    );
}
