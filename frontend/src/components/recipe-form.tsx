import { Api } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Form, Input } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import TAGS_CONTEXT from "@/context/tags";
import { useForm } from "@tanstack/react-form";
import {
    ArrowLeft,
    ArrowRight,
    CookingPotIcon,
    LucideCarrot,
    MinusIcon,
    PlusIcon,
    ReceiptTextIcon,
    X,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CommandEmpty, CommandItem, Command, CommandGroup, CommandList, CommandInput } from "./ui/command";
import { Badge, badgeVariants } from "./ui/badge";
import type { VariantProps } from "class-variance-authority";
import { ErrorMessage } from "@/components/ui/text.tsx";
import { AnimatePresence, motion } from "framer-motion";
import { Subheading } from "@/components/ui/heading.tsx";
import { type StepperSteps, StepperHorizontal, StepperVertical } from "@/components/ui/stepper.tsx";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import IngredientsGrid from "@/components/ingredients-grid.tsx";
import ACCOUNT_CONTEXT from "@/context/account.tsx";
import SINGLE_RECIPE_CONTEXT from "@/context/recipe.tsx";
import { type CreateOrUpdateRecipe, type FullRecipe, Units } from "@/api/generated";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field.tsx";
import { isFormError } from "@/utils/error.ts";

/**
 * The properties for {@link RecipeForm}
 */
export type RecipeFormProps = {
    /** FullRecipe data to update the recipe */
    formData?: FullRecipe;

    /** Navigate to recipe details view if creating or updating was successful */
    navigate: (uuid: string) => void;
};

/**
 * The RecipeForm for creating or updating a recipe
 */
export function RecipeForm(props: RecipeFormProps) {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const isMobile = useIsMobile();

    const [open, setOpen] = React.useState(false);
    const [state, setState] = React.useState(0);
    const [ingreName, setIngreName] = React.useState<string>("");
    const [ingreNameError, setIngreNameError] = React.useState<string | undefined>(undefined);
    const [ingreAmount, setIngreAmount] = React.useState<number>(0);
    const [ingreAmountError, setIngreAmountError] = React.useState<string | undefined>(undefined);
    const [ingreUnit, setIngreUnit] = React.useState<Units>(Units.Gram);
    const [ingreUnitError, setIngreUnitError] = React.useState<string | undefined>(undefined);

    const tagContext = React.useContext(TAGS_CONTEXT);
    const accountContext = React.useContext(ACCOUNT_CONTEXT);
    const recipeContext = React.useContext(SINGLE_RECIPE_CONTEXT);

    const initial = { x: 50, opacity: 0 };
    const animate = { x: 0, opacity: 1 };
    const exit = { x: -50, opacity: 0 };

    const form = useForm({
        defaultValues: {
            name: props.formData ? props.formData.name : "",
            description: props.formData ? props.formData.description : "",
            ingredients: props.formData ? props.formData.ingredients : [],
            steps: props.formData ? props.formData.steps : [{ step: "" }],
            tags: props.formData ? props.formData.tags : [],
        },
        validators: {
            onSubmitAsync: async ({ value }) => {
                if (props.formData) {
                    const payload: CreateOrUpdateRecipe = {
                        user: accountContext.account !== undefined ? accountContext.account.uuid : undefined,
                        tags: value.tags.map((tag) => tag.uuid),
                        name: value.name,
                        description: value.description,
                        ingredients: value.ingredients,
                        steps: value.steps.map((s, idx) => ({ index: idx, step: s.step })),
                    };
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
                    const payload: CreateOrUpdateRecipe = {
                        user: accountContext.account !== undefined ? accountContext.account.uuid : undefined,
                        tags: value.tags.map((tag) => tag.uuid),
                        name: value.name,
                        description: value.description,
                        ingredients: value.ingredients,
                        steps: value.steps.map((s, idx) => ({ index: idx, step: s.step })),
                    };
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

    const metaErrors = [
        form.getFieldMeta("name")?.errors,
        form.getFieldMeta("description")?.errors,
        form.getFieldMeta("tags")?.errors,
    ].flatMap((e) => (e ? e : []));

    const ingredientsErrors = form.getFieldMeta("ingredients")?.errors || [];
    const stepsErrors = form.getFieldMeta("steps")?.errors || [];
    const singleStepErrors = form
        .getFieldValue("steps")
        .flatMap((_, index) => form.getFieldMeta(`steps[${index}].step`)?.errors || []);

    const hasErrors = (errors: string[][]) => errors.some((e) => e.length > 0);

    const steps: Array<StepperSteps> = [
        {
            title: t("stepper.meta-title"),
            description: t("stepper.meta-description"),
            state: state === 0 ? "active" : state > 0 ? "finished" : "pending",
            errorState: hasErrors([metaErrors]),
            icon: ReceiptTextIcon,
        },
        {
            title: t("stepper.ingredients-title"),
            description: t("stepper.ingredients-description"),
            state: state === 1 ? "active" : state > 1 ? "finished" : "pending",
            errorState: hasErrors([ingredientsErrors]),
            icon: LucideCarrot,
        },
        {
            title: t("stepper.steps-title"),
            description: t("stepper.steps-description"),
            state: state === 2 ? "active" : state > 2 ? "finished" : "pending",
            errorState: hasErrors([stepsErrors, singleStepErrors]),
            icon: CookingPotIcon,
        },
    ];

    return (
        <div className="flex h-full flex-col justify-center gap-4 md:grid md:grid-cols-2">
            {isMobile && <StepperVertical steps={steps} />}
            <Form onSubmit={form.handleSubmit} className={"flex flex-col justify-between gap-4 lg:max-w-lg"}>
                <AnimatePresence initial={false} mode={"popLayout"}>
                    {state === 0 && (
                        <motion.div key={"meta-data-recipes"} initial={initial} animate={animate} exit={exit}>
                            <FieldSet>
                                <FieldGroup>
                                    <form.Field
                                        name="name"
                                        validators={{
                                            onSubmit: ({ value }) =>
                                                value.length === 0 ? t("error.name-required") : undefined,
                                            onChange: ({ value }) =>
                                                value.length > 255 ? t("error.too-long") : undefined,
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
                                            onChange: ({ value }) =>
                                                value.length > 255 ? t("error.too-long") : undefined,
                                        }}
                                    >
                                        {(field) => (
                                            <Field>
                                                <FieldLabel htmlFor="description">{tg("label.description")}</FieldLabel>
                                                <Textarea
                                                    id="description"
                                                    value={field.state.value}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder={t("placeholder.description")}
                                                    className="h-[100px] resize-none"
                                                />
                                                {field.state.meta.errors.map((err) => (
                                                    <ErrorMessage key={err}>{err}</ErrorMessage>
                                                ))}
                                            </Field>
                                        )}
                                    </form.Field>
                                    <form.Field name={"tags"}>
                                        {(field) => (
                                            <Field>
                                                <Popover open={open} onOpenChange={setOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"default"}
                                                            role="combobox"
                                                            aria-expanded={open}
                                                            className="w-fit"
                                                        >
                                                            <PlusIcon /> {t("button.add-tags")}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent side={"bottom"}>
                                                        <Command>
                                                            <CommandInput placeholder={t("placeholder.select-tags")} />
                                                            <CommandList>
                                                                <CommandEmpty>
                                                                    {t("placeholder.tags-empty")}
                                                                </CommandEmpty>
                                                                <CommandGroup>
                                                                    {tagContext.tags.map((item) => (
                                                                        <CommandItem
                                                                            key={item.uuid}
                                                                            value={item.name}
                                                                            onSelect={() => {
                                                                                field.pushValue(item);
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
                                                <div className={"flex flex-wrap gap-4"}>
                                                    {field.state.value.map((item, index) => (
                                                        <Badge
                                                            variant={
                                                                item.color.toLowerCase() as VariantProps<
                                                                    typeof badgeVariants
                                                                >["variant"]
                                                            }
                                                            key={item.uuid}
                                                        >
                                                            {item.name}
                                                            <button
                                                                type={"button"}
                                                                className={"hover:text-blue-200"}
                                                                onClick={() => field.removeValue(index)}
                                                            >
                                                                <X className={"size-4"} />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </Field>
                                        )}
                                    </form.Field>
                                </FieldGroup>
                            </FieldSet>
                        </motion.div>
                    )}

                    {state === 1 && (
                        <motion.div
                            className={"h-full"}
                            key={"ingredients-recipes"}
                            initial={initial}
                            animate={animate}
                            exit={exit}
                        >
                            <FieldSet>
                                <FieldGroup>
                                    <form.Field name="ingredients" mode="array">
                                        {(fieldArrayApi) => (
                                            <Field>
                                                <div className={"flex justify-between"}>
                                                    <Subheading level={2}>{t("heading.ingredients-title")}</Subheading>
                                                    <Button
                                                        type="button"
                                                        onClick={() => {
                                                            if (ingreName.length === 0) {
                                                                setIngreNameError(t("error.ingre-name"));
                                                            }
                                                            if (ingreAmount === 0) {
                                                                setIngreAmountError(t("error.ingre-amount"));
                                                            }
                                                            if (!ingreUnit) {
                                                                setIngreUnitError(t("error.ingre-unit"));
                                                            }
                                                            if (ingreAmountError && ingreNameError && ingreUnitError) {
                                                                return;
                                                            }
                                                            if (ingreName && ingreAmount && ingreUnit) {
                                                                fieldArrayApi.pushValue({
                                                                    name: ingreName ?? "nothing",
                                                                    amount: ingreAmount ?? 0,
                                                                    unit: ingreUnit ?? Units.Teaspoon,
                                                                });
                                                                setIngreName("");
                                                                setIngreAmount(0);
                                                                setIngreUnit(Units.Gram);
                                                            }
                                                        }}
                                                    >
                                                        <PlusIcon />
                                                    </Button>
                                                </div>
                                                <div className="flex justify-between">
                                                    <div className={"grid grid-cols-2 gap-4 lg:grid-cols-3"}>
                                                        <div
                                                            className={
                                                                "col-span-2 flex flex-col gap-0 lg:col-span-1 lg:gap-2"
                                                            }
                                                        >
                                                            <Input
                                                                onChange={(e) => {
                                                                    setIngreName(e.target.value);
                                                                    setIngreNameError(undefined);
                                                                }}
                                                                value={ingreName}
                                                                placeholder={t("placeholder.name-ingredients")}
                                                            />
                                                            {ingreNameError && (
                                                                <ErrorMessage>{ingreNameError}</ErrorMessage>
                                                            )}
                                                        </div>
                                                        <div className={"flex flex-col gap-0 lg:gap-2"}>
                                                            <Input
                                                                type="number"
                                                                onChange={(e) => {
                                                                    setIngreAmount(parseInt(e.target.value));
                                                                    setIngreAmountError(undefined);
                                                                }}
                                                                value={ingreAmount}
                                                                placeholder={t("placeholder.amount")}
                                                            />
                                                            {ingreAmountError && (
                                                                <ErrorMessage>{ingreAmountError}</ErrorMessage>
                                                            )}
                                                        </div>
                                                        <div className={"flex flex-col gap-2"}>
                                                            <Select
                                                                onValueChange={(e) => {
                                                                    setIngreUnit(e as Units);
                                                                    setIngreUnitError(undefined);
                                                                }}
                                                                value={ingreUnit}
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
                                                            {ingreUnitError && (
                                                                <ErrorMessage>{ingreUnitError}</ErrorMessage>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={"h-full"}>
                                                    <IngredientsGrid
                                                        withScrolling={true}
                                                        ingredients={fieldArrayApi.state.value}
                                                        onDelete={(index) => fieldArrayApi.removeValue(index)}
                                                    />
                                                </div>
                                            </Field>
                                        )}
                                    </form.Field>
                                </FieldGroup>
                            </FieldSet>
                        </motion.div>
                    )}
                    {state === 2 && (
                        <motion.div
                            className={"h-full"}
                            key={"steps-recipes"}
                            initial={initial}
                            animate={animate}
                            exit={exit}
                        >
                            <FieldSet>
                                <FieldGroup>
                                    <div className="flex justify-between">
                                        <Subheading level={2}>{t("heading.step-title")}</Subheading>
                                        <Button
                                            type="button"
                                            onClick={() => form.pushFieldValue("steps", { step: "" })}
                                        >
                                            <PlusIcon />
                                        </Button>
                                    </div>
                                    <form.Field name="steps">
                                        {(fieldArray) => (
                                            <div className="flex h-full max-h-[55vh] flex-col gap-4 overflow-y-auto">
                                                {fieldArray.state.value.map((_, index) => (
                                                    <div className={"relative"} key={index}>
                                                        <form.Field
                                                            name={`steps[${index}].step`}
                                                            validators={{
                                                                onSubmit: ({ value }) =>
                                                                    value.length === 0
                                                                        ? t("error.step-length-zero")
                                                                        : undefined,
                                                                onChange: ({ value }) =>
                                                                    value.length > 255
                                                                        ? t("error.step-length-255")
                                                                        : undefined,
                                                            }}
                                                        >
                                                            {(f) => (
                                                                <Field>
                                                                    <FieldLabel
                                                                        htmlFor={"step" + index}
                                                                    >{`${tg("label.steps")} ${index + 1}`}</FieldLabel>
                                                                    <Textarea
                                                                        id={"step" + index}
                                                                        value={f.state.value}
                                                                        onChange={(e) => f.handleChange(e.target.value)}
                                                                        placeholder={t("placeholder.step")}
                                                                        className="h-[100px] resize-none"
                                                                    />
                                                                    {f.state.meta.errors.map((err) => (
                                                                        <ErrorMessage key={err}>{err}</ErrorMessage>
                                                                    ))}
                                                                </Field>
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
                                </FieldGroup>
                            </FieldSet>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-end">
                    {state === 0 && (
                        <Button
                            type={"button"}
                            variant={"secondary"}
                            className={"self-end"}
                            onClick={() => setState(state + 1)}
                        >
                            {t("button.next")} <ArrowRight />
                        </Button>
                    )}
                    {state === 1 && (
                        <div className={"flex w-full justify-between gap-2 lg:w-fit"}>
                            <Button type={"button"} variant={"secondary"} onClick={() => setState(state - 1)}>
                                <ArrowLeft />
                                {t("button.back")}
                            </Button>
                            <Button type={"button"} variant={"secondary"} onClick={() => setState(state + 1)}>
                                {t("button.next")} <ArrowRight />
                            </Button>
                        </div>
                    )}
                    {state === 2 && (
                        <div className={"flex w-full justify-between gap-2 lg:w-fit"}>
                            <Button type={"button"} variant={"secondary"} onClick={() => setState(state - 1)}>
                                <ArrowLeft /> {t("button.back")}
                            </Button>
                            <Button type={"submit"}>{props.formData ? t("button.update") : t("button.create")}</Button>
                        </div>
                    )}
                </div>
            </Form>
            {!isMobile && <StepperHorizontal steps={steps} />}
        </div>
    );
}
