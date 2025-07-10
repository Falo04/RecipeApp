import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import { useForm } from "@tanstack/react-form";
import { FormLabel } from "@/components/ui/form.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import i18n from "@/i18n.ts";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";

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

    return (
        <HeadingLayout heading={t("heading.title")}>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className={"flex h-full flex-col justify-between"}
            >
                <div className={"flex flex-col gap-4 p-4"}>
                    <form.Field name="language">
                        {(field) => (
                            <div className={"grid grid-cols-3 gap-3 sm:col-span-2"}>
                                <FormLabel htmlFor="language">{tg("label.language")}</FormLabel>
                                <Select value={field.state.value} onValueChange={(e) => field.handleChange(e)}>
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
                            </div>
                        )}
                    </form.Field>
                    <form.Field name="appearance">
                        {(field) => (
                            <div className={"grid grid-cols-3 gap-3 sm:col-span-2"}>
                                <FormLabel htmlFor="appearance">{tg("label.appearance")}</FormLabel>
                                <Select value={field.state.value} onValueChange={(e) => field.handleChange(e)}>
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
                            </div>
                        )}
                    </form.Field>
                </div>
                <div className={"flex justify-end p-4"}>
                    <Button type={"submit"}>{t("button.update")}</Button>
                </div>
            </form>
        </HeadingLayout>
    );
}

export const Route = createFileRoute("/_app/app/settings/")({
    component: Settings,
});
