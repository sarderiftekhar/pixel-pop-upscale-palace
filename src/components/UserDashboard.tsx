
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, Coins, CreditCard } from 'lucide-react';
import CreditsTopup from './CreditsTopup';

const UserDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [showTopup, setShowTopup] = useState(false);

  if (!user || !profile) return null;

  return (
    <div className="fixed top-4 right-4 z-20">
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20 min-w-[250px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <User className="w-4 h-4" />
            {profile.full_name || user.email}
          </CardTitle>
          <CardDescription className="text-white/70 text-xs">
            {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm">Credits</span>
            </div>
            <span className="text-white font-bold">{profile.credits}</span>
          </div>
          
          <div className="space-y-2">
            <Dialog open={showTopup} onOpenChange={setShowTopup}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Top Up Credits
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border border-white/20 max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Top Up Your Credits</DialogTitle>
                </DialogHeader>
                <CreditsTopup />
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={signOut}
              variant="outline" 
              size="sm" 
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
