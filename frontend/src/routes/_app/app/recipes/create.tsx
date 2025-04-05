import { Api } from "@/api/api";
import { Units } from "@/api/model/ingredients.interface";
import type { CreateRecipeRequest } from "@/api/model/recipe.interface";
import SubmenuLayout from "@/components/base/submenu-layout";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import TAGS_CONTEXT from "@/context/tags";
import USER_CONTEXT from "@/context/user";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MinusIcon, PlusIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function CreateRecipe() {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const navigate = useNavigate();
    const tagContext = React.useContext(TAGS_CONTEXT);
    const userContext = React.useContext(USER_CONTEXT);

    const form = useForm({
        defaultValues: {
            name: "",
            description: "",
            ingredients: [{ name: "", amount: 0, unit: Units.Teaspoon }],
            steps: [{ step: "" }],
        },
        onSubmit: async ({ value }) => {
            const payload: CreateRecipeRequest = {
                user: userContext.user.uuid,
                tags: [],
                name: value.name,
                description: value.description,
                ingredients: value.ingredients,
                steps: value.steps.map((s, idx) => ({ index: idx, step: s.step })),
            };

            toast.promise(Api.recipe.create(payload), {
                loading: tg("toast.loading"),
                success: (result) => {
                    if (result.error) {
                        toast.error(result.error.message);
                        return;
                    }

                    if (result.data) {
                        navigate({ to: "/app/recipes/$recipeId", params: { recipeId: result.data.uuid } });
                        return tg("toast.created-success");
                    }
                },
                error: () => tg("toast.general-error"),
            });
        },
    });

    return (
        <div className="mx-auto w-4xl">
            <SubmenuLayout
                heading={t("heading.detail-heading")}
                headingDescription={t("heading.detail-description")}
                hrefBack="/app/recipes"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                    className="flex h-full flex-col gap-5 px-4"
                >
                    <ScrollArea className="h-[70vh] pr-4">
                        <div className="flex flex-col gap-5 pb-4">
                            <form.Field
                                name="name"
                                validators={{
                                    onChangeListenTo: ["name"],
                                    onChange: ({ value }) =>
                                        !value ? "Name is required" : value.length > 255 ? "Too long" : undefined,
                                }}
                            >
                                {(field) => (
                                    <div>
                                        <FormLabel htmlFor="name">{tg("label.name")}</FormLabel>
                                        <Input
                                            id="name"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="name"
                                        />
                                        {field.state.meta.errors?.[0] && (
                                            <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                                        )}
                                    </div>
                                )}
                            </form.Field>

                            <form.Field
                                name="description"
                                validators={{
                                    onChangeListenTo: ["description"],
                                    onChange: ({ value }) =>
                                        !value
                                            ? "Description is required"
                                            : value.length > 255
                                              ? "Too long"
                                              : undefined,
                                }}
                            >
                                {(field) => (
                                    <div>
                                        <FormLabel htmlFor="description">{tg("label.description")}</FormLabel>
                                        <Textarea
                                            id="description"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="description"
                                            className="h-[100px] resize-none"
                                        />
                                        {field.state.meta.errors?.[0] && (
                                            <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                                        )}
                                    </div>
                                )}
                            </form.Field>
                        </div>

                        <form.Field
                            name="ingredients"
                            mode="array"
                            children={(ingredients) => (
                                <div>
                                    <div className="mt-8 flex justify-between">
                                        <h2>{tg("label.ingredients-title")}</h2>
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                ingredients.pushValue({
                                                    name: "",
                                                    amount: 0,
                                                    unit: Units.Teaspoon,
                                                })
                                            }
                                        >
                                            <PlusIcon />
                                        </Button>
                                    </div>

                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{tg("label.ingredients-name")}</TableHead>
                                                <TableHead>{tg("label.ingredients-description")}</TableHead>
                                                <TableHead>{tg("label.ingredients-unit")}</TableHead>
                                                <TableHead />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ingredients.state.value.map((_, index) => (
                                                <TableRow key={index}>
                                                    <form.Field name={`ingredients[${index}].name`}>
                                                        {(f) => (
                                                            <TableCell>
                                                                <Input
                                                                    value={f.state.value}
                                                                    onChange={(e) => f.handleChange(e.target.value)}
                                                                    placeholder="Name"
                                                                />
                                                            </TableCell>
                                                        )}
                                                    </form.Field>

                                                    <form.Field
                                                        name={`ingredients[${index}].amount`}
                                                        validators={{
                                                            onSubmit: ({ value }) =>
                                                                value === 0 ? t("error.amount-not-zero") : undefined,
                                                        }}
                                                    >
                                                        {(f) => (
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    value={f.state.value}
                                                                    onChange={(e) =>
                                                                        f.handleChange(Number(e.target.value))
                                                                    }
                                                                    placeholder="Amount"
                                                                />
                                                                {f.state.meta.errors?.[0] && (
                                                                    <p className="text-sm text-red-500">
                                                                        {f.state.meta.errors[0]}
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                        )}
                                                    </form.Field>

                                                    <form.Field name={`ingredients[${index}].unit`}>
                                                        {(f) => (
                                                            <TableCell className="min-w-[140px]">
                                                                <Select
                                                                    value={f.state.value}
                                                                    onValueChange={(val) => f.setValue(val as Units)}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Select unit" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.values(Units).map((unit) => (
                                                                            <SelectItem key={unit} value={unit}>
                                                                                {unit}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </TableCell>
                                                        )}
                                                    </form.Field>

                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => ingredients.removeValue(index)}
                                                        >
                                                            <MinusIcon />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        />
                        <div className="mt-8 flex justify-between">
                            <h2>{tg("label.step-title")}</h2>
                            <Button type="button" onClick={() => form.pushFieldValue("steps", { step: "" })}>
                                <PlusIcon />
                            </Button>
                        </div>

                        <form.Field name="steps">
                            {(fieldArray) => (
                                <div>
                                    {fieldArray.state.value.map((_, index) => (
                                        <div className="relative my-4" key={index}>
                                            <form.Field
                                                name={`steps[${index}].step`}
                                                validators={{
                                                    onSubmit: ({ value }) =>
                                                        value.length === 0 ? t("error.step-length-zero") : undefined,
                                                    onChange: ({ value }) =>
                                                        value.length > 1024 ? t("error.step-length-1024") : undefined,
                                                }}
                                            >
                                                {(f) => (
                                                    <div>
                                                        <FormLabel
                                                            htmlFor={"step" + index}
                                                        >{`${tg("label.steps")} ${index + 1}`}</FormLabel>
                                                        <Textarea
                                                            id={"step" + index}
                                                            value={f.state.value}
                                                            onChange={(e) => f.handleChange(e.target.value)}
                                                            placeholder="Step"
                                                            className="h-[100px] resize-none"
                                                        />
                                                        {f.state.meta.errors?.[0] && (
                                                            <p className="text-sm text-red-500">
                                                                {f.state.meta.errors[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </form.Field>

                                            <Button
                                                type="button"
                                                className="absolute top-6 right-1"
                                                variant="ghost"
                                                onClick={() => form.removeFieldValue("steps", index)}
                                            >
                                                <MinusIcon />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </form.Field>
                    </ScrollArea>

                    <Button type="submit" variant="primary" className="self-end">
                        Submit
                    </Button>
                </form>
            </SubmenuLayout>
        </div>
    );
}

export const Route = createFileRoute("/_app/app/recipes/create")({
    component: CreateRecipe,
});
