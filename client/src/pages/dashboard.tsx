import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/sidebar";
import { ProfileCard } from "@/components/profile-card";
import { MatchingModal } from "@/components/matching-modal";
import { ProfileDetailModal } from "@/components/profile-detail-modal";
import { FileUpload } from "@/components/ui/file-upload";
import { 
  Menu, Plus, Users, UserCheck, UserX, TrendingUp, Activity, 
  Search, Save, Calendar, Briefcase, Ruler, 
  UserPlus, Heart, Settings as SettingsIcon, MoreHorizontal, Edit2, Eye, Trash2 
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LOGO_URL, PROFESSION_OPTIONS, QUALIFICATION_OPTIONS, HEIGHT_OPTIONS, GENDERS, AGE_OPTIONS, BIRTH_YEAR_OPTIONS, MARITAL_STATUS_OPTIONS, getCombinedOptions } from "@/lib/constants";
import { Profile } from "@shared/schema";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showMatching, setShowMatching] = useState(false);
  const [matchingType, setMatchingType] = useState<"bride" | "groom">("bride");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    gender: "all",
    profession: "all",
    birthYear: "all",
    age: "all",
    maritalStatus: "all",
    date: "",
  });
  const [profileIdSearch, setProfileIdSearch] = useState("");
  const [profileManagementSearch, setProfileManagementSearch] = useState("");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: "",
    age: "",
    gender: "",
    profession: "",
    qualification: "",
    maritalStatus: "",
    height: "",
    birthYear: "",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [document, setDocument] = useState<File | null>(null);
  const [settings, setSettings] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [customOption, setCustomOption] = useState({
    fieldType: "profession",
    value: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<{ id: number; name: string } | null>(null);

  const { user, updateEmail, updatePassword, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dynamic options state
  const [dynamicOptions, setDynamicOptions] = useState({
    profession: PROFESSION_OPTIONS,
    qualification: QUALIFICATION_OPTIONS,
    height: HEIGHT_OPTIONS,
    gender: [GENDERS.MALE, GENDERS.FEMALE],
    age: AGE_OPTIONS,
    birthYear: BIRTH_YEAR_OPTIONS,
    maritalStatus: MARITAL_STATUS_OPTIONS,
  });

  // Function to refresh dynamic options
  const refreshDynamicOptions = async () => {
    try {
      const [professionOptions, qualificationOptions, heightOptions, genderOptions, ageOptions, birthYearOptions, maritalStatusOptions] = await Promise.all([
        getCombinedOptions('profession'),
        getCombinedOptions('qualification'),
        getCombinedOptions('height'),
        getCombinedOptions('gender'),
        getCombinedOptions('age'),
        getCombinedOptions('birthYear'),
        getCombinedOptions('maritalStatus'),
      ]);

      // Ensure all options are arrays and have valid values
      setDynamicOptions({
        profession: Array.isArray(professionOptions) ? professionOptions : PROFESSION_OPTIONS,
        qualification: Array.isArray(qualificationOptions) ? qualificationOptions : QUALIFICATION_OPTIONS,
        height: Array.isArray(heightOptions) ? heightOptions : HEIGHT_OPTIONS,
        gender: Array.isArray(genderOptions) ? genderOptions : [GENDERS.MALE, GENDERS.FEMALE],
        age: Array.isArray(ageOptions) ? ageOptions : AGE_OPTIONS,
        birthYear: Array.isArray(birthYearOptions) ? birthYearOptions : BIRTH_YEAR_OPTIONS,
        maritalStatus: Array.isArray(maritalStatusOptions) ? maritalStatusOptions : MARITAL_STATUS_OPTIONS,
      });
    } catch (error) {
      console.error('Error refreshing dynamic options:', error);
      // Fallback to default options on error
      setDynamicOptions({
        profession: PROFESSION_OPTIONS,
        qualification: QUALIFICATION_OPTIONS,
        height: HEIGHT_OPTIONS,
        gender: [GENDERS.MALE, GENDERS.FEMALE],
        age: AGE_OPTIONS,
        birthYear: BIRTH_YEAR_OPTIONS,
        maritalStatus: MARITAL_STATUS_OPTIONS,
      });
    }
  };

  // Load dynamic options on component mount
  useEffect(() => {
    refreshDynamicOptions();
  }, []);

  // Queries
  const { data: profiles = [], isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ["/api/profiles"],
    enabled: !!user,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: stats, error: statsError } = useQuery({
    queryKey: ["/api/profiles/stats"],
    enabled: !!user,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: searchResults = [], isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ["/api/profiles/search", searchFilters],
    enabled: !!user && Object.values(searchFilters).some(value => value && value !== "all" && value !== ""),
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          params.append(key, value);
        }
      });
      const response = await fetch(`/api/profiles/search?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to search profiles");
      }
      return response.json();
    },
  });

  // Mutations
  const addProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/profiles", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to create profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/stats"] });
      setShowAddProfile(false);
      setNewProfile({
        name: "",
        age: "",
        gender: "",
        profession: "",
        qualification: "",
        height: "",
        birthYear: "",
      });
      setProfilePicture(null);
      setDocument(null);
      toast({
        title: "Success",
        description: "Profile added successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: updateEmail,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email updated successfully!",
      });
      setSettings({ ...settings, email: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update email.",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      updatePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password updated successfully!",
      });
      setSettings({
        ...settings,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update password.",
        variant: "destructive",
      });
    },
  });

  const addCustomOptionMutation = useMutation({
    mutationFn: async (option: { fieldType: string; value: string }) => {
      const response = await apiRequest("POST", "/api/custom-options", option);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Custom option added successfully!",
      });
      setCustomOption({ ...customOption, value: "" });
      // Invalidate the custom options cache to refresh dropdowns
      queryClient.invalidateQueries({ queryKey: ["/api/custom-options"] });
      refreshDynamicOptions();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add custom option.",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const response = await fetch(`/api/profiles/${id}`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/stats"] });
      setShowEditModal(false);
      setEditingProfile(null);
      setNewProfile({
        name: "",
        age: "",
        gender: "",
        profession: "",
        qualification: "",
        height: "",
        birthYear: "",
      });
      setProfilePicture(null);
      setDocument(null);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/profiles/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to delete profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/stats"] });
      toast({
        title: "Success",
        description: "Profile deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete profile.",
        variant: "destructive",
      });
    },
  });

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();

    Object.entries(newProfile).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    if (profilePicture) {
      formData.append("profilePicture", profilePicture);
    }

    if (document) {
      formData.append("document", document);
    }

    addProfileMutation.mutate(formData);
  };

  const handleSearch = () => {
    // Search is handled automatically by the query
  };

  const handleDownload = async (profile: Profile) => {
    try {
      if (profile.document) {
        const response = await fetch(`/api/profiles/${profile.id}/download-document`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const filename = `${profile.name}_document.pdf`;

        const downloadBlob = (blob: Blob, filename: string) => {
          try {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 100);

            return true;
          } catch (error) {
            console.error("Download failed:", error);
            return false;
          }
        };

        const downloadSuccess = downloadBlob(blob, filename);

        if (!downloadSuccess) {

          const directUrl = `/api/profiles/${profile.id}/download-document`;
          window.location.href = directUrl;
        }

        toast({
          title: "Download Started",
          description: `Downloading ${filename}`,
          variant: "default",
        });
      } else {

        toast({
          title: "No Document",
          description: "This profile doesn't have a document to download",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Download Error",
        description: `Failed to download document: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = (profile: Profile) => {
    try {
      if (profile && profile.id) {
        setSelectedProfile(profile);
        setIsProfileModalOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Invalid profile data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error opening profile modal:", error);
      toast({
        title: "Error",
        description: "Failed to open profile details",
        variant: "destructive",
      });
    }
  };

  const handleEmailUpdate = () => {
    if (!settings.email) {
      toast({
        title: "Missing Information",
        description: "Please enter a new email address.",
        variant: "destructive",
      });
      return;
    }
    updateEmailMutation.mutate(settings.email);
  };

  const handlePasswordUpdate = () => {
    if (!settings.currentPassword || !settings.newPassword || !settings.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (settings.newPassword !== settings.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: settings.currentPassword,
      newPassword: settings.newPassword,
    });
  };

  const handleAddCustomOption = () => {
    if (!customOption.value.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a value to add.",
        variant: "destructive",
      });
      return;
    }

    addCustomOptionMutation.mutate({
      fieldType: customOption.fieldType,
      value: customOption.value.trim(),
    });
  };

  const showMatchingModal = (type: "bride" | "groom") => {
    setMatchingType(type);
    setShowMatching(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setNewProfile({
      name: profile.name,
      age: profile.age.toString(),
      gender: profile.gender,
      profession: profile.profession || "",
      qualification: profile.qualification || "",
      height: profile.height,
      birthYear: profile.birthYear.toString(),
    });
    setProfilePicture(null);
    setDocument(null);
    setShowEditModal(true);
  };

  const handleDeleteProfile = (profile: Profile) => {
    setProfileToDelete({ id: profile.id, name: profile.name });
    setShowDeleteModal(true);
  };

  const confirmDeleteProfile = () => {
    if (profileToDelete) {
      deleteProfileMutation.mutate(profileToDelete.id);
      setShowDeleteModal(false);
      setProfileToDelete(null);
    }
  };

  const cancelDeleteProfile = () => {
    setShowDeleteModal(false);
    setProfileToDelete(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    const formData = new FormData();
    Object.entries(newProfile).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    if (profilePicture) {
      formData.append("profilePicture", profilePicture);
    }
    if (document) {
      formData.append("document", document);
    }

    updateProfileMutation.mutate({ id: editingProfile.id, formData });
  };

  // Profile ID search functionality
  const profileIdSearchResults = profileIdSearch.trim() 
    ? profiles.filter(profile => 
        profile.profileId?.toLowerCase().includes(profileIdSearch.toLowerCase().trim())
      )
    : [];

  // Profile Management search functionality
  const profileManagementResults = profileManagementSearch.trim()
    ? profiles.filter(profile => 
        profile.name.toLowerCase().includes(profileManagementSearch.toLowerCase()) ||
        profile.profileId?.toLowerCase().includes(profileManagementSearch.toLowerCase()) ||
        profile.profession?.toLowerCase().includes(profileManagementSearch.toLowerCase()) ||
        profile.gender.toLowerCase().includes(profileManagementSearch.toLowerCase())
      )
    : profiles;

  const displayedProfiles = profileIdSearch.trim() 
    ? profileIdSearchResults
    : Object.values(searchFilters).some(value => value && value !== "all" && value !== "") 
      ? searchResults 
      : profiles;

  // Error handling
  const hasError = profilesError || statsError || searchError;
  const errorMessage = hasError ? "Failed to load data. Please try refreshing the page." : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(225,73%,57%)]">
                Auto Matching System
              </h1>
              <p className="text-sm text-gray-600">Only use company staff</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowAddProfile(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Profile
            </Button>
            <img src={LOGO_URL} alt="Logo" className="h-10" />
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Section */}
            {activeSection === "dashboard" && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="card-shadow animate-fade-in">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700">Total Profiles</h3>
                          <p className="text-3xl font-bold text-[hsl(225,73%,57%)] animate-counter">
                            {stats?.totalProfiles?.toLocaleString() || "0"}
                          </p>
                        </div>
                        <div className="p-3 bg-[hsl(225,73%,97%)] rounded-full">
                          <Users className="w-6 h-6 text-[hsl(225,73%,57%)]" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm">+12% from last month</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-shadow animate-fade-in">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700">Bride Profiles</h3>
                          <p className="text-3xl font-bold text-[hsl(330,100%,71%)] animate-counter">
                            {stats?.brideProfiles?.toLocaleString() || "0"}
                          </p>
                        </div>
                        <div className="p-3 bg-pink-100 rounded-full">
                          <UserX className="w-6 h-6 text-[hsl(330,100%,71%)]" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm">+8% from last month</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-shadow animate-fade-in">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700">Groom Profiles</h3>
                          <p className="text-3xl font-bold text-blue-600 animate-counter">
                            {stats?.groomProfiles?.toLocaleString() || "0"}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                          <UserCheck className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm">+15% from last month</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Matching System */}
                <Card className="card-shadow">
                  <CardHeader>
                    <CardTitle className="text-2xl text-gray-800">
                      Intelligent Matching System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={() => showMatchingModal("bride")}
                        className="btn-pink py-6 text-lg"
                      >
                        <UserX className="w-5 h-5 mr-2" />
                        Find Match for Bride
                      </Button>
                      <Button
                        onClick={() => showMatchingModal("groom")}
                        className="btn-primary py-6 text-lg"
                      >
                        <UserCheck className="w-5 h-5 mr-2" />
                        Find Match for Groom
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="card-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-green-100 rounded-full mr-4">
                          <UserPlus className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">New profiles being added</p>
                          <p className="text-sm text-gray-600">System active</p>
                        </div>
                      </div>
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-full mr-4">
                          <Heart className="w-5 h-5 text-[hsl(225,73%,57%)]" />
                        </div>
                        <div>
                          <p className="font-medium">Matching system ready</p>
                          <p className="text-sm text-gray-600">Ready to find matches</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Profile Section */}
            {activeSection === "profiles" && (
              <div className="space-y-8">
                {/* Error Message */}
                {errorMessage && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <p className="text-red-700 font-medium">{errorMessage}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Profile ID Search */}
                <Card className="card-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800 flex items-center">
                      <Search className="w-5 h-5 mr-2" />
                      Search by Profile ID
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Enter Profile ID (e.g., GB-47805)"
                        value={profileIdSearch}
                        onChange={(e) => setProfileIdSearch(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => setProfileIdSearch("")}
                        variant="outline"
                        className="px-4"
                      >
                        Clear
                      </Button>
                    </div>
                    {profileIdSearch.trim() && (
                      <div className="mt-4 text-sm text-gray-600">
                        {profileIdSearchResults.length > 0 
                          ? `Found ${profileIdSearchResults.length} profile(s) matching "${profileIdSearch}"`
                          : `No profiles found matching "${profileIdSearch}"`
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Filter Panel */}
                <Card className="card-shadow">
                  <CardHeader>
                    <CardTitle className="text-2xl text-gray-800 flex items-center">
                      <Search className="w-6 h-6 mr-2" />
                      Filter Profiles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Date</Label>
                        <Input
                          type="date"
                          value={searchFilters.date}
                          onChange={(e) =>
                            setSearchFilters({ ...searchFilters, date: e.target.value })
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Gender</Label>
                        <Select
                          value={searchFilters.gender}
                          onValueChange={(value) =>
                            setSearchFilters({ ...searchFilters, gender: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Genders" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Genders</SelectItem>
                            {(dynamicOptions.gender || []).filter(Boolean).map((gender, index) => (
                              <SelectItem key={`gender-${index}-${gender}`} value={gender}>
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Profession</Label>
                        <Select
                          value={searchFilters.profession}
                          onValueChange={(value) =>
                            setSearchFilters({ ...searchFilters, profession: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Profession" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Professions</SelectItem>
                            {(dynamicOptions.profession || []).filter(Boolean).map((profession, index) => (
                              <SelectItem key={`profession-${index}-${profession}`} value={profession}>
                                {profession}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Marital Status</Label>
                        <Select
                          value={searchFilters.maritalStatus}
                          onValueChange={(value) =>
                            setSearchFilters({ ...searchFilters, maritalStatus: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Marital Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Marital Status</SelectItem>
                            {(dynamicOptions.maritalStatus || []).filter(Boolean).map((maritalStatus, index) => (
                              <SelectItem key={`maritalStatus-${index}-${maritalStatus}`} value={maritalStatus}>
                                {maritalStatus}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Birth Year</Label>
                        <Select
                          value={searchFilters.birthYear}
                          onValueChange={(value) =>
                            setSearchFilters({ ...searchFilters, birthYear: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Birth Year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Birth Years</SelectItem>
                            {(dynamicOptions.birthYear || []).filter(Boolean).map((year, index) => (
                              <SelectItem key={`birthYear-${index}-${year}`} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Age</Label>
                        <Select
                          value={searchFilters.age}
                          onValueChange={(value) =>
                            setSearchFilters({ ...searchFilters, age: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Age" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Ages</SelectItem>
                            {(dynamicOptions.age || []).filter(Boolean).map((age, index) => (
                              <SelectItem key={`age-${index}-${age}`} value={age}>
                                {age}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <Button 
                        onClick={handleSearch} 
                        className="btn-primary px-6 py-2" 
                        disabled={searchLoading}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {searchLoading ? "Searching..." : "Search Profiles"}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchFilters({
                            gender: "all",
                            profession: "all",
                            birthYear: "all",
                            age: "all",
                            maritalStatus: "all",
                            date: "",
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
                        }}
                        className="px-4 py-2"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Profiles Grid */}
                <div className="space-y-6">
                  {profilesLoading || searchLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-6">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : displayedProfiles.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {displayedProfiles.map((profile: Profile) => (
                        <ProfileCard
                          key={profile.id}
                          profile={profile}
                          onDownload={handleDownload}
                          onClick={handleProfileClick}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="text-center py-12">
                      <CardContent>
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                          No profiles found
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {Object.values(searchFilters).some(value => value && value !== "all")
                            ? "Try adjusting your search filters to find more profiles"
                            : "Add some profiles to get started with the matching system"}
                        </p>
                        <Button 
                          onClick={() => setShowAddProfile(true)}
                          className="btn-primary"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Profile
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Profile Management Section */}
            {activeSection === "profile-management" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Profile Management</h2>
                    <p className="text-gray-600 mt-1">Manage all matrimonial profiles</p>
                  </div>
                  <Button
                    onClick={() => setShowAddProfile(true)}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Profile
                  </Button>
                </div>

                {/* Search Bar */}
                <Card className="card-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Search className="w-5 h-5 text-gray-400" />
                      <Input
                        placeholder="Search profiles (name, ID, profession, gender...)"
                        value={profileManagementSearch}
                        onChange={(e) => setProfileManagementSearch(e.target.value)}
                        className="flex-1"
                      />
                      {profileManagementSearch && (
                        <Button
                          onClick={() => setProfileManagementSearch("")}
                          variant="outline"
                          size="sm"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Profiles Table */}
                <Card className="card-shadow">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Picture</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Profile ID</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Profession</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profilesLoading ? (
                            [...Array(5)].map((_, i) => (
                              <TableRow key={i}>
                                <TableCell><div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              </TableRow>
                            ))
                          ) : profileManagementResults.length > 0 ? (
                            profileManagementResults.map((profile) => (
                              <TableRow key={profile.id}>
                                <TableCell>
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {profile.profilePicture ? (
                                      <img
                                        src={profile.profilePicture}
                                        alt={profile.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <User className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {new Date(profile.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{profile.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{profile.profileId || `GB-${String(profile.id).padStart(5, '0')}`}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={profile.gender === "Female" ? "default" : "secondary"}>
                                    {profile.gender}
                                  </Badge>
                                </TableCell>
                                <TableCell>{profile.age}</TableCell>
                                <TableCell>{profile.profession || "N/A"}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleProfileClick(profile)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Profile
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditProfile(profile)}>
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit Profile
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteProfile(profile)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Profile
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
                                <div className="flex flex-col items-center">
                                  <Users className="w-12 h-12 text-gray-400 mb-4" />
                                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    {profileManagementSearch ? "No matching profiles found" : "No profiles yet"}
                                  </h3>
                                  <p className="text-gray-500 mb-4">
                                    {profileManagementSearch 
                                      ? "Try adjusting your search terms"
                                      : "Create your first profile to get started"}
                                  </p>
                                  {!profileManagementSearch && (
                                    <Button
                                      onClick={() => setShowAddProfile(true)}
                                      className="btn-primary"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add First Profile
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Section */}
            {activeSection === "settings" && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-8">Account Settings</h2>

                <Card className="card-shadow">
                  <CardContent className="p-8">
                    <Tabs defaultValue="email" className="space-y-8">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="email">Email Settings</TabsTrigger>
                        <TabsTrigger value="password">Password Settings</TabsTrigger>
                        <TabsTrigger value="manual-add">Manual Add</TabsTrigger>
                      </TabsList>

                      <TabsContent value="email" className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Current Email</Label>
                            <Input
                              type="email"
                              value={user?.email || ""}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>New Email</Label>
                            <Input
                              type="email"
                              placeholder="Enter new email"
                              value={settings.email}
                              onChange={(e) =>
                                setSettings({ ...settings, email: e.target.value })
                              }
                            />
                          </div>

                          <Button
                            onClick={handleEmailUpdate}
                            className="btn-primary"
                            disabled={updateEmailMutation.isPending}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {updateEmailMutation.isPending ? "Updating..." : "Update Email"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="password" className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input
                              type="password"
                              placeholder="Enter current password"
                              value={settings.currentPassword}
                              onChange={(e) =>
                                setSettings({ ...settings, currentPassword: e.target.value })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                              type="password"
                              placeholder="Enter new password"
                              value={settings.newPassword}
                              onChange={(e) =>
                                setSettings({ ...settings, newPassword: e.target.value })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input
                              type="password"
                              placeholder="Confirm new password"
                              value={settings.confirmPassword}
                              onChange={(e) =>
                                setSettings({ ...settings, confirmPassword: e.target.value })
                              }
                            />
                          </div>

                          <Button
                            onClick={handlePasswordUpdate}
                            className="btn-primary"
                            disabled={updatePasswordMutation.isPending}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="manual-add" className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Field Type</Label>
                            <Select
                              value={customOption.fieldType}
                              onValueChange={(value) =>
                                setCustomOption({ ...customOption, fieldType: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select field type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="profession">Profession</SelectItem>
                                <SelectItem value="qualification">Qualification</SelectItem>
                                <SelectItem value="height">Height</SelectItem>
                                <SelectItem value="gender">Gender</SelectItem>
                                <SelectItem value="age">Age</SelectItem>
                                <SelectItem value="birthYear">Birth Year</SelectItem>
                                <SelectItem value="maritalStatus">Marital Status</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Value</Label>
                            <Input
                              type="text"
                              placeholder="Enter value to add"
                              value={customOption.value}
                              onChange={(e) =>
                                setCustomOption({ ...customOption, value: e.target.value })
                              }
                            />
                          </div>

                          <Button
                            onClick={handleAddCustomOption}
                            className="btn-primary"
                            disabled={addCustomOptionMutation.isPending}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {addCustomOptionMutation.isPending ? "Adding..." : "Add Custom Option"}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Profile Modal */}
      <Dialog open={showAddProfile} onOpenChange={setShowAddProfile}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Add New Profile
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="Full name"
                  value={newProfile.name}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Age *</Label>
                <Select
                  value={newProfile.age}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, age: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Age" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.age || []).map((age) => (
                      <SelectItem key={age} value={age}>
                        {age}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select
                  value={newProfile.gender}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.gender || []).map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Profession</Label>
                <Select
                  value={newProfile.profession}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, profession: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.profession || []).map((profession) => (
                      <SelectItem key={profession} value={profession}>
                        {profession}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Qualification</Label>
                <Select
                  value={newProfile.qualification}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, qualification: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.qualification || []).map((qualification) => (
                      <SelectItem key={qualification} value={qualification}>
                        {qualification}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Marital Status</Label>
                <Select
                  value={newProfile.maritalStatus}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, maritalStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Marital Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.maritalStatus || []).map((maritalStatus) => (
                      <SelectItem key={maritalStatus} value={maritalStatus}>
                        {maritalStatus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Birth Year</Label>
                <Select
                  value={newProfile.birthYear}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, birthYear: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Birth Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.birthYear || []).map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Height</Label>
                <Select
                  value={newProfile.height}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, height: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Height" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.height || []).map((height) => (
                      <SelectItem key={height} value={height}>
                        {height}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <FileUpload
                accept="image/*"
                onFileSelect={setProfilePicture}
                preview
              />
            </div>

            <div className="space-y-2">
              <Label>Document</Label>
              <FileUpload
                accept=".pdf,.doc,.docx"
                onFileSelect={setDocument}
              >
                <div className="p-8">
                  <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Upload supporting document (PDF, DOC)</p>
                </div>
              </FileUpload>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddProfile(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="btn-primary"
                disabled={addProfileMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {addProfileMutation.isPending ? "Adding..." : "Add Profile"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="Enter full name"
                  value={newProfile.name}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Age *</Label>
                <Input
                  type="number"
                  placeholder="Enter age"
                  value={newProfile.age}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, age: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select
                  value={newProfile.gender}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.gender || []).map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Profession</Label>
                <Select
                  value={newProfile.profession}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, profession: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.profession || []).map((profession) => (
                      <SelectItem key={profession} value={profession}>
                        {profession}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Qualification</Label>
                <Select
                  value={newProfile.qualification}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, qualification: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.qualification || []).map((qualification) => (
                      <SelectItem key={qualification} value={qualification}>
                        {qualification}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Birth Year</Label>
                <Select
                  value={newProfile.birthYear}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, birthYear: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Birth Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.birthYear || []).map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Height</Label>
                <Select
                  value={newProfile.height}
                  onValueChange={(value) =>
                    setNewProfile({ ...newProfile, height: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Height" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dynamicOptions.height || []).map((height) => (
                      <SelectItem key={height} value={height}>
                        {height}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <FileUpload
                accept="image/*"
                onFileSelect={setProfilePicture}
                preview
              />
            </div>

            <div className="space-y-2">
              <Label>Document</Label>
              <FileUpload
                accept=".pdf,.doc,.docx"
                onFileSelect={setDocument}
              >
                <div className="p-8">
                  <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Upload supporting document (PDF, DOC)</p>
                </div>
              </FileUpload>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProfile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="btn-primary"
                disabled={updateProfileMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <MatchingModal
        isOpen={showMatching}
        onClose={() => setShowMatching(false)}
        type={matchingType}
      />

      <ProfileDetailModal
        profile={selectedProfile}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onDownload={handleDownload}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{profileToDelete?.name}</strong>'s profile? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={cancelDeleteProfile}
                disabled={deleteProfileMutation.isPending}
              >
                ❌ No, Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDeleteProfile}
                disabled={deleteProfileMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteProfileMutation.isPending ? "Deleting..." : "✅ Yes, Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}