import React, { useEffect, useState } from 'react';
import { AlertCircle, Mail, AlertTriangle, X, Bell, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Constants for timeout mechanism
const COOLDOWN_PERIOD_MS = 60000; // 1 minute cooldown
const STORAGE_KEY = 'email_verification_last_sent';

const EmailVerificationTopbar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Check if user is in cooldown period
  useEffect(() => {
    const checkCooldown = () => {
      const lastSentTime = localStorage.getItem(STORAGE_KEY);
      if (lastSentTime) {
        const elapsed = Date.now() - parseInt(lastSentTime, 10);
        if (elapsed < COOLDOWN_PERIOD_MS) {
          const remaining = Math.ceil((COOLDOWN_PERIOD_MS - elapsed) / 1000);
          setTimeRemaining(remaining);
          setCountdown(remaining);
        } else {
          setTimeRemaining(null);
          setCountdown(0);
        }
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for cooldown period
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (countdown === 0 && timeRemaining !== null) {
      setTimeRemaining(null);
    }
  }, [countdown, timeRemaining]);

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
      // Set the last sent timestamp
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setTimeRemaining(COOLDOWN_PERIOD_MS / 1000);
      setCountdown(COOLDOWN_PERIOD_MS / 1000);
      
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
      // If there's an error, reset the cooldown
      localStorage.removeItem(STORAGE_KEY);
      setTimeRemaining(null);
      setCountdown(0);
      
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
              disabled={resendVerificationMutation.isPending || timeRemaining !== null}
            >
              {resendVerificationMutation.isPending ? (
                <>
                  <span className="animate-pulse">Sending...</span>
                </>
              ) : timeRemaining !== null ? (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  Wait {countdown}s
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