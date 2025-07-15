
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, User, Calendar, UserCheck, UserX, Briefcase, Ruler, X, GraduationCap } from "lucide-react";
import { Profile } from "@shared/schema";

interface ProfileDetailModalProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (profile: Profile) => void;
}

export function ProfileDetailModal({ profile, isOpen, onClose, onDownload }: ProfileDetailModalProps) {
  if (!profile || !profile.id) return null;

  // Debug: Log profile data to track what's being passed
  // Profile data includes: id, name, age, gender, profession, qualification, height, birthYear, document, profilePicture

  const handleDownload = () => {
    try {
      if (profile?.document && onDownload) {
        onDownload(profile);
      }
    } catch (error) {
      console.error("Error in ProfileDetailModal download:", error);
    }
  };

  const handleClose = () => {
    try {
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error closing ProfileDetailModal:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0 shadow-2xl animate-modal-in rounded-2xl">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-blue-50/60 backdrop-blur-2xl -z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent -z-10" />
        
        <DialogHeader className="relative pb-4 border-b border-white/30">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
            Profile Details
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute -top-1 -right-1 h-8 w-8 p-0 hover:bg-white/80 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
          >
            <X className="w-4 h-4 text-gray-600" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-6 pt-4 pb-4">
          {/* Profile Header Section */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-xl ring-4 ring-white/70 transition-all duration-300">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 font-mono mb-1">
                {profile.profileId || `GB-${String(profile.id).padStart(5, '0')}`}
              </p>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {profile.name}
              </h2>
            </div>
          </div>

          {/* Profile Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="group bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-blue-100/50 hover:shadow-lg transition-all duration-300">
              <h3 className="text-sm font-semibold text-blue-700 mb-3 uppercase tracking-wide">Basic Info</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100/80 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 font-medium">Age</span>
                    <p className="text-lg font-bold text-gray-800">{profile.age} years</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100/80 rounded-lg">
                    {profile.gender === "Male" ? (
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    ) : (
                      <UserX className="w-4 h-4 text-pink-500" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 font-medium">Gender</span>
                    <p className="text-lg font-bold text-gray-800">{profile.gender}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100/80 rounded-lg">
                    <Ruler className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 font-medium">Height</span>
                    <p className="text-lg font-bold text-gray-800">{profile.height || "Not provided"}</p>
                  </div>
                </div>

                {profile.birthYear && (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100/80 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Birth Year</span>
                      <p className="text-lg font-bold text-gray-800">{profile.birthYear}</p>
                    </div>
                  </div>
                )}

                {profile.maritalStatus && (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100/80 rounded-lg">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Marital Status</span>
                      <p className="text-lg font-bold text-gray-800">{profile.maritalStatus}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Professional Information */}
            <div className="group bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-purple-100/50 hover:shadow-lg transition-all duration-300">
              <h3 className="text-sm font-semibold text-purple-700 mb-3 uppercase tracking-wide">Professional</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100/80 rounded-lg">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <span className="text-xs text-purple-600 font-medium">Profession</span>
                    <p className="text-lg font-bold text-gray-800">{profile.profession || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100/80 rounded-lg">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <span className="text-xs text-purple-600 font-medium">Qualification</span>
                    <p className="text-lg font-bold text-gray-800">{profile.qualification || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="flex justify-center space-x-4 pt-4 border-t border-white/30 bg-white/50 backdrop-blur-sm">
          {profile.document && (
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleClose}
            className="bg-white/80 backdrop-blur-sm border-2 border-gray-300 hover:bg-white hover:border-gray-400 text-gray-700 font-semibold px-6 py-2 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-lg"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
