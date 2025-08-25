import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

/**
 * The properties for {@link Login}
 */
export type LoginProps = {
    onLogin: () => void;
};

/**
 * The Login view
 */
export function Login() {
    const [t] = useTranslation("login");

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="test-2xl">{t("login.title")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <a className={"w-full"} href={"/api/v1/oidc/begin-login"}>
                                {t("button.sign-in-with-sso-customer")}
                            </a>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
