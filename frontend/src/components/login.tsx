import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { Api } from '@/api/api';
import type { UserSignInRequest } from '@/api/model/jwt.interface';

/**
  * The properties for {@link Login}
  */
export type LoginProps = {
  onLogin: () => void;
};

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string(),
});

/**
  * The Login
  */
export function Login(props: LoginProps) {
  const [tg] = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const payload: UserSignInRequest = {
      email: values.email,
      password: values.password,
    };

    // Show loading toast while request is being processed
    toast.promise(
      // The API request
      Api.jwt.login(payload),
      {
        loading: tg("toast.login-loading"), // The message shown while loading
        success: (result) => {
          // Assuming response.data matches TokenDataReponse structure

          if (result.error) {
            toast.error(result.error.message);
            return;
          }

          if (result.data) {
            localStorage.setItem("access_token", result.data.token);
            props.onLogin();
            return tg("toast.login-success");
          }
        },
        error: () => {
          return tg("toast.login-failed");
        }
      }
    );
  }

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <div className='flex flex-col gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='test-2xl'>{tg("login.title")}</CardTitle>
              <CardDescription>{tg("login.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tg("label.email")}</FormLabel>
                        <FormControl>
                          <Input placeholder={tg("placeholder.email")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tg("label.password")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={tg("placeholder.password")} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit">{tg("button.login")}</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div >
    </div >
  );
}
