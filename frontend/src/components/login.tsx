import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Api } from "@/api/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Form, FormLabel, Input } from "./ui/form";
import type { UserSignInRequest } from "@/api/model/jwt.interface";
import { ErrorMessage } from "@/components/ui/text.tsx";

/**
 * The properties for {@link Login}
 */
export type LoginProps = {
    onLogin: () => void;
};

/**
 * The Login view
 */
export function Login(props: LoginProps) {
    const [t] = useTranslation("login");
    const [tg] = useTranslation();

    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        onSubmit: async (values) => {
            const payload: UserSignInRequest = {
                email: values.value.email,
                password: values.value.password,
            };

            // Show loading toast while request is being processed
            toast.promise(Api.jwt.login(payload), {
                loading: tg("toast.loading"), // The message shown while loading
                success: (result) => {
                    if (result.error) {
                        toast.error(result.error.message);
                        return;
                    }

                    if (result.data) {
                        localStorage.setItem("access_token", result.data.token);
                        props.onLogin();
                        return t("toast.login-success");
                    }
                },
                error: () => {
                    return t("toast.login-failed");
                },
            });
        },
    });

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="test-2xl">{t("login.title")}</CardTitle>
                            <CardDescription>{t("login.description")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form onSubmit={form.handleSubmit}>
                                <form.Field
                                    name="email"
                                    validators={{
                                        onChange: ({ value }) =>
                                            value.includes("@") ? undefined : t("error.invalid-email"),
                                    }}
                                >
                                    {(fieldApi) => (
                                        <div>
                                            <FormLabel htmlFor="email">{tg("label.email")}</FormLabel>
                                            <Input
                                                id="email"
                                                placeholder={t("placeholder.email")}
                                                value={fieldApi.state.value}
                                                onChange={(e) => fieldApi.handleChange(e.target.value)}
                                            />
                                            {fieldApi.state.meta.errors.map((err) => (
                                                <ErrorMessage key={err}>{err}</ErrorMessage>
                                            ))}
                                        </div>
                                    )}
                                </form.Field>
                                <form.Field
                                    name="password"
                                    validators={{
                                        onChange: ({ value }) =>
                                            value.length >= 3 ? undefined : t("error.password-too-short"),
                                    }}
                                >
                                    {(fieldApi) => (
                                        <div>
                                            <FormLabel htmlFor="password">{tg("label.password")}</FormLabel>
                                            <Input
                                                id="password"
                                                placeholder={t("placeholder.password")}
                                                value={fieldApi.state.value}
                                                onChange={(e) => fieldApi.handleChange(e.target.value)}
                                            />
                                            {fieldApi.state.meta.errors.map((err) => (
                                                <ErrorMessage key={err}>{err}</ErrorMessage>
                                            ))}
                                        </div>
                                    )}
                                </form.Field>
                                <Button type="submit">{t("button.login")}</Button>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
