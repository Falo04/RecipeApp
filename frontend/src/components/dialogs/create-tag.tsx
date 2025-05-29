import { Api } from "@/api/api";
import { TagColors, type CreateOrUpdateTag } from "@/api/model/tag.interface";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FormLabel } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import React from "react";
import TAGS_CONTEXT from "@/context/tags";
import { useForm } from "@tanstack/react-form";
import { Badge, badgeVariants } from "../ui/badge";
import type { VariantProps } from "class-variance-authority";

export type CreateTagDialogProps = {
    onClose: () => void;
};

export function CreateTagDialog(props: CreateTagDialogProps) {
    const [t] = useTranslation("tag");
    const [tg] = useTranslation();
    const tagContext = React.useContext(TAGS_CONTEXT);

    const form = useForm({
        defaultValues: {
            name: "",
            color: TagColors.Blue,
        },
        onSubmit: async (values) => {
            console.log(values);
            const payload: CreateOrUpdateTag = {
                name: values.value.name,
                color: values.value.color,
            };

            toast.promise(Api.tags.create(payload), {
                loading: tg("toast.loading"),
                success: (result) => {
                    if (result.error) {
                        toast.error(result.error.message);
                        return;
                    }

                    if (result.data) {
                        tagContext.reset();
                        props.onClose();
                        return tg("toast.created-success");
                    }
                },
                error: () => {
                    return tg("toast.general-error");
                },
            });
        },
    });

    return (
        <Dialog open={true} onOpenChange={props.onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("dialog.create-title")}</DialogTitle>
                    <DialogDescription>{t("dialog.create-description")}</DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                    className="space-y-8"
                >
                    <form.Field
                        name="name"
                        validators={{
                            onChange: ({ value }) =>
                                !value ? "Name is required" : value.length > 255 ? "Too long" : undefined,
                        }}
                        children={(field) => (
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
                    />
                    <form.Field
                        name="color"
                        children={(field) => (
                            <div>
                                <FormLabel htmlFor="create-tag">{tg("label.color")}</FormLabel>
                                <Select
                                    value={field.state.value}
                                    onValueChange={(val) => field.setValue(val as TagColors)}
                                >
                                    <div>
                                        <SelectTrigger id={"create-tag"} className="w-full">
                                            <SelectValue placeholder="Select a color" />
                                        </SelectTrigger>
                                    </div>
                                    <SelectContent>
                                        {Object.keys(TagColors).map((color) => (
                                            <SelectItem key={`create-tag_${color}`} value={color}>
                                                <Badge
                                                    variant={
                                                        color.toLowerCase() as VariantProps<
                                                            typeof badgeVariants
                                                        >["variant"]
                                                    }
                                                >
                                                    {color}
                                                </Badge>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    />
                    <DialogFooter>
                        <div className="flex w-full justify-between">
                            <Button type="button" variant="secondary" onClick={() => props.onClose()}>
                                {tg("button.close")}
                            </Button>
                            <Button variant={"primary"} type="submit">
                                {t("button.create")}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
