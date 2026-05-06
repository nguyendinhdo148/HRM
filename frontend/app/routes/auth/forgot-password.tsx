import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForgotPasswordMutation } from "@/hooks/use-Auth";
import { forgotPasswordSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle, Loader2, Wrench } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import type { z } from "zod";

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutate: forgotPassword, isPending } = useForgotPasswordMutation();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message;
        toast.error(errorMessage);
      },
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 
      bg-gradient-to-br from-slate-50 via-white to-slate-100"
    >
      {/* Background blur */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border border-border/50 backdrop-blur-sm">
        {/* ===== HEADER ===== */}
        <CardHeader className="space-y-4">
          {/* Back */}
          <Link
            to="/sign-in"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          {/* Logo + Brand */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Wrench className="w-6 h-6 text-white" />
            </div>

            <span
              className="text-xl font-bold tracking-wide 
              bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
              bg-clip-text text-transparent"
            >
              botdev789
            </span>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold">Forgot Password</h1>
            <p className="text-muted-foreground text-sm">
              Enter your email to reset your password
            </p>
          </div>
        </CardHeader>

        {/* ===== CONTENT ===== */}
        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center text-center space-y-3 py-4">
              <CheckCircle className="w-12 h-12 text-green-500" />

              <h2 className="text-lg font-semibold">Email sent successfully</h2>

              <p className="text-muted-foreground text-sm">
                Check your inbox for the reset link.
              </p>

              <Link to="/sign-in">
                <Button className="mt-2">Back to Sign In</Button>
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="email@example.com"
                          className="h-11 focus-visible:ring-2 focus-visible:ring-indigo-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold 
                  bg-indigo-600 hover:bg-indigo-700 transition-all"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
