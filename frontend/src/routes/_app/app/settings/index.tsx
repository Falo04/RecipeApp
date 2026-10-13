import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import { useForm } from "@tanstack/react-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import i18n from "@/i18n.ts";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useLogout } from "@/api/generated";
import { Separator } from "@/components/ui/separator.tsx";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field.tsx";
import { Form } from "@/components/ui/form.tsx";

/**
 * The properties for {@link Settings}
 */
export type SettingsProps = object;

/**
 * Settings component
 */
export function Settings() {
    const [t] = useTranslation("settings");
    const [tg] = useTranslation();

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const logoutMutation = useLogout();

    const form = useForm({
        defaultValues: {
            language: i18n.language,
            appearance: localStorage.getItem("theme") ?? "dark",
        },
        onSubmit: ({ value }) => {
            i18n.changeLanguage(value.language.toLowerCase()).then();
            if (value.appearance === "light") {
                localStorage.setItem("theme", "light");
            } else {
                localStorage.setItem("theme", "dark");
            }

            if (
                localStorage.theme === "dark" ||
                (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark").matches)
            ) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
            toast.success(t("toast.success"));
        },
    });

    const logout = async () => {
        await logoutMutation.mutateAsync();
        // Nothing cached belongs to the next account
        queryClient.clear();
        await navigate({ to: "/" });
    };

    return (
        <HeadingLayout
            heading={t("heading.title")}
            description={t("heading.description")}
            breadcrumbs={[{ label: tg("menu.settings") }]}
        >
            <Form onSubmit={form.handleSubmit}>
                <FieldSet>
                    <FieldGroup>
                        <form.Field name="language">
                            {(field) => (
                                <Field className={"grid grid-cols-3 gap-3 sm:col-span-2"}>
                                    <FieldLabel htmlFor="language">{tg("label.language")}</FieldLabel>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(e) => (e ? field.handleChange(e) : undefined)}
                                    >
                                        <SelectTrigger id={"language"} className={"col-span-2 w-full"}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={"de"} key={"de"}>
                                                {tg("label.de")}
                                            </SelectItem>
                                            <SelectItem value={"en"} key={"en"}>
                                                {tg("label.en")}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            )}
                        </form.Field>
                        <form.Field name="appearance">
                            {(field) => (
                                <Field className={"grid grid-cols-3 gap-3 sm:col-span-2"}>
                                    <FieldLabel htmlFor="appearance">{tg("label.appearance")}</FieldLabel>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(e) => (e ? field.handleChange(e) : undefined)}
                                    >
                                        <SelectTrigger id={"appearance"} className={"col-span-2 w-full"}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={"dark"} key={"dark"}>
                                                {tg("label.dark")}
                                            </SelectItem>
                                            <SelectItem value={"light"} key={"light"}>
                                                {tg("label.light")}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            )}
                        </form.Field>
                    </FieldGroup>
                </FieldSet>
                <Separator />
                <div className={"flex justify-between pt-4"}>
                    <Button type={"button"} variant={"ghost"} onClick={() => logout()}>
                        {t("button.logout")}
                    </Button>
                    <Button type={"submit"} className={"mr-4"}>
                        {t("button.update")}
                    </Button>
                </div>
            </Form>
        </HeadingLayout>
    );
}

export const Route = createFileRoute("/_app/app/settings/")({
    component: Settings,
});
