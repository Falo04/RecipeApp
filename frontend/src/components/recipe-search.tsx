import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Api } from "@/api/api";
import type { RecipeSearchResponse } from "@/api/model/recipe.interface";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Search } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command.tsx";
import { useIsMobile } from "@/hooks/use-mobile.ts";

export function RecipeSearch() {
    const [tg] = useTranslation();
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<RecipeSearchResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const isMobile = useIsMobile();

    useEffect(() => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        if (loading) return;
        setLoading(true);
        Api.recipe.search({ name: query }).then((res) => {
            if (res.error) {
                toast.error(res.error.message);
                return;
            }
            if (res.data) {
                setSuggestions(res.data.list);
            }
        });
        setLoading(false);
    }, [query]);

    return (
        <div className="group">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild className={"px-5"}>
                    <Button
                        variant={isMobile ? "ghost" : "outline"}
                        role={"combobox"}
                        aria-expanded={open}
                        className={"w-fit"}
                    >
                        {isMobile ? "" : tg("search.recipe")}
                        <Search />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className={"w-[200px] p-0"} align={"end"}>
                    <Command>
                        <CommandInput
                            value={query}
                            onValueChange={setQuery}
                            placeholder={tg("search.recipe")}
                            className={"h-9"}
                        />
                        <CommandList>
                            <CommandEmpty>{tg("search.recipe-empty")}</CommandEmpty>
                            <CommandGroup>
                                {suggestions.map((recipe) => (
                                    <CommandItem
                                        key={recipe.uuid}
                                        value={recipe.name}
                                        onSelect={() => {
                                            navigate({
                                                to: "/app/recipes/$recipeId",
                                                params: { recipeId: recipe.uuid },
                                            });
                                            setOpen(false);
                                            setQuery("");
                                            return;
                                        }}
                                    >
                                        {recipe.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
