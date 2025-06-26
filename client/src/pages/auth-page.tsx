import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Users, Shield, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { z } from "zod";

const loginSchema = insertUserSchema;
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen aurora-bg relative overflow-hidden text-white">
      {/* Aurora background layers */}
      <div className="absolute inset-0 aurora-layer-1"></div>
      <div className="absolute inset-0 aurora-layer-2"></div>
      <div className="absolute inset-0 aurora-layer-3"></div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-screen">
          {/* Hero Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-purple-800 rounded-lg flex items-center justify-center ghost-glow floating-icon">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold horror-font animated-ghost-text ghost-text-glow">
                  Ghost Chat
                </h1>
              </div>
              <p className="text-xl text-gray-300 horror-subtitle">
                👻 Venture into the spectral realm for eerie real-time conversations 👻
              </p>
            </div>

            <div className="grid gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Haunted Rooms</h3>
                  <p className="text-gray-400">Explore various themed rooms, each with its own spectral presence</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ethereal Messaging</h3>
                  <p className="text-gray-400">Send and receive messages from beyond the veil in real-time</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Nameless & Unseen</h3>
                  <p className="text-gray-400 font-bold">Communicate without revealing your true identity in our secure environment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Forms */}
          <div className="w-full max-w-md mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
                <TabsTrigger value="login" className="data-[state=active]:bg-slate-700 horror-subtitle">
                  👻 Enter the Void
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-slate-700 horror-subtitle">
                  🔮 Become a Specter
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card className="bg-slate-900/70 border-red-900/50 shadow-2xl shadow-red-500/20 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white horror-font animated-ghost-text">👻 Welcome Back, Spirit</CardTitle>
                    <CardDescription className="text-gray-400">
                      Materialize into the ghost chat realm</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-white">Username</Label>
                        <Input
                          id="username"
                          {...loginForm.register("username")}
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                          placeholder="Enter your username"
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-red-400">
                            {loginForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          {...loginForm.register("password")}
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                          placeholder="Enter your password"
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-400">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card className="bg-slate-900/70 border-red-900/50 shadow-2xl shadow-red-500/20 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white horror-font animated-ghost-text">🔮 Become a Ghost</CardTitle>
                    <CardDescription className="text-gray-400">
                      Join the spectral chat community</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-username" className="text-white">Username</Label>
                        <Input
                          id="reg-username"
                          {...registerForm.register("username")}
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                          placeholder="Choose a username"
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-red-400">
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-password" className="text-white">Password</Label>
                        <Input
                          id="reg-password"
                          type="password"
                          {...registerForm.register("password")}
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                          placeholder="Create a password"
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-400">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-white">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          {...registerForm.register("confirmPassword")}
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                          placeholder="Confirm your password"
                        />
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-400">
                            {registerForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}