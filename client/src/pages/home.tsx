import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQueueEntrySchema, type InsertQueueEntry } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bell, Users, Clock, ShoppingCart, UserPlus, Ticket, Check, Flame, Instagram, ExternalLink } from "lucide-react";

interface QueueStats {
  totalSize: number;
  topEntries: Array<{
    position: string;
    email: string;
    joinedAt: string;
  }>;
  activeDrop?: {
    id: string;
    name: string;
    description?: string;
    dropTime: string;
    isActive: boolean;
    maxQueueSize: number;
  };
}

interface JoinQueueResponse {
  id: string;
  position: number;
  email: string;
  estimatedWaitTime: number;
}

interface PositionResponse {
  position: number;
  email: string;
  estimatedWaitTime: number;
  peopleAhead: number;
}

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 35,
    seconds: 42,
  });
  const [joinedQueue, setJoinedQueue] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [hasSharedPost, setHasSharedPost] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState("");
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const { toast } = useToast();

  // Fetch Instagram settings
  const { data: instagramSettings } = useQuery<{ instagramPostUrl: string | null; instagramBoostEnabled: boolean }>({
    queryKey: ["/api/admin/settings"],
    refetchInterval: 60000,
  });

  // Fetch queue stats
  const { data: queueStats, isLoading: statsLoading } = useQuery<QueueStats>({
    queryKey: ["/api/queue/stats"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Countdown timer - calculate from active drop
  useEffect(() => {
    const timer = setInterval(() => {
      if (queueStats?.activeDrop) {
        const now = Date.now();
        const dropTime = new Date(queueStats.activeDrop.dropTime).getTime();
        const timeLeft = Math.max(0, dropTime - now);
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [queueStats?.activeDrop]);

  // Fetch user position if joined
  const { data: userPosition } = useQuery<PositionResponse>({
    queryKey: ["/api/queue/position", userEmail],
    enabled: joinedQueue && !!userEmail,
    refetchInterval: 30000,
  });

  // Join queue mutation
  const joinQueueMutation = useMutation({
    mutationFn: async (data: InsertQueueEntry) => {
      const response = await apiRequest("POST", "/api/queue/join", data);
      return response.json() as Promise<JoinQueueResponse>;
    },
    onSuccess: (data) => {
      setJoinedQueue(true);
      setUserEmail(data.email);
      queryClient.invalidateQueries({ queryKey: ["/api/queue/stats"] });
      toast({
        title: "Successfully joined queue!",
        description: `You're position ${data.position} in line.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join queue",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Instagram verification mutation
  const verifyInstagramMutation = useMutation({
    mutationFn: async ({ email, instagramUsername }: { email: string; instagramUsername: string }) => {
      // Add 2-3 second delay to simulate verification checking
      await new Promise(resolve => setTimeout(resolve, 2500));
      const response = await apiRequest("POST", "/api/queue/instagram-verify", { email, instagramUsername });
      return response.json();
    },
    onSuccess: (data: any) => {
      setHasSharedPost(true);
      setShowUsernameInput(false);
      queryClient.invalidateQueries({ queryKey: ["/api/queue/position", userEmail] });
      queryClient.invalidateQueries({ queryKey: ["/api/queue/stats"] });
      toast({
        title: data.message || "Amazing! You moved up 100 spots!",
        description: "Thanks for sharing! Your new position is updated above.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  // Form setup
  const form = useForm<InsertQueueEntry>({
    resolver: zodResolver(insertQueueEntrySchema),
    defaultValues: {
      email: "",
      phone: "",
      notifications: false,
    },
  });

  const onSubmit = (data: InsertQueueEntry) => {
    joinQueueMutation.mutate(data);
  };

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold tracking-tight">LOCKS SOLD</h1>
              <span className="hidden sm:inline-block px-2 py-1 bg-red-600 text-xs font-semibold rounded-full uppercase tracking-wide">
                Dropping Soon!
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{queueStats?.totalSize || 283} in queue</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-blue-400 hover:text-blue-300"
              >
                How does it work?
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-full text-red-400 text-sm font-medium mb-6">
            <Flame className="w-4 h-4 mr-2" />
            Exclusive Drop - Limited Stock
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            HOLD YOUR SPOT
          </h2>
          <p className="text-xl text-gray-400 mb-4 max-w-2xl mx-auto">
            This will guarantee you a spot for the first 5 minutes of our drop!
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            Typical sellout time: <span className="text-red-400 font-semibold">47 seconds</span>
          </p>
        </div>

        {/* Countdown Timer */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 mb-12">
          <CardContent className="p-4 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-300">Drop begins in</h3>
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-sm sm:max-w-md mx-auto">
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Minutes", value: timeLeft.minutes },
                { label: "Seconds", value: timeLeft.seconds },
              ].map((item) => (
                <div key={item.label} className="bg-black border border-gray-700 rounded-lg sm:rounded-xl p-2 sm:p-4 min-h-[70px] sm:min-h-[80px] flex flex-col justify-center">
                  <div className="text-xl sm:text-3xl font-bold text-blue-400 mb-1">{formatTime(item.value)}</div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide leading-tight">{item.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Queue Status */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Join Queue Form or Position Display */}
          {!joinedQueue ? (
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-white">Reserve Your Spot</h3>
                  <p className="text-gray-400">Get a reserved slot held for 5 minutes when the website launches</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-gray-300 mb-2 block">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="bg-black border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-400 text-sm mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-300 mb-2 block">
                      Phone Number <span className="text-gray-500">(Optional)</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="bg-black border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                      {...form.register("phone")}
                    />
                  </div>



                  <Button
                    type="submit"
                    disabled={joinQueueMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {joinQueueMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Joining Queue...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Queue
                      </>
                    )}
                  </Button>
                </form>


              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-green-400">You're In!</h3>
                  <p className="text-gray-400">Your reserved slot is held for 5 minutes when the website launches</p>
                </div>

                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-400 mb-2">
                      {userPosition?.position || 0}
                    </div>
                    <div className="text-gray-400">Your position in line</div>
                    {hasSharedPost && (
                      <div className="text-sm text-green-400 mt-1">
                        Moved up 100 spots for sharing on Instagram!
                      </div>
                    )}
                  </div>

                  <div className="bg-black/50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Estimated wait time:</span>
                      <span className="text-sm font-semibold text-blue-400">
                        ~{userPosition?.estimatedWaitTime || 2} minutes
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">People ahead:</span>
                      <span className="text-sm font-semibold text-white">
                        {Math.max(0, (userPosition?.position || 1) - 1)}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-300 font-semibold">✓ RESERVED SLOT</p>
                      <p className="text-sm text-blue-200 mt-1">
                        Your slot will be reserved for the first 5 minutes of the drop. If you don't purchase within 5 minutes, it's released to others.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instagram Share Boost - only show if user joined */}
          {joinedQueue && userPosition && (
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Instagram className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white">Move Up 100 Spots!</h3>
                  <p className="text-gray-400 mb-6">
                    Share our Instagram post to your story and jump ahead in line
                  </p>
                  
                  {!instagramSettings?.instagramBoostEnabled || !instagramSettings?.instagramPostUrl ? (
                    <div className="bg-gray-600/20 border border-gray-600/30 rounded-lg p-6">
                      <div className="text-2xl mb-4">📸</div>
                      <h4 className="text-lg font-bold text-gray-400 mb-2">Coming Soon!</h4>
                      <p className="text-gray-500 text-sm">
                        Instagram boost feature will be available before the drop. Check back later!
                      </p>
                    </div>
                  ) : !hasSharedPost ? (
                    <div className="space-y-4">
                      <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
                        <p className="text-sm text-blue-300 font-semibold mb-2">📢 HOW IT WORKS</p>
                        <ol className="text-sm text-blue-200 text-left space-y-1">
                          <li>1. Click the link below to open Instagram</li>
                          <li>2. Share the post to your story</li>
                          <li>3. Enter your Instagram username to verify</li>
                          <li>4. Move up 100 spots instantly</li>
                        </ol>
                      </div>
                      
                      {!showUsernameInput ? (
                        <div className="space-y-3">
                          <Button
                            onClick={() => {
                              window.open(instagramSettings.instagramPostUrl, "_blank");
                            }}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Instagram Post
                          </Button>
                          
                          <Button
                            onClick={() => setShowUsernameInput(true)}
                            variant="outline"
                            className="w-full border-green-600 text-green-400 hover:bg-green-600/10"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            I Shared It!
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-left">
                            <label className="block text-sm font-medium text-white mb-2">
                              Enter your Instagram username to verify:
                            </label>
                            <input
                              type="text"
                              placeholder="@yourusername"
                              value={instagramUsername}
                              onChange={(e) => setInstagramUsername(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                if (!instagramUsername.trim()) {
                                  toast({
                                    title: "Username required",
                                    description: "Please enter your Instagram username.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                verifyInstagramMutation.mutate({
                                  email: userEmail,
                                  instagramUsername: instagramUsername.replace('@', '')
                                });
                              }}
                              disabled={verifyInstagramMutation.isPending}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                              {verifyInstagramMutation.isPending ? "Checking your story..." : "Verify & Get Boost"}
                            </Button>
                            
                            <Button
                              onClick={() => {
                                setShowUsernameInput(false);
                                setInstagramUsername("");
                              }}
                              variant="outline"
                              className="border-gray-600 text-gray-400 hover:bg-gray-800"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-4">
                        * One boost per person. We verify through Instagram username submission.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-6">
                      <div className="text-4xl mb-4">🎉</div>
                      <h4 className="text-lg font-bold text-green-400 mb-2">Boost Applied!</h4>
                      <p className="text-green-300 text-sm">
                        You've moved up 100 spots for sharing! Thanks for spreading the word about LOCKS SOLD.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Queue Visualization */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Live Queue</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-400">Real-time</span>
                </div>
              </div>

              <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                {queueStats?.topEntries.map((entry, index) => (
                  <div
                    key={entry.email}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      index === 0
                        ? "bg-blue-600/20 border border-blue-600/30"
                        : "bg-black/30"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        index === 0 ? "bg-blue-600 text-white" : "bg-gray-700 text-white"
                      }`}
                    >
                      {entry.position}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{entry.email}</div>
                      <div className="text-xs text-gray-400">
                        Joined {new Date(entry.joinedAt).toLocaleString()}
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="text-xs text-blue-400 font-medium">Next</div>
                    )}
                  </div>
                ))}

                {/* Show gap indicator */}
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-gray-500">...</div>
                  <div className="text-sm text-gray-400 mt-2">
                    {(queueStats?.totalSize || 283) - 4} more people in queue
                  </div>
                </div>

                {/* Show user's position if joined */}
                {joinedQueue && userPosition && (
                  <div className="flex items-center space-x-3 p-3 bg-green-600/20 border border-green-600/30 rounded-lg">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {userPosition.position}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{userEmail}</div>
                      <div className="text-xs text-gray-400">Just joined</div>
                    </div>
                    <div className="text-xs text-green-400 font-medium">You</div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Total in queue:</span>
                  <span className="font-semibold text-blue-400">
                    {queueStats?.totalSize || 283}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-gray-900/30 border-gray-800 text-center p-6">
            <div className="text-3xl font-bold text-red-400 mb-2">47s</div>
            <div className="text-sm text-gray-400">Average sellout time</div>
          </Card>
          <Card className="bg-gray-900/30 border-gray-800 text-center p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">5 min</div>
            <div className="text-sm text-gray-400">Reserved slot duration</div>
          </Card>
        </div>

        {/* How It Works */}
        <Card id="how-it-works" className="bg-gray-900/30 border-gray-800 mb-12">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-center mb-8">How the Queue Works</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2 text-white">1. Join Queue</h4>
                <p className="text-sm text-gray-400">
                  Enter your email to secure your position before the drop begins
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2 text-white">2. Wait for Launch</h4>
                <p className="text-sm text-gray-400">
                  At drop time, our website opens to everyone but your slot is reserved for 5 minutes
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2 text-white">3. Shop with Priority</h4>
                <p className="text-sm text-gray-400">
                  Purchase within 5 minutes or your reserved slot is released to others
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="bg-gray-900/30 border-gray-800">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="border-b border-gray-800 pb-4">
                <h4 className="font-semibold mb-2 text-white">What happens at drop time?</h4>
                <p className="text-sm text-gray-400">
                  Our website opens to everyone simultaneously, but your product slot is reserved for 5 minutes if you're in the queue.
                </p>
              </div>
              <div className="border-b border-gray-800 pb-4">
                <h4 className="font-semibold mb-2 text-white">How long do I have to shop?</h4>
                <p className="text-sm text-gray-400">
                  You have 5 minutes to complete your purchase. If you don't buy within 5 minutes, your reserved slot is released to others.
                </p>
              </div>
              <div className="border-b border-gray-800 pb-4">
                <h4 className="font-semibold mb-2 text-white">How fast do items sell out?</h4>
                <p className="text-sm text-gray-400">
                  Typically 47 seconds. Being in the queue gives you a reserved slot while others compete for remaining inventory.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">Can I join multiple times?</h4>
                <p className="text-sm text-gray-400">
                  Each email address can only hold one position in the queue to ensure fairness.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              &copy; 2024 LOCKS SOLD. All rights reserved. |{" "}
              <a href="#" className="hover:text-white">
                Privacy Policy
              </a>{" "}
              |{" "}
              <a href="#" className="hover:text-white">
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #374151 #1f2937;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
}
