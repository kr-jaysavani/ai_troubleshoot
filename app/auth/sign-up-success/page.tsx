import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-linear-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-blue-900">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary">TechHelper</h1>
            <p className="text-muted-foreground">
              AI-Powered Device Troubleshooting
            </p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account before signing in.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
