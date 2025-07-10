import { Api } from "@/api/api";
import { TagColors, type CreateOrUpdateTag } from "@/api/model/tag.interface";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { FormLabel, Input } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import React from "react";
import TAGS_CONTEXT from "@/context/tags";
import { useForm } from "@tanstack/react-form";
import { Badge, badgeVariants } from "../ui/badge";
import type { VariantProps } from "class-variance-authority";
import { ErrorMessage } from "@/components/ui/text.tsx";

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
                        return t("toast.created-success");
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
            <DialogContent size={"sm"}>
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
                                !value
                                    ? t("error.name-required")
                                    : value.length > 255
                                      ? t("error.too-long")
                                      : undefined,
                        }}
                    >
                        {(fieldApi) => (
                            <>
                                <FormLabel htmlFor="name">{tg("label.name")}</FormLabel>
                                <Input
                                    id="name"
                                    value={fieldApi.state.value}
                                    onChange={(e) => fieldApi.handleChange(e.target.value)}
                                    placeholder="name"
                                />
                                {fieldApi.state.meta.errors.map((err) => (
                                    <ErrorMessage key={err}>{err}</ErrorMessage>
                                ))}
                            </>
                        )}
                    </form.Field>
                    <form.Field name="color">
                        {(fieldApi) => (
                            <>
                                <FormLabel htmlFor="create-tag">{tg("label.color")}</FormLabel>
                                <Select
                                    value={fieldApi.state.value}
                                    onValueChange={(val) => fieldApi.setValue(val as TagColors)}
                                >
                                    <div>
                                        <SelectTrigger id={"create-tag"} className="w-full">
                                            <SelectValue placeholder={t("placeholder.empty")} />
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
                            </>
                        )}
                    </form.Field>
                    <DialogFooter>
                        <div className="flex w-full justify-between">
                            <Button type="button" variant="secondary" onClick={() => props.onClose()}>
                                {tg("button.close")}
                            </Button>
                            <Button type="submit">{t("button.create")}</Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
