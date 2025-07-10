import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import React, { Suspense } from "react";
import TAGS_CONTEXT from "@/context/tags.tsx";
import { useForm } from "@tanstack/react-form";
import { type CreateOrUpdateTag, type SimpleTag, TagColors } from "@/api/model/tag.interface.ts";
import { toast } from "sonner";
import { Api } from "@/api/api.tsx";
import { FormLabel, Input, Form } from "@/components/ui/form.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button.tsx";
import { DeleteTagDialog } from "@/components/dialogs/delete-tag.tsx";
import SINGLE_TAG_CONTEXT from "@/context/tag.tsx";
import { ErrorMessage } from "@/components/ui/text.tsx";

/**
 * The properties for {@link TagDetail}
 */
export type TagDetailProps = object;

/**
 * View for seeing all information for a single tag
 */
export function TagDetail() {
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
            <Form onSubmit={form.handleSubmit}>
                <form.Field
                    name="name"
                    validators={{
                        onChange: ({ value }) =>
                            !value ? t("error.name-required") : value.length > 255 ? t("error.too-long") : undefined,
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
                                                    color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]
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
                <div className="flex w-full justify-between">
                    <Button variant={"destructive"} type={"button"} onClick={() => setOpenDeleteTag(tag)}>
                        {t("button.delete")}
                    </Button>
                    <Button type={"submit"}>{t("button.update")}</Button>
                </div>
            </Form>
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

export const Route = createFileRoute("/_app/app/tags/$tagId/_tag/general")({
    component: TagDetail,
});
