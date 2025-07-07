import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import React, { Suspense } from "react";
import TAGS_CONTEXT from "@/context/tags.tsx";
import { useForm } from "@tanstack/react-form";
import { type CreateOrUpdateTag, type SimpleTag, TagColors } from "@/api/model/tag.interface.ts";
import { toast } from "sonner";
import { Api } from "@/api/api.tsx";
import { FormLabel } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button.tsx";
import { DeleteTagDialog } from "@/components/dialogs/delete-tag.tsx";
import SINGLE_TAG_CONTEXT from "@/context/tag.tsx";

/**
 * The properties for {@link TagDetail}
 */
export type TagDetailProps = {};

/**
 * View for seeing all information for a single tag
 */
export function TagDetail(_props: TagDetailProps) {
    const [t] = useTranslation("tag");
    const [tg] = useTranslation();
    const tagContext = React.useContext(TAGS_CONTEXT);
    const { tag } = React.useContext(SINGLE_TAG_CONTEXT);

    const [openDeleteTag, setOpenDeleteTag] = React.useState<SimpleTag | undefined>(undefined);

    const form = useForm({
        defaultValues: {
            name: tag.name,
            color: tag.color,
        },
        onSubmit: async (values) => {
            const payload: CreateOrUpdateTag = {
                name: values.value.name,
                color: values.value.color,
            };

            console.log(values, payload);

            toast.promise(Api.tags.update(tag.uuid, payload), {
                loading: tg("toast.loading"),
                success: (result) => {
                    if (result.error) {
                        toast.error(result.error.message);
                        return;
                    }

                    tagContext.reset();
                    return t("toast.updated-success");
                },
                error: () => {
                    return tg("toast.general-error");
                },
            });
        },
    });

    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className="max-w-lg space-y-8"
            >
                <form.Field
                    name="name"
                    validators={{
                        onChange: ({ value }) =>
                            !value ? t("error.name-required") : value.length > 255 ? t("error.too-long") : undefined,
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
                            {field.state.meta.errors.map((err) => (
                                <p className="text-sm text-red-500">{err}</p>
                            ))}
                        </div>
                    )}
                />
                <form.Field
                    name="color"
                    children={(field) => (
                        <div>
                            <FormLabel htmlFor="create-tag">{tg("label.color")}</FormLabel>
                            <Select value={field.state.value} onValueChange={(val) => field.setValue(val as TagColors)}>
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
                                                    color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]
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
                <div className="flex w-full justify-between">
                    <Button variant={"destructive"} type={"button"} onClick={() => setOpenDeleteTag(tag)}>
                        {t("button.delete")}
                    </Button>
                    <Button type={"submit"}>{t("button.update")}</Button>
                </div>
            </form>
            {openDeleteTag && (
                <Suspense>
                    <DeleteTagDialog
                        tag={openDeleteTag}
                        onClose={() => setOpenDeleteTag(undefined)}
                        onDeletion={() => {
                            setOpenDeleteTag(undefined);
                            tagContext.reset();
                        }}
                    />
                </Suspense>
            )}
        </>
    );
}

export const Route = createFileRoute("/_app/app/tags/$tagId/_tag/info")({
    component: TagDetail,
});
