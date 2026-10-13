import { type CreateOrUpdateRecipe, type FullRecipe, type SimpleTag, Units } from "@/api/generated/model";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field.tsx";
import { Form, Input } from "@/components/ui/form";
import { Subheading } from "@/components/ui/heading.tsx";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage, Text } from "@/components/ui/text.tsx";
import { isFormError } from "@/api/form.ts";
import { useForm } from "@tanstack/react-form";
import { useCreateRecipe, useGetAllTags, useGetMe, useUpdateRecipe } from "@/api/generated";
import type { VariantProps } from "class-variance-authority";
import { CookingPotIcon, LucideCarrot, type LucideIcon, PlusIcon, ReceiptTextIcon, X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/** Hides the spin buttons of number inputs */
const NO_SPINNER =
    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/**
 * The properties for {@link RecipeForm}
 */
export type RecipeFormProps = {
    /** The recipe to update, creates a new recipe if not set */
    formData?: FullRecipe;
    /** Called with the uuid of the recipe after it was saved */
    navigate: (uuid: string) => void;
};

/**
 * Form to create or update a recipe
 */
export function RecipeForm(props: RecipeFormProps) {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const { data: tags } = useGetAllTags();
    const { data: account } = useGetMe();
    const createRecipe = useCreateRecipe();
    const updateRecipe = useUpdateRecipe();

    const form = useForm({
        defaultValues: {
            name: props.formData?.name ?? "",
            description: props.formData?.description ?? "",
            ingredients: props.formData?.ingredients ?? [],
            steps: props.formData?.steps ?? [{ index: 0, step: "" }],
            tags: props.formData?.tags ?? [],
        },
        validators: {
            onSubmitAsync: async ({ value }) => {
                const payload: CreateOrUpdateRecipe = {
                    user: account?.uuid,
                    tags: value.tags.map((tag) => tag.uuid),
                    name: value.name,
                    description: value.description,
                    ingredients: value.ingredients,
                    steps: value.steps.map((s, idx) => ({ uuid: s.uuid, index: idx, step: s.step })),
                };

                const res = props.formData
                    ? await updateRecipe.mutateAsync({ recipeUuid: props.formData.uuid, data: payload })
                    : await createRecipe.mutateAsync({ data: payload });

                if (isFormError(res)) {
                    return {
                        fields: {
                            name: res.error.name_already_exists ? t("error.name-already-exists") : undefined,
                        },
                    };
                }

                if (props.formData) {
                    toast.success(t("toast.updated-success"));
                    props.navigate(props.formData.uuid);
                } else {
                    toast.success(t("toast.created-success"));
                    props.navigate(res.uuid);
                }
            },
        },
    });

    return (
        <Form onSubmit={form.handleSubmit} className={"flex flex-col gap-8 space-y-0 pb-8"}>
            <FormSection
                icon={ReceiptTextIcon}
                title={t("stepper.meta-title")}
                description={t("stepper.meta-description")}
            >
                <FieldGroup>
                    <form.Field
                        name="name"
                        validators={{
                            onSubmit: ({ value }) => (value.length === 0 ? t("error.name-required") : undefined),
                            onChange: ({ value }) => (value.length > 255 ? t("error.too-long") : undefined),
                        }}
                    >
                        {(field) => (
                            <Field data-invalid={field.state.meta.errors.length > 0}>
                                <FieldLabel htmlFor="name">{tg("label.name")}</FieldLabel>
                                <Input
                                    id="name"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t("placeholder.name")}
                                    aria-invalid={field.state.meta.errors.length > 0}
                                />
                                <FieldErrors errors={field.state.meta.errors} />
                            </Field>
                        )}
                    </form.Field>

                    <form.Field
                        name="description"
                        validators={{
                            onSubmit: ({ value }) => (value.length === 0 ? t("error.description-required") : undefined),
                            onChange: ({ value }) => (value.length > 255 ? t("error.too-long") : undefined),
                        }}
                    >
                        {(field) => (
                            <Field data-invalid={field.state.meta.errors.length > 0}>
                                <FieldLabel htmlFor="description">{tg("label.description")}</FieldLabel>
                                <Textarea
                                    id="description"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t("placeholder.description")}
                                    className="h-28 resize-none"
                                    aria-invalid={field.state.meta.errors.length > 0}
                                />
                                <FieldErrors errors={field.state.meta.errors} />
                            </Field>
                        )}
                    </form.Field>

                    <form.Field name="tags">
                        {(field) => (
                            <Field>
                                <FieldLabel>{tg("menu.tags")}</FieldLabel>
                                <TagPicker
                                    available={tags?.list ?? []}
                                    selected={field.state.value}
                                    onAdd={(tag) => field.pushValue(tag)}
                                    onRemove={(index) => field.removeValue(index)}
                                />
                            </Field>
                        )}
                    </form.Field>
                </FieldGroup>
            </FormSection>

            <Separator />

            <FormSection
                icon={LucideCarrot}
                title={t("stepper.ingredients-title")}
                description={t("stepper.ingredients-description")}
            >
                <form.Field name="ingredients" mode="array">
                    {(ingredients) => (
                        <div className="flex flex-col gap-3">
                            {ingredients.state.value.length > 0 && (
                                <div className="text-muted-foreground hidden gap-2 text-xs font-medium sm:grid sm:grid-cols-[1fr_6rem_9rem_2rem]">
                                    <span>{t("placeholder.name-ingredients")}</span>
                                    <span>{t("placeholder.amount")}</span>
                                    <span>{t("placeholder.unit")}</span>
                                </div>
                            )}
                            {ingredients.state.value.map((_, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-[1fr_1fr_2rem] items-start gap-2 sm:grid-cols-[1fr_6rem_9rem_2rem]"
                                >
                                    <form.Field
                                        name={`ingredients[${index}].name`}
                                        validators={{
                                            onSubmit: ({ value }) =>
                                                value.length === 0 ? t("error.ingre-name") : undefined,
                                            onChange: ({ value }) =>
                                                value.length > 255 ? t("error.too-long") : undefined,
                                        }}
                                    >
                                        {(f) => (
                                            <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                                                <Input
                                                    value={f.state.value}
                                                    onChange={(e) => f.handleChange(e.target.value)}
                                                    placeholder={t("placeholder.name-ingredients")}
                                                    aria-invalid={f.state.meta.errors.length > 0}
                                                />
                                                <FieldErrors errors={f.state.meta.errors} />
                                            </div>
                                        )}
                                    </form.Field>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="sm:order-last"
                                        onClick={() => ingredients.removeValue(index)}
                                    >
                                        <X className="size-4" />
                                        <span className="sr-only">{tg("accessibility.remove")}</span>
                                    </Button>
                                    <form.Field
                                        name={`ingredients[${index}].amount`}
                                        validators={{
                                            onSubmit: ({ value }) => (!value ? t("error.ingre-amount") : undefined),
                                        }}
                                    >
                                        {(f) => (
                                            <div className="flex flex-col gap-1">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step="any"
                                                    value={f.state.value || ""}
                                                    onChange={(e) => f.handleChange(Number(e.target.value))}
                                                    placeholder={t("placeholder.amount")}
                                                    className={NO_SPINNER}
                                                    aria-invalid={f.state.meta.errors.length > 0}
                                                />
                                                <FieldErrors errors={f.state.meta.errors} />
                                            </div>
                                        )}
                                    </form.Field>
                                    <form.Field name={`ingredients[${index}].unit`}>
                                        {(f) => (
                                            <Select
                                                value={f.state.value}
                                                onValueChange={(v) => f.handleChange(v as Units)}
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
                                        )}
                                    </form.Field>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                className="self-start"
                                onClick={() => ingredients.pushValue({ name: "", amount: 0, unit: Units.Gram })}
                            >
                                <PlusIcon className="size-4" />
                                {t("button.add-ingredient")}
                            </Button>
                        </div>
                    )}
                </form.Field>
            </FormSection>

            <Separator />

            <FormSection
                icon={CookingPotIcon}
                title={t("stepper.steps-title")}
                description={t("stepper.steps-description")}
            >
                <form.Field name="steps" mode="array">
                    {(steps) => (
                        <div className="flex flex-col gap-3">
                            {steps.state.value.map((_, index) => (
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
                                                    value={f.state.value}
                                                    onChange={(e) => f.handleChange(e.target.value)}
                                                    placeholder={t("placeholder.step")}
                                                    className="h-20 resize-none"
                                                    aria-invalid={f.state.meta.errors.length > 0}
                                                />
                                                <FieldErrors errors={f.state.meta.errors} />
                                            </div>
                                        )}
                                    </form.Field>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="mt-1"
                                        onClick={() => steps.removeValue(index)}
                                    >
                                        <X className="size-4" />
                                        <span className="sr-only">{tg("accessibility.remove")}</span>
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                className="self-start"
                                onClick={() => steps.pushValue({ index: steps.state.value.length, step: "" })}
                            >
                                <PlusIcon className="size-4" />
                                {t("button.add-step")}
                            </Button>
                        </div>
                    )}
                </form.Field>
            </FormSection>

            <Separator />

            <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                    <Button type={"submit"} className="self-end" disabled={isSubmitting}>
                        {isSubmitting && <Spinner />}
                        {props.formData ? t("button.update") : t("button.create")}
                    </Button>
                )}
            </form.Subscribe>
        </Form>
    );
}

/**
 * The properties for {@link FormSection}
 */
type FormSectionProps = {
    /** Icon shown next to the title */
    icon: LucideIcon;
    /** Title of the section */
    title: string;
    /** Short explanation of the section */
    description: string;
    /** The fields of the section */
    children: React.ReactNode;
};

/**
 * A section of the form with its title on the left (stacked on small screens) and its fields on the right
 */
function FormSection(props: FormSectionProps) {
    const Icon = props.icon;
    return (
        <section className="grid gap-4 lg:grid-cols-[16rem_1fr] lg:gap-8">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <Icon className="text-muted-foreground size-4 shrink-0" />
                    <Subheading level={2}>{props.title}</Subheading>
                </div>
                <Text className="text-sm/6 sm:text-sm/6">{props.description}</Text>
            </div>
            <div className="min-w-0">{props.children}</div>
        </section>
    );
}

/**
 * Renders the validation errors of a field
 */
function FieldErrors(props: { errors: Array<string | undefined> }) {
    return props.errors.map((err) => err && <ErrorMessage key={err}>{err}</ErrorMessage>);
}

/**
 * The properties for {@link TagPicker}
 */
type TagPickerProps = {
    /** All tags that can be selected */
    available: Array<SimpleTag>;
    /** The currently selected tags */
    selected: Array<SimpleTag>;
    /** Called when a tag is selected */
    onAdd: (tag: SimpleTag) => void;
    /** Called with the index of the selected tag that should be removed */
    onRemove: (index: number) => void;
};

/**
 * Shows the selected tags as badges with a searchable popover to add more
 */
function TagPicker(props: TagPickerProps) {
    const [t] = useTranslation("recipe");
    const [open, setOpen] = React.useState(false);

    const selectable = props.available.filter((tag) => !props.selected.some((s) => s.uuid === tag.uuid));

    return (
        <div className="flex flex-wrap items-center gap-2">
            {props.selected.map((tag, index) => (
                <Badge key={tag.uuid} variant={tagVariant(tag)}>
                    {tag.name}
                    <button type="button" className="hover:opacity-70" onClick={() => props.onRemove(index)}>
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                    render={<Button type="button" variant="outline" size="sm" role="combobox" aria-expanded={open} />}
                >
                    <PlusIcon className="size-3.5" />
                    {t("button.add-tags")}
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                    <Command>
                        <CommandInput placeholder={t("placeholder.select-tags")} />
                        <CommandList>
                            <CommandEmpty>{t("placeholder.tags-empty")}</CommandEmpty>
                            <CommandGroup>
                                {selectable.map((tag) => (
                                    <CommandItem
                                        key={tag.uuid}
                                        value={tag.name}
                                        onSelect={() => {
                                            props.onAdd(tag);
                                            setOpen(false);
                                        }}
                                    >
                                        <Badge variant={tagVariant(tag)}>{tag.name}</Badge>
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

/** The badge variant matching the color of a tag */
function tagVariant(tag: SimpleTag) {
    return tag.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"];
}
