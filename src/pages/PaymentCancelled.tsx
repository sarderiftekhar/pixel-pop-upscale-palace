import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, Home, CreditCard, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PaymentCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-500/20 rounded-full">
              <XCircle className="w-12 h-12 text-orange-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Payment Cancelled
          </CardTitle>
          <CardDescription className="text-white/70">
            Your payment was cancelled and no charges were made
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <p className="text-white/80 text-sm">
              No worries! You can try again anytime or continue using your existing credits.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Home className="w-4 h-4 mr-2" />
              Continue to Home
            </Button>
            
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Try Payment Again
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-white/60 text-sm mb-3">
              Need help with your purchase?
            </p>
            <Button
              onClick={() => window.open('mailto:support@pixelboost.ai', '_blank')}
              variant="ghost"
              className="text-blue-400 hover:text-blue-300"
              size="sm"
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancelled;