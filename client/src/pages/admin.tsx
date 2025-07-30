import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDropSchema, insertSettingsSchema, type InsertDrop, type Drop, type QueueEntry, type Settings, type InsertSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Edit, Users, Clock, Settings as SettingsIcon, Instagram, Lock } from "lucide-react";

export default function Admin() {
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  // All hooks must be called before any conditional returns
  // Fetch all drops
  const { data: drops, isLoading: dropsLoading } = useQuery<Drop[]>({
    queryKey: ["/api/admin/drops"],
    refetchInterval: 30000,
  });

  // Fetch all queue entries
  const { data: queueEntries, isLoading: queueLoading } = useQuery<QueueEntry[]>({
    queryKey: ["/api/admin/queue"],
    refetchInterval: 30000,
  });

  // Fetch settings
  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/admin/settings"],
    refetchInterval: 30000,
  });

  // Create drop mutation
  const createDropMutation = useMutation({
    mutationFn: async (data: InsertDrop) => {
      const response = await apiRequest("POST", "/api/admin/drops", data);
      return response.json() as Promise<Drop>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drops"] });
      toast({
        title: "Drop created successfully!",
        description: "The new drop has been added to the system.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create drop",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update drop mutation
  const updateDropMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertDrop> }) => {
      const response = await apiRequest("PUT", `/api/admin/drops/${id}`, data);
      return response.json() as Promise<Drop>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drops"] });
      toast({
        title: "Drop updated successfully!",
        description: "The drop has been updated.",
      });
      setSelectedDrop(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update drop",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete drop mutation
  const deleteDropMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/drops/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drops"] });
      toast({
        title: "Drop deleted successfully!",
        description: "The drop has been removed from the system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete drop",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: InsertSettings) => {
      const response = await apiRequest("PUT", "/api/admin/settings", data);
      return response.json() as Promise<Settings>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings updated successfully!",
        description: "Instagram boost settings have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<InsertDrop>({
    resolver: zodResolver(insertDropSchema),
    defaultValues: {
      name: "",
      description: "",
      dropTime: new Date(),
      maxQueueSize: 300,
    },
  });

  const onSubmit = (data: InsertDrop) => {
    if (selectedDrop) {
      updateDropMutation.mutate({ id: selectedDrop.id, data });
    } else {
      createDropMutation.mutate(data);
    }
  };

  const handleEdit = (drop: Drop) => {
    setSelectedDrop(drop);
    form.reset({
      name: drop.name,
      description: drop.description || "",
      dropTime: new Date(drop.dropTime),
      maxQueueSize: drop.maxQueueSize || 300,
    });
  };

  const handleCancelEdit = () => {
    setSelectedDrop(null);
    form.reset({
      name: "",
      description: "",
      dropTime: new Date(),
      maxQueueSize: 300,
    });
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "MiamiHeat123") {
      setIsAuthenticated(true);
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid password. Please try again.",
        variant: "destructive",
      });
      setPassword("");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
              <p className="text-gray-400">Enter password to continue</p>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter admin password"
                  autoFocus
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Access Admin Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold tracking-tight">LOCKS SOLD Admin</h1>
              <SettingsIcon className="w-6 h-6 text-blue-400" />
            </div>
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/'}
              className="text-gray-400 hover:text-white"
            >
              Back to Queue
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="drops" className="space-y-8">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="drops" className="data-[state=active]:bg-blue-600">
              Drop Management
            </TabsTrigger>
            <TabsTrigger value="queue" className="data-[state=active]:bg-blue-600">
              Queue Entries
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
              Instagram Settings
            </TabsTrigger>
          </TabsList>

          {/* Drop Management */}
          <TabsContent value="drops" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Create/Edit Drop Form */}
              <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>{selectedDrop ? "Edit Drop" : "Create New Drop"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-gray-300 mb-2 block">
                        Drop Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., Summer Collection Drop"
                        className="bg-black border-gray-700 text-white placeholder-gray-500"
                        {...form.register("name")}
                      />
                      {form.formState.errors.name && (
                        <p className="text-red-400 text-sm mt-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-gray-300 mb-2 block">
                        Description <span className="text-gray-500">(Optional)</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the drop..."
                        className="bg-black border-gray-700 text-white placeholder-gray-500"
                        {...form.register("description")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dropTime" className="text-gray-300 mb-2 block">
                        Drop Time
                      </Label>
                      <Input
                        id="dropTime"
                        type="datetime-local"
                        className="bg-black border-gray-700 text-white"
                        {...form.register("dropTime", {
                          setValueAs: (v) => new Date(v),
                        })}
                      />
                      {form.formState.errors.dropTime && (
                        <p className="text-red-400 text-sm mt-1">
                          {form.formState.errors.dropTime.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="maxQueueSize" className="text-gray-300 mb-2 block">
                        Max Queue Size
                      </Label>
                      <Input
                        id="maxQueueSize"
                        type="number"
                        min="1"
                        className="bg-black border-gray-700 text-white"
                        {...form.register("maxQueueSize", {
                          setValueAs: (v) => parseInt(v),
                        })}
                      />
                      {form.formState.errors.maxQueueSize && (
                        <p className="text-red-400 text-sm mt-1">
                          {form.formState.errors.maxQueueSize.message}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        type="submit"
                        disabled={createDropMutation.isPending || updateDropMutation.isPending}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {selectedDrop ? "Update Drop" : "Create Drop"}
                      </Button>
                      {selectedDrop && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="text-gray-400 hover:text-white"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Existing Drops */}
              <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Existing Drops</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dropsLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading drops...</div>
                  ) : drops && drops.length > 0 ? (
                    <div className="space-y-4">
                      {drops.map((drop) => (
                        <div
                          key={drop.id}
                          className={`p-4 rounded-lg border ${
                            drop.isActive
                              ? "bg-blue-600/20 border-blue-600/30"
                              : "bg-gray-800/50 border-gray-700"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-white">{drop.name}</h3>
                              {drop.description && (
                                <p className="text-sm text-gray-400">{drop.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {drop.isActive && (
                                <span className="px-2 py-1 bg-green-600 text-xs font-semibold rounded-full">
                                  Active
                                </span>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(drop)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteDropMutation.mutate(drop.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-400 space-y-1">
                            <p>Drop Time: {formatDateTime(drop.dropTime)}</p>
                            <p>Max Queue: {drop.maxQueueSize}</p>
                            <p>Created: {formatDateTime(drop.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No drops created yet. Create your first drop!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Queue Entries */}
          <TabsContent value="queue">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Queue Entries</span>
                  <span className="text-sm text-gray-400 font-normal">
                    ({queueEntries?.length || 0} total)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {queueLoading ? (
                  <div className="text-center py-8 text-gray-400">Loading queue entries...</div>
                ) : queueEntries && queueEntries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-3 text-gray-400">Position</th>
                          <th className="text-left p-3 text-gray-400">Email</th>
                          <th className="text-left p-3 text-gray-400">Phone</th>
                          <th className="text-left p-3 text-gray-400">Notifications</th>
                          <th className="text-left p-3 text-gray-400">Joined At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queueEntries.map((entry) => (
                          <tr key={entry.id} className="border-b border-gray-800">
                            <td className="p-3 font-semibold text-blue-400">
                              #{entry.position}
                            </td>
                            <td className="p-3 text-white">{entry.email}</td>
                            <td className="p-3 text-gray-400">
                              {entry.phone || "-"}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  entry.notifications
                                    ? "bg-green-600/20 text-green-400"
                                    : "bg-gray-600/20 text-gray-400"
                                }`}
                              >
                                {entry.notifications ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="p-3 text-gray-400">
                              {formatDateTime(entry.joinedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No queue entries yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instagram Settings */}
          <TabsContent value="settings">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Instagram className="w-5 h-5" />
                  <span>Instagram Boost Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="instagramUrl" className="text-white">Instagram Post URL</Label>
                      <Input
                        id="instagramUrl"
                        type="url"
                        placeholder="https://instagram.com/p/..."
                        value={settings?.instagramPostUrl || ""}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({
                            instagramPostUrl: e.target.value,
                            instagramBoostEnabled: settings?.instagramBoostEnabled || false
                          });
                        }}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="boostEnabled"
                        checked={settings?.instagramBoostEnabled || false}
                        onCheckedChange={(checked) => {
                          updateSettingsMutation.mutate({
                            instagramPostUrl: settings?.instagramPostUrl || null,
                            instagramBoostEnabled: checked
                          });
                        }}
                      />
                      <Label htmlFor="boostEnabled" className="text-white">
                        Enable Instagram Boost (100 spots)
                      </Label>
                    </div>
                  </div>

                  <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-400 mb-2">How It Works</h4>
                    <ul className="text-sm text-blue-200 space-y-1">
                      <li>• Set your Instagram post URL</li>
                      <li>• Enable the boost feature</li>
                      <li>• Users share your post to their story</li>
                      <li>• They provide their Instagram username</li>
                      <li>• Move up 100 spots instantly</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <h4 className="font-semibold text-white mb-2">Current Status</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${settings?.instagramBoostEnabled ? 'bg-green-400' : 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-400">
                        Boost: {settings?.instagramBoostEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${settings?.instagramPostUrl ? 'bg-green-400' : 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-400">
                        Post URL: {settings?.instagramPostUrl ? 'Set' : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}