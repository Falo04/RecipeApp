import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import axios from 'axios';
import type { TokenDataReponse, UserSignInRequest } from '@/api/models/jwt.interface';
import type { ApiError } from '@/api/models/global.interface'; // Assuming you have this type defined
import { toast } from 'sonner';
import { ApiClient } from '@/api/api-client';

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
  const [t] = useTranslation();

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
    const toastId = toast.promise(
      // The API request
      ApiClient.post("/jwt/login", payload),
      {
        loading: 'Logging in...', // The message shown while loading
        success: (data) => {
          // Assuming response.data matches TokenDataReponse structure
          const tokenData: TokenDataReponse = data.data;

          // Store token in localStorage if it's received
          if (tokenData?.token) {
            localStorage.setItem("access_token", tokenData.token);
            props.onLogin();
            return 'Logged in successfully!'; // Success message
          } else {
            return 'Token not found in response.'; // Success message when token is missing
          }
        },
        error: (error: any) => {
          if (axios.isAxiosError(error) && error.response) {
            // Handle API error response
            const apiError: ApiError = error.response.data; // Assuming response data follows ApiError shape
            return `Error: ${apiError.message}`; // Displaying message from ApiError
          } else {
            return 'Login failed. Please try again.';
          }
        },
      }
    );
  }

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <div className='flex flex-col gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='test-2xl'>{t("card.title")}</CardTitle>
              <CardDescription>{t("card.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("label.email")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Email" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("label.password")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Password" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div >
    </div >
  );
}

