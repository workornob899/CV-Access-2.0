import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { LotteryAnimation } from "@/components/lottery-animation";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, UserCheck, UserX, Calendar, Briefcase, Ruler, Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GENDERS, HEIGHT_OPTIONS, PROFESSION_OPTIONS, QUALIFICATION_OPTIONS, AGE_OPTIONS, MARITAL_STATUS_OPTIONS, getCombinedOptions } from "@/lib/constants";
import { Profile } from "@shared/schema";

interface MatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "bride" | "groom";
}

interface MatchResult {
  inputProfile: {
    name: string;
    age: number;
    gender: string;
    profession?: string;
    height: string;
  };
  matchedProfile: Profile;
  compatibilityScore: number;
}

export function MatchingModal({ isOpen, onClose, type }: MatchingModalProps) {
  const [step, setStep] = useState<"form" | "searching" | "result">("form");
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: type === "bride" ? GENDERS.FEMALE : GENDERS.MALE,
    profession: "",
    qualification: "",
    maritalStatus: "",
    height: "",
  });
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const { toast } = useToast();

  // Dynamic options state
  const [dynamicOptions, setDynamicOptions] = useState({
    profession: PROFESSION_OPTIONS,
    qualification: QUALIFICATION_OPTIONS,
    height: HEIGHT_OPTIONS,
    gender: [GENDERS.MALE, GENDERS.FEMALE],
    age: AGE_OPTIONS,
    maritalStatus: MARITAL_STATUS_OPTIONS,
  });

  // Function to refresh dynamic options
  const refreshDynamicOptions = async () => {
    try {
      const [professionOptions, qualificationOptions, heightOptions, genderOptions, ageOptions, maritalStatusOptions] = await Promise.all([
        getCombinedOptions('profession'),
        getCombinedOptions('qualification'),
        getCombinedOptions('height'),
        getCombinedOptions('gender'),
        getCombinedOptions('age'),
        getCombinedOptions('maritalStatus'),
      ]);

      setDynamicOptions({
        profession: Array.isArray(professionOptions) ? professionOptions : PROFESSION_OPTIONS,
        qualification: Array.isArray(qualificationOptions) ? qualificationOptions : QUALIFICATION_OPTIONS,
        height: Array.isArray(heightOptions) ? heightOptions : HEIGHT_OPTIONS,
        gender: Array.isArray(genderOptions) ? genderOptions : [GENDERS.MALE, GENDERS.FEMALE],
        age: Array.isArray(ageOptions) ? ageOptions : AGE_OPTIONS,
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
      });
    }
  };

  // Load dynamic options when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshDynamicOptions();
    }
  }, [isOpen]);

  const matchingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/match", data);
      return response.json();
    },
    onSuccess: (result) => {
      setMatchResult(result);
      setStep("result");
    },
    onError: (error: any) => {
      toast({
        title: "No Match Found",
        description: "No compatible matches found with your criteria. Please try different parameters.",
        variant: "destructive",
      });
      setStep("form");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.age || !formData.height) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate groom profession requirement
    if (formData.gender === "Male" && !formData.profession) {
      toast({
        title: "Profession Required",
        description: "Groom's profession is mandatory for matching.",
        variant: "destructive",
      });
      return;
    }

    const matchingData = {
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      profession: formData.profession || undefined,
      qualification: formData.qualification || undefined,
      height: formData.height,
    };

    setStep("searching");
    matchingMutation.mutate(matchingData);
  };

  const handleClose = () => {
    setStep("form");
    setFormData({
      name: "",
      age: "",
      gender: type === "bride" ? GENDERS.FEMALE : GENDERS.MALE,
      profession: "",
      qualification: "",
      height: "",
    });
    setMatchResult(null);
    onClose();
  };

  const handleLotteryComplete = () => {
    setStep("result");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800">
                Fill Your {type === "bride" ? "Bride" : "Groom"} Information
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Select
                    value={formData.age}
                    onValueChange={(value) => setFormData({ ...formData, age: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Age" />
                    </SelectTrigger>
                    <SelectContent>
                      {(dynamicOptions.age || []).filter(Boolean).map((age, index) => (
                        <SelectItem key={`age-${index}-${age}`} value={age}>
                          {age}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(dynamicOptions.gender || []).filter(Boolean).map((gender, index) => (
                        <SelectItem key={`gender-${index}-${gender}`} value={gender}>
                          {gender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession">
                    Profession {formData.gender === "Male" ? "*" : ""}
                  </Label>
                  <Select
                    value={formData.profession}
                    onValueChange={(value) => setFormData({ ...formData, profession: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.gender === "Male" ? "Select profession (required)" : "Select profession (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(dynamicOptions.profession || []).filter(Boolean).map((profession, index) => (
                        <SelectItem key={`profession-${index}-${profession}`} value={profession}>
                          {profession}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Select
                    value={formData.qualification}
                    onValueChange={(value) => setFormData({ ...formData, qualification: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select qualification (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {(dynamicOptions.qualification || []).filter(Boolean).map((qualification, index) => (
                        <SelectItem key={`qualification-${index}-${qualification}`} value={qualification}>
                          {qualification}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {(dynamicOptions.maritalStatus || []).filter(Boolean).map((maritalStatus, index) => (
                        <SelectItem key={`maritalStatus-${index}-${maritalStatus}`} value={maritalStatus}>
                          {maritalStatus}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="height">Height *</Label>
                  <Select
                    value={formData.height}
                    onValueChange={(value) => setFormData({ ...formData, height: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select height" />
                    </SelectTrigger>
                    <SelectContent>
                      {(dynamicOptions.height || []).filter(Boolean).map((height, index) => (
                        <SelectItem key={`height-${index}-${height}`} value={height}>
                          {height}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Picture</Label>
                <FileUpload
                  accept="image/*"
                  onFileSelect={(file) => {
                    // Handle image upload for matching

                  }}
                  preview
                >
                  <div className="p-8">
                    <Heart className="w-12 h-12 text-[hsl(330,100%,71%)] mx-auto mb-4" />
                    <p className="text-gray-600">Upload picture for matching</p>
                  </div>
                </FileUpload>
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="btn-pink px-12 py-4 text-lg"
                  disabled={matchingMutation.isPending}
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Find Perfect Match
                </Button>
              </div>
            </form>
          </>
        )}

        {step === "searching" && (
          <LotteryAnimation onComplete={handleLotteryComplete} />
        )}

        {step === "result" && matchResult && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 text-center">
                Perfect Match Found! 🎉
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Input Profile */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Profile</h3>
                <Card className="bg-[hsl(225,73%,97%)]">
                  <CardContent className="p-6">
                    <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
                      {matchResult.inputProfile.gender === "Male" ? (
                        <UserCheck className="w-16 h-16 text-blue-500" />
                      ) : (
                        <UserX className="w-16 h-16 text-pink-500" />
                      )}
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">
                      {matchResult.inputProfile.name}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Age: {matchResult.inputProfile.age}
                      </div>
                      <div className="flex items-center justify-center">
                        {matchResult.inputProfile.gender === "Male" ? (
                          <UserCheck className="w-4 h-4 mr-2 text-blue-500" />
                        ) : (
                          <UserX className="w-4 h-4 mr-2 text-pink-500" />
                        )}
                        Gender: {matchResult.inputProfile.gender}
                      </div>
                      {matchResult.inputProfile.profession && (
                        <div className="flex items-center justify-center">
                          <Briefcase className="w-4 h-4 mr-2" />
                          Profession: {matchResult.inputProfile.profession}
                        </div>
                      )}
                      <div className="flex items-center justify-center">
                        <Ruler className="w-4 h-4 mr-2" />
                        Height: {matchResult.inputProfile.height}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Matched Profile */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Perfect Match</h3>
                <Card className="bg-pink-50">
                  <CardContent className="p-6">
                    <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4 overflow-hidden">
                      {matchResult.matchedProfile.profilePicture ? (
                        <img
                          src={matchResult.matchedProfile.profilePicture}
                          alt={matchResult.matchedProfile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {matchResult.matchedProfile.gender === "Male" ? (
                            <UserCheck className="w-16 h-16 text-blue-500" />
                          ) : (
                            <UserX className="w-16 h-16 text-pink-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">
                      {matchResult.matchedProfile.name}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Age: {matchResult.matchedProfile.age}
                      </div>
                      <div className="flex items-center justify-center">
                        {matchResult.matchedProfile.gender === "Male" ? (
                          <UserCheck className="w-4 h-4 mr-2 text-blue-500" />
                        ) : (
                          <UserX className="w-4 h-4 mr-2 text-pink-500" />
                        )}
                        Gender: {matchResult.matchedProfile.gender}
                      </div>
                      {matchResult.matchedProfile.profession && (
                        <div className="flex items-center justify-center">
                          <Briefcase className="w-4 h-4 mr-2" />
                          Profession: {matchResult.matchedProfile.profession}
                        </div>
                      )}
                      <div className="flex items-center justify-center">
                        <Ruler className="w-4 h-4 mr-2" />
                        Height: {matchResult.matchedProfile.height}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="text-center mt-8">
              <div className="inline-block bg-gradient-to-r from-[hsl(225,73%,57%)] to-[hsl(330,100%,71%)] text-white p-6 rounded-xl">
                <Star className="w-6 h-6 text-yellow-300 mr-2 inline" />
                <span className="text-xl font-bold">
                  Compatibility Score: {matchResult.compatibilityScore}%
                </span>
                <Star className="w-6 h-6 text-yellow-300 ml-2 inline" />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
