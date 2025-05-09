import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const EmailVerificationTopbar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = React.useState(false);

  // Don't show anything if email is already verified or no user is logged in
  if (!user || user.isEmailVerified || dismissed) {
    return null;
  }

  // Email verification mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/resend-verification");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification email sent",
        description: "Please check your inbox for the verification link.",
        duration: 6000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send verification email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200">
      <Alert className="max-w-screen-xl mx-auto border-none rounded-none bg-transparent py-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Please verify your email address to ensure you receive important notifications.
            </AlertDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
              onClick={() => resendVerificationMutation.mutate()}
              disabled={resendVerificationMutation.isPending}
            >
              {resendVerificationMutation.isPending ? (
                <>
                  <span className="animate-pulse">Sending...</span>
                </>
              ) : (
                <>Resend Verification</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-amber-600 hover:bg-amber-100 hover:text-amber-800"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default EmailVerificationTopbar;