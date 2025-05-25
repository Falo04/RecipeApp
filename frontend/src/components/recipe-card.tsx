import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import type { SimpleRecipeWithTags } from "@/api/model/recipe.interface.ts";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import { Text } from "@/components/base/text.tsx";
import type { VariantProps } from "class-variance-authority";

/**
 * The properties for {@link RecipeCard}
 */
export type RecipeCardProps = {
    recipe: SimpleRecipeWithTags;
};

/**
 * Card component for a recipe
 */
export default function RecipeCard(props: RecipeCardProps) {
    return (
        <Card className={"hover:bg-card/10 h-full"}>
            <CardHeader>
                <CardTitle>{props.recipe.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <Text>{props.recipe.description}</Text>
            </CardContent>
            <CardFooter className={"flex gap-2"}>
                {props.recipe.tags.map((tag) => (
                    <Badge
                        key={tag.uuid}
                        variant={tag.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}
                    >
                        {tag.name}
                    </Badge>
                ))}
            </CardFooter>
        </Card>
    );
}
