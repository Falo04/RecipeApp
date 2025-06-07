import { Api } from "@/api/api";
import { Units } from "@/api/model/ingredients.interface";
import type { CreateRecipeRequest, FullRecipe, UpdateRecipeRequest } from "@/api/model/recipe.interface";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import TAGS_CONTEXT from "@/context/tags";
import USER_CONTEXT from "@/context/user";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, ArrowRight, MinusIcon, PlusIcon, X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CommandEmpty, CommandItem, Command, CommandGroup, CommandList, CommandInput } from "./ui/command";
import { Badge, badgeVariants } from "./ui/badge";
import type { VariantProps } from "class-variance-authority";
import { Text } from "@/components/ui/text.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { AnimatePresence, motion } from "framer-motion";

/**
 * The properties for {@link RecipeForm}
 */
export type RecipeFormProps = {
    formData?: FullRecipe;
    navigate: (uuid: string) => void;
    onClose: () => void;
};

/**
 * The RecipeForm
 */
export function RecipeForm(props: RecipeFormProps) {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const [open, setOpen] = React.useState(false);
    const [state, setState] = React.useState(0);
    const [ingreName, setIngreName] = React.useState<string>("");
    const [ingreNameError, setIngreNameError] = React.useState<string | undefined>(undefined);
    const [ingreAmount, setIngreAmount] = React.useState<number>(0);
    const [ingreAmountError, setIngreAmountError] = React.useState<string | undefined>(undefined);
    const [ingreUnit, setIngreUnit] = React.useState<Units>(Units.Gram);
    const [ingreUnitError, setIngreUnitError] = React.useState<string | undefined>(undefined);

    const tagContext = React.useContext(TAGS_CONTEXT);
    const userContext = React.useContext(USER_CONTEXT);

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
        onSubmit: async ({ value }) => {
            if (props.formData) {
                const payload: UpdateRecipeRequest = {
                    user: userContext.user !== undefined ? userContext.user.uuid : undefined,
                    tags: value.tags.map((tag) => tag.uuid),
                    name: value.name,
                    description: value.description,
                    ingredients: value.ingredients,
                    steps: value.steps.map((s, idx) => ({ index: idx, step: s.step })),
                };
                toast.promise(Api.recipe.update(props.formData.uuid, payload), {
                    loading: tg("toast.loading"),
                    success: (result) => {
                        if (result.error) {
                            toast.error(result.error.message);
                            return;
                        }

                        props.navigate(props.formData!.uuid);
                        return tg("toast.updated-success");
                    },
                    error: () => tg("toast.general-error"),
                });
            } else {
                const payload: CreateRecipeRequest = {
                    user: userContext.user !== undefined ? userContext.user.uuid : undefined,
                    tags: value.tags.map((tag) => tag.uuid),
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
                            props.navigate(result.data.uuid);
                            return tg("toast.created-success");
                        }
                    },
                    error: () => tg("toast.general-error"),
                });
            }
        },
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
            }}
            className="flex h-full flex-col justify-between gap-4 lg:h-fit lg:justify-start lg:px-8"
        >
            <AnimatePresence initial={false} mode={"popLayout"}>
                {state === 0 && (
                    <motion.div key={"meta-data-recipes"} initial={initial} animate={animate} exit={exit}>
                        <div className="flex flex-col gap-5 pb-4">
                            <form.Field
                                name="name"
                                validators={{
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
                            <form.Field name={"tags"}>
                                {(field) => (
                                    <div className={"flex gap-4"}>
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
                                                    <CommandInput placeholder="Search Tag..." className="h-9" />
                                                    <CommandList>
                                                        <CommandEmpty>No tag found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {tagContext.tags.items.map((item) => (
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
                                    </div>
                                )}
                            </form.Field>
                        </div>
                    </motion.div>
                )}

                {state === 1 && (
                    <motion.div key={"ingredients-recipes"} initial={initial} animate={animate} exit={exit}>
                        <form.Field
                            name="ingredients"
                            mode="array"
                            children={(ingredients) => (
                                <div className={"flex flex-col gap-6"}>
                                    <div className={"flex justify-between"}>
                                        <h2>{tg("label.ingredients-title")}</h2>
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
                                                    ingredients.pushValue({
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
                                            <div className={"col-span-2 flex flex-col gap-2 lg:col-span-1"}>
                                                <Input
                                                    onChange={(e) => {
                                                        setIngreName(e.target.value);
                                                        setIngreNameError(undefined);
                                                    }}
                                                    value={ingreName}
                                                    placeholder="Name"
                                                />
                                                {ingreNameError && (
                                                    <p className="text-sm text-red-500">{ingreNameError}</p>
                                                )}
                                            </div>
                                            <div className={"flex flex-col gap-2"}>
                                                <Input
                                                    type="number"
                                                    onChange={(e) => {
                                                        setIngreAmount(parseInt(e.target.value));
                                                        setIngreAmountError(undefined);
                                                    }}
                                                    value={ingreAmount}
                                                    placeholder="Amount"
                                                />
                                                {ingreAmountError && (
                                                    <p className="text-sm text-red-500">{ingreAmountError}</p>
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
                                                    <p className="text-sm text-red-500">{ingreUnitError}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <ScrollArea className={"h-[40vh]"}>
                                        <Table className={"border-t"}>
                                            <TableBody>
                                                {ingredients.state.value.map((ingre, index) => (
                                                    <TableRow
                                                        key={index}
                                                        className={"grid grid-cols-[1fr_1fr_1fr_auto] gap-2"}
                                                    >
                                                        <TableCell>
                                                            <Text>{ingre.name}</Text>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Text>{ingre.amount}</Text>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Text>{ingre.unit}</Text>
                                                        </TableCell>
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
                                    </ScrollArea>
                                </div>
                            )}
                        />
                    </motion.div>
                )}
                {state === 2 && (
                    <motion.div key={"steps-recipes"} initial={initial} animate={animate} exit={exit}>
                        <div className={"flex flex-col gap-4"}>
                            <div className="flex justify-between">
                                <h2>{tg("label.step-title")}</h2>
                                <Button type="button" onClick={() => form.pushFieldValue("steps", { step: "" })}>
                                    <PlusIcon />
                                </Button>
                            </div>
                            <ScrollArea className={"h-[55vh]"}>
                                <form.Field name="steps">
                                    {(fieldArray) => (
                                        <div className="flex flex-col gap-4">
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
                        </div>
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
        </form>
    );
}
