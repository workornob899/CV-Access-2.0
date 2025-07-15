import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, TrendingUp, Crown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LOGO_URL, COMPANY_STATS, ADMIN_CREDENTIALS } from "@/lib/constants";

export default function LoginPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(credentials.username, credentials.password);
      setShowLoginModal(false);
      toast({
        title: "Login Successful",
        description: "Welcome to GhotokBari Dashboard!",
      });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[hsl(225,73%,97%)] to-white">
      {/* Left Side - Company Info */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 bg-white">
        <div className="max-w-md animate-fade-in">
          {/* Company Logo */}
          <div className="mb-8">
            <img src={LOGO_URL} alt="GhotokBari Logo" className="h-16 mb-4" />
            <h1 className="text-3xl font-bold text-[hsl(225,73%,57%)] mb-2">
              GHOTOKBARI.COM.BD
            </h1>
            <p className="text-gray-600 mb-8">
              Bangladesh's Most Trusted Matrimonial Platform
            </p>
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            <Card className="brand-gradient text-white card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {COMPANY_STATS.totalVerifiedProfiles.toLocaleString()}+
                    </h3>
                    <p className="text-blue-100">Total Verified Profiles</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="pink-gradient text-white card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {COMPANY_STATS.dailyAddedProfiles}
                    </h3>
                    <p className="text-pink-100">Daily Added Profiles</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-pink-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {COMPANY_STATS.highProfiles.toLocaleString()}+
                    </h3>
                    <p className="text-green-100">High Profile Members</p>
                  </div>
                  <Crown className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Side - Login/Registration */}
      <div className="flex-1 flex items-center justify-center px-8 brand-gradient">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl animate-fade-in">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
                Welcome Back
              </h2>

              <div className="space-y-4">
                <Button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full btn-primary py-4 text-lg"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Login to Your Account
                </Button>

                <Button
                  disabled
                  className="w-full btn-pink py-4 text-lg opacity-60 cursor-not-allowed"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Register New Account (Coming Soon)
                </Button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-600 text-sm mb-4">
                  Secure • Trusted • Professional
                </p>
                <div className="flex justify-center space-x-4">
                  <Users className="w-5 h-5 text-[hsl(225,73%,57%)]" />
                  <TrendingUp className="w-5 h-5 text-[hsl(330,100%,71%)]" />
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">Login</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Email</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your email"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-primary py-3"
              disabled={isLoading}
            >
              <Users className="w-4 h-4 mr-2" />
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>


        </DialogContent>
      </Dialog>
    </div>
  );
}
