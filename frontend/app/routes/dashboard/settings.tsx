import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/workspace/back-button";
import {
  useChangePassword,
  useUpdateUserProfile,
  useUserProfileQuery,
} from "@/hooks/use-User";
import { useAuth } from "@/provider/auth-context";
import type { User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required" }),
    newPassword: z.string().min(8, { message: "New password is required" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Confirm password is required" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const profileSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  profilePicture: z.string().optional(),
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export type ProfileFormData = z.infer<typeof profileSchema>;

const Settings = () => {
  const { data: user, isPending } = useUserProfileQuery() as {
    data: User;
    isPending: boolean;
  };
  const { logout, updateCurrentUser } = useAuth();
  const navigate = useNavigate();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      profilePicture: user?.profilePicture || "",
    },
    values: {
      name: user?.name || "",
      profilePicture: user?.profilePicture || "",
    },
  });

  const { mutate: updateUserProfile, isPending: isUpdatingProfile } =
    useUpdateUserProfile();
  const {
    mutate: changePassword,
    isPending: isChangingPassword,
    error,
  } = useChangePassword();
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const avatarPreview = useMemo(() => {
    if (!selectedAvatar) {
      return "";
    }

    return URL.createObjectURL(selectedAvatar);
  }, [selectedAvatar]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handlePasswordChange = (values: ChangePasswordFormData) => {
    changePassword(values, {
      onSuccess: () => {
        toast.success(
          "Password updated successfully. You will be logged out. Please login again.",
        );
        form.reset();

        setTimeout(() => {
          logout();
          navigate("/sign-in");
        }, 3000);
      },
      onError: (error: any) => {
        const errorMessage =
          error.response?.data?.error || "Failed to update password";
        toast.error(errorMessage);
        console.log(error);
      },
    });
  };
  const handleAvatarSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      event.target.value = "";
      return;
    }

    setSelectedAvatar(file);
  };
  const handleProfileFormSubmit = (values: ProfileFormData) => {
    const payload: ProfileFormData | FormData = selectedAvatar
      ? (() => {
          const formData = new FormData();
          formData.append("name", values.name);
          formData.append("profilePicture", selectedAvatar);
          return formData;
        })()
      : { name: values.name, profilePicture: values.profilePicture || "" };

    updateUserProfile(payload, {
      onSuccess: (updatedUser: any) => {
        updateCurrentUser({
          name: updatedUser?.name,
          profilePicture: updatedUser?.profilePicture,
        });

        if (updatedUser?.profilePicture) {
          profileForm.setValue("profilePicture", updatedUser.profilePicture);
        }

        setSelectedAvatar(null);

        if (avatarInputRef.current) {
          avatarInputRef.current.value = "";
        }

        toast.success("Profile updated successfully");
  },
  onError: (error: any) => {
        const errorMessage =
          error.response?.data?.error || "Failed to update profile";
        toast.error(errorMessage);
        console.log(error);
      },
    });
  };

  if (isPending)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="space-y-6">
          {/* Personal Information Section */}
          <Card className="border border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>
                Update your personal details and avatar.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(handleProfileFormSubmit)}
                  className="space-y-6"
                >
                  {/* Avatar Section */}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <Avatar className="h-24 w-24 bg-primary/10 flex-shrink-0">
                      <AvatarImage
                        src={
                          avatarPreview ||
                          profileForm.watch("profilePicture") ||
                          user?.profilePicture
                        }
                        alt={user?.name}
                      />
                      <AvatarFallback className="text-2xl font-semibold">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        ref={avatarInputRef}
                        style={{ display: "none" }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => avatarInputRef.current?.click()}
                        className="h-9"
                      >
                        Change Avatar
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        JPG, PNG or GIF. Max 5MB.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="space-y-5">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-9"
                              placeholder="Enter your full name"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user?.email}
                        disabled
                        className="h-9 bg-muted text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your email address cannot be changed.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isUpdatingProfile || isPending}
                    className="h-9"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="border border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Security</CardTitle>
              <CardDescription>
                Update your password and security settings.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handlePasswordChange)}
                  className="space-y-5"
                >
                  {error && (
                    <Alert
                      variant="destructive"
                      className="border-red-200 bg-red-50/50 dark:bg-red-950/20"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {error.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Current Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="current-password"
                            type="password"
                            placeholder="Enter your current password"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          New Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="new-password"
                            type="password"
                            placeholder="Enter a new password (8+ characters)"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Confirm Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm your new password"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isPending || isChangingPassword}
                    className="h-9"
                  >
                    {isPending || isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
