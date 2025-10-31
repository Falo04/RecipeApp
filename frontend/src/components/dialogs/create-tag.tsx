import { Api } from "@/api/api";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, Input } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useForm } from "@tanstack/react-form";
import { Badge, badgeVariants } from "../ui/badge";
import type { VariantProps } from "class-variance-authority";
import { ErrorMessage } from "@/components/ui/text.tsx";
import { TagColors } from "@/api/generated";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field.tsx";
import { isFormError } from "@/utils/error.ts";

/**
 * The properties for {@link CreateTagDialog}
 */
export type CreateTagDialogProps = {
    /** On close */
    onClose: () => void;
};

/**
 * Dialog for creating tags
 */
export function CreateTagDialog(props: CreateTagDialogProps) {
    const [t] = useTranslation("tag");
    const [tg] = useTranslation();

    const form = useForm({
        defaultValues: {
            name: "",
            color: TagColors.Blue as TagColors,
        },
        validators: {
            onSubmitAsync: async ({ value }) => {
                const res = await Api.tags.create({ name: value.name, color: value.color });

                if (isFormError(res)) {
                    return {
                        fields: {
                            name: res.error.name_already_exists ? t("error.name-already-exists") : undefined,
                        },
                    };
                }
            },
        },
        onSubmit: async () => {
            toast.success("toast.created-success");
            props.onClose();
        },
    });

    return (
        <Dialog open={true} onOpenChange={props.onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("dialog.create-title")}</DialogTitle>
                    <DialogDescription>{t("dialog.create-description")}</DialogDescription>
                </DialogHeader>
                <Form onSubmit={form.handleSubmit}>
                    <FieldSet>
                        <FieldGroup>
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
                                    <Field>
                                        <FieldLabel htmlFor="name">{tg("label.name")}</FieldLabel>
                                        <Input
                                            id="name"
                                            value={fieldApi.state.value}
                                            onChange={(e) => fieldApi.handleChange(e.target.value)}
                                            placeholder="name"
                                        />
                                        {fieldApi.state.meta.errors.map((err) => (
                                            <ErrorMessage key={err}>{err}</ErrorMessage>
                                        ))}
                                    </Field>
                                )}
                            </form.Field>
                            <form.Field name="color">
                                {(fieldApi) => (
                                    <Field>
                                        <FieldLabel htmlFor="create-tag">{tg("label.color")}</FieldLabel>
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
                                    </Field>
                                )}
                            </form.Field>
                            <DialogFooter>
                                <Field orientation={"horizontal"}>
                                    <Button type="button" variant="secondary" onClick={() => props.onClose()}>
                                        {tg("button.close")}
                                    </Button>
                                    <Button type="submit">{t("button.create")}</Button>
                                </Field>
                            </DialogFooter>
                        </FieldGroup>
                    </FieldSet>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
