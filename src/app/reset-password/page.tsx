import { NewPasswordForm } from "@/components/NewPasswordForm";

// Reached from the password reset email, after /auth/callback has logged
// the user in.
export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <NewPasswordForm afterSave="/study" />
    </div>
  );
}
