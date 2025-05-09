import React, { useEffect } from 'react';
import { AlertCircle, Mail, AlertTriangle, X, Bell } from 'lucide-react';
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
  const [isAnimating, setIsAnimating] = React.useState(true);

  // Animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

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
    <div className="w-full bg-gradient-to-r from-red-500 to-amber-500 shadow-md">
      <Alert className="max-w-screen-xl mx-auto border-none rounded-none bg-transparent py-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-white rounded-full ${isAnimating ? 'animate-pulse' : ''}`}>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-white text-md">ATTENTION: Your email is not verified!</h3>
              <AlertDescription className="text-white text-sm">
                Verify your email address to ensure account security and receive important notifications.
              </AlertDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="default"
              size="sm"
              className="h-9 bg-white text-red-600 hover:bg-gray-100 hover:text-red-700 font-bold shadow-sm"
              onClick={() => resendVerificationMutation.mutate()}
              disabled={resendVerificationMutation.isPending}
            >
              {resendVerificationMutation.isPending ? (
                <>
                  <span className="animate-pulse">Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-1" />
                  Send Verification Link
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-red-600/20 hover:text-white"
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