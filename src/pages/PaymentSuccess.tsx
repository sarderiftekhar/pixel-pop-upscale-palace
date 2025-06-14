import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { stripeService } from '@/services/stripe';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      navigate('/');
      return;
    }

    const verifyPayment = async () => {
      try {
        const session = await stripeService.getCheckoutSession(sessionId);
        setSessionData(session);
        
        // Refresh user profile to show updated credits
        await refreshProfile();
        
        toast({
          title: "Payment Successful!",
          description: `Your credits have been added to your account.`,
        });
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast({
          title: "Verification Error",
          description: "Could not verify payment. Please contact support if credits are missing.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, toast, refreshProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Verifying payment...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-500/20 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-white/70">
            Your credits have been added to your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {sessionData && (
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Credits purchased:</span>
                <span className="text-white font-medium">{sessionData.metadata?.credits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Amount paid:</span>
                <span className="text-white font-medium">
                  ${(sessionData.amount_total / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Payment ID:</span>
                <span className="text-white font-mono text-xs">{sessionData.id}</span>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Home className="w-4 h-4 mr-2" />
              Start Upscaling Images
            </Button>
            
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              View Transaction History
            </Button>
          </div>
          
          <div className="text-center text-sm text-white/60">
            <p>Thank you for your purchase!</p>
            <p>You can now start upscaling your images.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;