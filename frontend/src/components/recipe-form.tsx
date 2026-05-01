import { Api } from "@/api/api";
import { type CreateOrUpdateRecipe, type FullRecipe, Units } from "@/api/generated";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field.tsx";
import { Form, Input } from "@/components/ui/form";
import { Subheading } from "@/components/ui/heading.tsx";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/ui/text.tsx";
import ACCOUNT_CONTEXT from "@/context/account.tsx";
import SINGLE_RECIPE_CONTEXT from "@/context/recipe.tsx";
import TAGS_CONTEXT from "@/context/tags";
import { isFormError } from "@/utils/error.ts";
import { useForm, useStore } from "@tanstack/react-form";
import type { VariantProps } from "class-variance-authority";
import { CookingPotIcon, LucideCarrot, PlusIcon, ReceiptTextIcon, X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.tsx";

export type RecipeFormProps = {
    formData?: FullRecipe;
    navigate: (uuid: string) => void;
};

export function RecipeForm(props: RecipeFormProps) {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const [open, setOpen] = React.useState(false);
    const [ingreName, setIngreName] = React.useState("");
    const [ingreNameError, setIngreNameError] = React.useState<string | undefined>(undefined);
    const [ingreAmount, setIngreAmount] = React.useState<number>(0);
    const [ingreAmountError, setIngreAmountError] = React.useState<string | undefined>(undefined);
    const [ingreUnit, setIngreUnit] = React.useState<Units>(Units.Gram);

    const tagContext = React.useContext(TAGS_CONTEXT);
    const accountContext = React.useContext(ACCOUNT_CONTEXT);
    const recipeContext = React.useContext(SINGLE_RECIPE_CONTEXT);

    const [openSections, setOpenSections] = React.useState<string[]>(["general-info"]);

    const form = useForm({
        defaultValues: {
            name: props.formData?.name ?? "",
            description: props.formData?.description ?? "",
            ingredients: props.formData?.ingredients ?? [],
            steps: props.formData?.steps ?? [{ step: "" }],
            tags: props.formData?.tags ?? [],
        },
        validators: {
            onSubmitAsync: async ({ value }) => {
                const payload: CreateOrUpdateRecipe = {
                    user: accountContext.account?.uuid,
                    tags: value.tags.map((tag) => tag.uuid),
                    name: value.name,
                    description: value.description,
                    ingredients: value.ingredients,
                    steps: value.steps.map((s, idx) => ({ index: idx, step: s.step })),
                };

                if (props.formData) {
                    const res = await Api.recipe.update(props.formData.uuid, payload);
                    if (isFormError(res)) {
                        return {
                            fields: {
                                name: res.error.name_already_exists ? t("error.name-already-exists") : undefined,
                            },
                        };
                    }
                    toast.success(t("toast.updated-success"));
                    recipeContext.reset();
                    props.navigate(props.formData.uuid);
                } else {
                    const res = await Api.recipe.create(payload);
                    if (isFormError(res)) {
                        return {
                            fields: {
                                name: res.error.name_already_exists ? t("error.name-already-exists") : undefined,
                            },
                        };
                    }
                    toast.success(t("toast.created-success"));
                    props.navigate(res.uuid);
                }
            },
        },
    });

    const formMeta = useStore(form.store, (state) => ({
        attempts: state.submissionAttempts,
        fields: state.fieldMeta,
    }));

    React.useEffect(() => {
        console.log(formMeta);
        if (formMeta.attempts === 0) return;

        const errorSections: string[] = [];

        if (
            (formMeta.fields["name"]?.errors.length ?? 0) > 0 ||
            (formMeta.fields["description"]?.errors.length ?? 0) > 0
        ) {
            errorSections.push("general-info");
        }

        if (
            Object.keys(formMeta.fields).some(
                (key) => key.startsWith("steps[") && (formMeta.fields[key]?.errors.length ?? 0) > 0,
            )
        ) {
            errorSections.push("steps");
        }

        if (errorSections.length > 0) {
            setOpenSections(errorSections);
        }
    }, [formMeta.attempts]);

    return (
        <Form onSubmit={form.handleSubmit} className="flex max-w-lg flex-col">
            <Accordion value={openSections} onValueChange={setOpenSections} className={"rounded-lg border"}>
                <AccordionItem value={"general-info"} className="border-b px-4 last:border-b-0">
                    <AccordionTrigger>
                        <div className="flex items-center gap-2">
                            <ReceiptTextIcon className="text-muted-foreground size-4 shrink-0" />
                            <Subheading level={2}>{t("stepper.meta-title")}</Subheading>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <FieldSet>
                            <FieldGroup>
                                <form.Field
                                    name="name"
                                    validators={{
                                        onSubmit: ({ value }) =>
                                            value.length === 0 ? t("error.name-required") : undefined,
                                        onChange: ({ value }) => (value.length > 255 ? t("error.too-long") : undefined),
                                    }}
                                >
                                    {(field) => (
                                        <Field>
                                            <FieldLabel htmlFor="name">{tg("label.name")}</FieldLabel>
                                            <Input
                                                id="name"
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder={t("placeholder.name")}
                                                aria-invalid={field.state.meta.errors.length > 0}
                                            />
                                            {field.state.meta.errors.map((err) => (
                                                <ErrorMessage key={err}>{err}</ErrorMessage>
                                            ))}
                                        </Field>
                                    )}
                                </form.Field>

                                <form.Field
                                    name="description"
                                    validators={{
                                        onSubmit: ({ value }) =>
                                            value.length === 0 ? t("error.description-required") : undefined,
                                        onChange: ({ value }) => (value.length > 255 ? t("error.too-long") : undefined),
                                    }}
                                >
                                    {(field) => (
                                        <Field className="flex flex-col gap-1.5">
                                            <FieldLabel htmlFor="description">{tg("label.description")}</FieldLabel>
                                            <Textarea
                                                id="description"
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder={t("placeholder.description")}
                                                className="h-28 resize-none"
                                                aria-invalid={field.state.meta.errors.length > 0}
                                            />
                                            {field.state.meta.errors.map((err) => (
                                                <ErrorMessage key={err}>{err}</ErrorMessage>
                                            ))}
                                        </Field>
                                    )}
                                </form.Field>

                                <form.Field name="tags">
                                    {(field) => (
                                        <Field className="flex flex-col gap-1.5">
                                            <FieldLabel>{tg("menu.tags")}</FieldLabel>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Popover open={open} onOpenChange={setOpen}>
                                                    <PopoverTrigger
                                                        render={
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                role="combobox"
                                                                aria-expanded={open}
                                                            />
                                                        }
                                                    >
                                                        <PlusIcon className="size-3.5" />
                                                        {t("button.add-tags")}
                                                    </PopoverTrigger>
                                                    <PopoverContent side="top" className="p-0">
                                                        <Command>
                                                            <CommandInput placeholder={t("placeholder.select-tags")} />
                                                            <CommandList>
                                                                <CommandEmpty>
                                                                    {t("placeholder.tags-empty")}
                                                                </CommandEmpty>
                                                                <CommandGroup>
                                                                    {tagContext.tags
                                                                        .filter(
                                                                            (tag) =>
                                                                                !field.state.value.some(
                                                                                    (s) => s.uuid === tag.uuid,
                                                                                ),
                                                                        )
                                                                        .map((item) => (
                                                                            <CommandItem
                                                                                key={item.uuid}
                                                                                value={item.name}
                                                                                onSelect={() => {
                                                                                    field.pushValue(item);
                                                                                    setOpen(false);
                                                                                }}
                                                                            >
                                                                                <Badge
                                                                                    variant={
                                                                                        item.color.toLowerCase() as VariantProps<
                                                                                            typeof badgeVariants
                                                                                        >["variant"]
                                                                                    }
                                                                                >
                                                                                    {item.name}
                                                                                </Badge>
                                                                            </CommandItem>
                                                                        ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                {field.state.value.map((item, index) => (
                                                    <Badge
                                                        key={item.uuid}
                                                        variant={
                                                            item.color.toLowerCase() as VariantProps<
                                                                typeof badgeVariants
                                                            >["variant"]
                                                        }
                                                    >
                                                        {item.name}
                                                        <button
                                                            type="button"
                                                            className="hover:opacity-70"
                                                            onClick={() => field.removeValue(index)}
                                                        >
                                                            <X className="size-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </Field>
                                    )}
                                </form.Field>
                            </FieldGroup>
                        </FieldSet>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value={"ingredients"} className="border-b px-4 last:border-b-0">
                    <AccordionTrigger>
                        <div className="flex items-center gap-2">
                            <LucideCarrot className="text-muted-foreground size-4 shrink-0" />
                            <Subheading level={2}>{t("heading.ingredients-title")}</Subheading>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <form.Field name="ingredients" mode="array">
                            {(fieldArrayApi) => (
                                <div className="flex flex-col gap-4">
                                    {/* Add ingredient form */}
                                    <div className="bg-muted/40 flex flex-col gap-3 rounded-lg p-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-muted-foreground text-xs font-medium">
                                                {t("placeholder.name-ingredients")}
                                            </label>
                                            <Input
                                                value={ingreName}
                                                onChange={(e) => {
                                                    setIngreName(e.target.value);
                                                    setIngreNameError(undefined);
                                                }}
                                                placeholder={t("placeholder.name-ingredients")}
                                                aria-invalid={!!ingreNameError}
                                            />
                                            {ingreNameError && <ErrorMessage>{ingreNameError}</ErrorMessage>}
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex w-28 flex-col gap-1">
                                                <label className="text-muted-foreground text-xs font-medium">
                                                    {t("placeholder.amount")}
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={ingreAmount || ""}
                                                    onChange={(e) => {
                                                        setIngreAmount(Number(e.target.value));
                                                        setIngreAmountError(undefined);
                                                    }}
                                                    placeholder={t("placeholder.amount")}
                                                    className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                    aria-invalid={!!ingreAmountError}
                                                />
                                                {ingreAmountError && <ErrorMessage>{ingreAmountError}</ErrorMessage>}
                                            </div>
                                            <div className="flex flex-1 flex-col gap-1">
                                                <label className="text-muted-foreground text-xs font-medium">
                                                    Unit
                                                </label>
                                                <Select
                                                    value={ingreUnit}
                                                    onValueChange={(v) => setIngreUnit(v as Units)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.values(Units).map((unit) => (
                                                            <SelectItem key={unit} value={unit}>
                                                                {unit}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    let hasError = false;
                                                    if (!ingreName) {
                                                        setIngreNameError(t("error.ingre-name"));
                                                        hasError = true;
                                                    }
                                                    if (!ingreAmount) {
                                                        setIngreAmountError(t("error.ingre-amount"));
                                                        hasError = true;
                                                    }
                                                    if (hasError) return;
                                                    fieldArrayApi.pushValue({
                                                        name: ingreName,
                                                        amount: ingreAmount,
                                                        unit: ingreUnit,
                                                    });
                                                    setIngreName("");
                                                    setIngreAmount(0);
                                                    setIngreUnit(Units.Gram);
                                                }}
                                            >
                                                <PlusIcon className="size-4" />
                                                {t("button.add-ingredient")}
                                            </Button>
                                        </div>
                                    </div>

                                    {fieldArrayApi.state.value.length > 0 && (
                                        <div className="flex flex-col divide-y">
                                            {fieldArrayApi.state.value.map((ingredient, index) => (
                                                <div
                                                    key={ingredient.uuid ?? index}
                                                    className="flex items-center gap-3 py-2"
                                                >
                                                    <span className="text-muted-foreground w-24 shrink-0 text-right text-sm">
                                                        {ingredient.amount} {ingredient.unit}
                                                    </span>
                                                    <span className="flex-1 text-sm">{ingredient.name}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => fieldArrayApi.removeValue(index)}
                                                    >
                                                        <X className="size-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </form.Field>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value={"steps"} className="border-b px-4 last:border-b-0">
                    <AccordionTrigger>
                        <div className="flex items-center gap-3">
                            <CookingPotIcon className="text-muted-foreground size-4 shrink-0" />
                            <Subheading level={2}>{t("heading.step-title")}</Subheading>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <form.Field name="steps">
                            {(fieldArray) => (
                                <div className="flex flex-col gap-4">
                                    {fieldArray.state.value.map((_, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="bg-muted text-muted-foreground mt-2 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                                {index + 1}
                                            </div>
                                            <form.Field
                                                name={`steps[${index}].step`}
                                                validators={{
                                                    onSubmit: ({ value }) =>
                                                        value.length === 0 ? t("error.step-length-zero") : undefined,
                                                    onChange: ({ value }) =>
                                                        value.length > 255 ? t("error.step-length-255") : undefined,
                                                }}
                                            >
                                                {(f) => (
                                                    <div className="flex flex-1 flex-col gap-1">
                                                        <Textarea
                                                            id={"step" + index}
                                                            value={f.state.value}
                                                            onChange={(e) => f.handleChange(e.target.value)}
                                                            placeholder={t("placeholder.step")}
                                                            className="h-20 resize-none"
                                                            aria-invalid={f.state.meta.errors.length > 0}
                                                        />
                                                        {f.state.meta.errors.map((err) => (
                                                            <ErrorMessage key={err}>{err}</ErrorMessage>
                                                        ))}
                                                    </div>
                                                )}
                                            </form.Field>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="mt-1.5 shrink-0"
                                                onClick={() => form.removeFieldValue("steps", index)}
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="self-end"
                                        onClick={() => form.pushFieldValue("steps", { step: "" })}
                                    >
                                        <PlusIcon className="size-4" />
                                        {t("button.add-step")}
                                    </Button>
                                </div>
                            )}
                        </form.Field>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <div className="flex self-end">
                <Button type={"submit"}>{props.formData ? t("button.update") : t("button.create")}</Button>
            </div>
        </Form>
    );
}
