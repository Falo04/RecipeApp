import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { Api } from "@/api/api";
import type { RecipeSearchResponse } from "@/api/model/recipe.interface";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useTranslation } from "react-i18next";
import { Text } from "./base/text";

export function RecipeSearch() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<RecipeSearchResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        Api.recipe.search({ name: query }).then((res) => {
            if (res.error) {
                toast.error(res.error.message);
                return;
            }
            if (res.data) {
                setSuggestions(res.data.list);
            }

            setLoading(false);
        });
    }, [query]);

    const handleSelect = (uuid: string) => {
        navigate({ to: "/app/recipes/$recipeId", params: { recipeId: uuid } });
        setQuery("");
    };

    return (
        <div className="group">
            <Input placeholder="Search recipe" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="relative p-0">
                {loading ? (
                    <div className="text-muted-foreground p-2 text-sm">Loading...</div>
                ) : (
                    <ul className="bg-background absolute top-0 z-20 hidden w-full divide-y rounded-lg group-hover:block hover:block">
                        {suggestions.length > 0 &&
                            suggestions.map((recipe) => (
                                <li
                                    key={recipe.uuid}
                                    onClick={() => handleSelect(recipe.uuid)}
                                    className="hover:bg-muted cursor-pointer px-3 py-2 text-sm"
                                >
                                    {recipe.name}
                                </li>
                            ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export type RecipeSearchMobileProps = {
    onClose: () => void;
};

export function RecipeSearchMobile(props: RecipeSearchMobileProps) {
    const [tg] = useTranslation();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<RecipeSearchResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        Api.recipe.search({ name: query }).then((res) => {
            if (res.error) {
                toast.error(res.error.message);
                return;
            }
            if (res.data) {
                setSuggestions(res.data.list);
            }

            setLoading(false);
        });
    }, [query]);

    const handleSelect = (uuid: string) => {
        navigate({ to: "/app/recipes/$recipeId", params: { recipeId: uuid } });
        setQuery("");
        props.onClose();
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <Dialog open={true} onOpenChange={props.onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{tg("dialog.search-recipe")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col justify-start gap-6">
                        <Input placeholder="Search recipe" value={query} onChange={(e) => setQuery(e.target.value)} />
                        <div className="relative min-h-40 p-0">
                            {loading ? (
                                <div className="text-muted-foreground p-2 text-sm">Loading...</div>
                            ) : (
                                <ul className="bg-background w-full divide-y rounded-lg">
                                    {suggestions.length > 0 &&
                                        suggestions.map((recipe) => (
                                            <li
                                                key={recipe.uuid}
                                                onClick={() => handleSelect(recipe.uuid)}
                                                className="hover:bg-muted cursor-pointer px-3 py-2 text-sm"
                                            >
                                                {recipe.name}
                                            </li>
                                        ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
