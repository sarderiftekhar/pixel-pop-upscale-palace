
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Coins, CreditCard, Star } from 'lucide-react';
import { stripeService, creditPackages, StripeService } from '@/services/stripe';


const CreditsTopup = () => {
  const [loading, setLoading] = useState(false);
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const handleTopup = async (packageId: string, credits: number, price: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setLoadingPackageId(packageId);
    
    try {
      await stripeService.handleCheckout(packageId, user.id);
      
      // The success will be handled by the webhook and redirect
      toast({
        title: "Redirecting to Payment",
        description: "You will be redirected to Stripe to complete your purchase.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingPackageId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Top Up Credits</h3>
        <p className="text-white/70">
          Choose a credit package to continue upscaling your images
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {creditPackages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`relative bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/15 transition-all duration-300 ${
              pkg.popular ? 'ring-2 ring-purple-400' : ''
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  POPULAR
                </span>
              </div>
            )}
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Coins className="w-8 h-8 text-yellow-400" />
              </div>
              <CardTitle className="text-xl font-bold text-white">
                {pkg.credits} Credits
              </CardTitle>
              <CardDescription className="text-white/70">
                {StripeService.formatPrice(pkg.price)}
              </CardDescription>
              {pkg.description && (
                <p className="text-xs text-white/60 mt-1">{pkg.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleTopup(pkg.id, pkg.credits, pkg.price)}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {loadingPackageId === pkg.id ? 'Processing...' : 'Buy Now'}
              </Button>
              <p className="text-xs text-white/50 text-center mt-2">
                {StripeService.getPricePerCredit(pkg.credits, pkg.price)} per credit
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CreditsTopup;
