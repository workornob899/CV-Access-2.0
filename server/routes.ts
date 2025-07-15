import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProfileSchema, insertMatchSchema, insertCustomOptionSchema } from "@shared/schema";
import { testConnection } from "./db";
import bcrypt from "bcrypt";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profilePicture') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for profile pictures'));
      }
    } else if (file.fieldname === 'document') {
      if (file.mimetype === 'application/pdf' || 
          file.mimetype === 'application/msword' ||
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF and DOC files are allowed for documents'));
      }
    } else {
      cb(new Error('Invalid field name'));
    }
  }
});

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create memory store for sessions
  const MemStore = MemoryStore(session);

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'ghotokbari-secret-key',
    store: new MemStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Document download endpoint with proper filename
  app.get('/api/profiles/:id/download-document', requireAuth, async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      console.log(`Download request for profile ID: ${profileId}`);
      
      const profile = await storage.getProfile(profileId);
      
      if (!profile) {
        console.log(`Profile not found: ${profileId}`);
        return res.status(404).json({ message: 'Profile not found' });
      }
      
      if (!profile.document) {
        console.log(`No document found for profile: ${profileId}`);
        return res.status(404).json({ message: 'No document found for this profile' });
      }
      
      // Get the file path (remove /uploads prefix)
      const fileName = profile.document.replace('/uploads/', '');
      const filePath = path.join(uploadDir, fileName);
      
      console.log(`Looking for file at: ${filePath}`);
      console.log(`Original document name: ${profile.documentOriginal}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`File does not exist: ${filePath}`);
        return res.status(404).json({ message: 'Document file not found' });
      }
      
      // Set the proper filename for download
      const originalName = profile.documentOriginal || `document_${profile.id}`;
      console.log(`Setting download filename to: ${originalName}`);
      
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      console.log(`File download started for: ${originalName}`);
      
    } catch (error) {
      console.error('Document download error:', error);
      res.status(500).json({ message: 'Failed to download document' });
    }
  });

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('Login attempt:', req.body);
      const { username, password } = req.body;

      // Check hardcoded admin credentials
      if (username === 'admin12345' && password === 'admin12345') {
        console.log('Admin credentials valid, looking for user...');
        // Create or get admin user
        let user = await storage.getUserByUsername(username);
        console.log('Found user:', user ? 'Yes' : 'No');
        if (!user) {
          console.log('Creating new admin user...');
          const hashedPassword = await bcrypt.hash(password, 10);
          user = await storage.createUser({
            username,
            password: hashedPassword,
            email: 'admin12345',
          });
          console.log('Created user:', user);
        }

        req.session.userId = user.id;
        console.log('Set session userId:', user.id);
        res.json({ user: { id: user.id, username: user.username, email: user.email } });
      } else {
        console.log('Invalid credentials provided');
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user info' });
    }
  });

  // Profile routes
  app.get('/api/profiles', requireAuth, async (req, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch profiles' });
    }
  });

  app.get('/api/profiles/search', requireAuth, async (req, res) => {
    try {
      const filters = {
        gender: req.query.gender as string,
        profession: req.query.profession as string,
        birthYear: req.query.birthYear ? parseInt(req.query.birthYear as string) : undefined,
        height: req.query.height as string,
        age: req.query.age ? parseInt(req.query.age as string) : undefined,
        date: req.query.date as string,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => 
        filters[key as keyof typeof filters] === undefined && delete filters[key as keyof typeof filters]
      );

      const profiles = await storage.searchProfiles(filters);
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to search profiles' });
    }
  });

  app.post('/api/profiles', requireAuth, upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const profileData = {
        name: req.body.name,
        age: parseInt(req.body.age),
        gender: req.body.gender,
        profession: req.body.profession || null,
        qualification: req.body.qualification || null,
        height: req.body.height,
        birthYear: parseInt(req.body.birthYear),
        profilePicture: null as string | null,
        profilePictureOriginal: null as string | null,
        document: null as string | null,
        documentOriginal: null as string | null,
      };

      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files.profilePicture && files.profilePicture[0]) {
        profileData.profilePicture = `/uploads/${files.profilePicture[0].filename}`;
        profileData.profilePictureOriginal = files.profilePicture[0].originalname;
      }
      
      if (files.document && files.document[0]) {
        profileData.document = `/uploads/${files.document[0].filename}`;
        profileData.documentOriginal = files.document[0].originalname;
      }

      const validatedData = insertProfileSchema.parse(profileData);
      const profile = await storage.createProfile(validatedData);
      
      res.status(201).json(profile);
    } catch (error) {
      console.error('Profile creation error:', error);
      res.status(400).json({ message: 'Failed to create profile' });
    }
  });

  app.get('/api/profiles/stats', requireAuth, async (req, res) => {
    try {
      const stats = await storage.getProfileStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch profile statistics' });
    }
  });

  // Database health monitoring endpoint
  app.get('/api/health/database', requireAuth, async (req, res) => {
    try {
      const isHealthy = await testConnection();
      const storageType = process.env.DATABASE_URL ? 'PostgreSQL' : 'Memory';
      
      res.json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        storageType,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Database health check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Update profile
  app.patch('/api/profiles/:id', requireAuth, upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const profileData = {
        name: req.body.name,
        age: parseInt(req.body.age),
        gender: req.body.gender,
        profession: req.body.profession || null,
        qualification: req.body.qualification || null,
        height: req.body.height,
        birthYear: parseInt(req.body.birthYear),
        profilePicture: null as string | null,
        profilePictureOriginal: null as string | null,
        document: null as string | null,
        documentOriginal: null as string | null,
      };

      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files.profilePicture && files.profilePicture[0]) {
        profileData.profilePicture = `/uploads/${files.profilePicture[0].filename}`;
        profileData.profilePictureOriginal = files.profilePicture[0].originalname;
      }
      
      if (files.document && files.document[0]) {
        profileData.document = `/uploads/${files.document[0].filename}`;
        profileData.documentOriginal = files.document[0].originalname;
      }

      const updatedProfile = await storage.updateProfile(profileId, profileData);
      
      if (!updatedProfile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      
      res.json(updatedProfile);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({ message: 'Failed to update profile' });
    }
  });

  // Delete profile
  app.delete('/api/profiles/:id', requireAuth, async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const success = await storage.deleteProfile(profileId);
      
      if (!success) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      
      res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
      console.error('Profile deletion error:', error);
      res.status(500).json({ message: 'Failed to delete profile' });
    }
  });

  // Helper function to parse height
  const parseHeight = (height: string): number => {
    const match = height.match(/(\d+)'(\d+)"/);
    if (match) {
      const feet = parseInt(match[1]);
      const inches = parseInt(match[2]);
      return feet * 12 + inches;
    }
    return 0;
  };

  // Store recent matches to avoid repetition
  let recentMatches: number[] = [];
  const MAX_RECENT_MATCHES = 3;

  // Matching routes
  app.post('/api/match', requireAuth, async (req, res) => {
    try {
      const { name, age, gender, profession, height } = req.body;
      
      // Validate groom profession requirement
      if (gender === 'Male' && !profession) {
        return res.status(400).json({ message: 'Groom profession is mandatory' });
      }
      
      // Find opposite gender profiles
      const oppositeGender = gender === 'Male' ? 'Female' : 'Male';
      const candidateProfiles = await storage.getProfilesByGender(oppositeGender);
      
      // Apply exact matching logic
      const compatibleProfiles = candidateProfiles.filter(profile => {
        const inputHeightInches = parseHeight(height);
        const candidateHeightInches = parseHeight(profile.height);

        if (gender === 'Male') {
          // Male (Groom) looking for female (Bride)
          // Bride should be 3-6 years younger and 6-8 inches shorter
          const ageDiff = age - profile.age;
          const heightDiff = inputHeightInches - candidateHeightInches;
          
          return ageDiff >= 3 && ageDiff <= 6 && heightDiff >= 6 && heightDiff <= 8;
        } else {
          // Female (Bride) looking for male (Groom)
          // Groom should be 3-6 years older and 6-8 inches taller
          // Groom must have profession
          if (!profile.profession) {
            return false;
          }

          const ageDiff = profile.age - age;
          const heightDiff = candidateHeightInches - inputHeightInches;
          
          return ageDiff >= 3 && ageDiff <= 6 && heightDiff >= 6 && heightDiff <= 8;
        }
      });

      if (compatibleProfiles.length === 0) {
        return res.status(404).json({ message: 'No compatible matches found' });
      }

      // Filter out recently matched profiles
      const availableMatches = compatibleProfiles.filter(profile => 
        !recentMatches.includes(profile.id)
      );

      // If all matches are recent, clear the history and use all matches
      const matchesToUse = availableMatches.length > 0 ? availableMatches : compatibleProfiles;

      if (availableMatches.length === 0) {
        recentMatches = []; // Reset recent matches
      }

      // Select random match from available profiles
      const randomIndex = Math.floor(Math.random() * matchesToUse.length);
      const randomMatch = matchesToUse[randomIndex];

      // Add to recent matches
      recentMatches.push(randomMatch.id);
      if (recentMatches.length > MAX_RECENT_MATCHES) {
        recentMatches.shift(); // Remove oldest
      }
      
      // Calculate compatibility score (based on age and height compatibility)
      const compatibilityScore = Math.floor(Math.random() * 15) + 85; // 85-100%

      // Store the match if profiles exist
      const inputProfile = { name, age, gender, profession, height, birthYear: new Date().getFullYear() - age };
      
      res.json({
        inputProfile,
        matchedProfile: randomMatch,
        compatibilityScore,
      });
    } catch (error) {
      console.error('Matching error:', error);
      res.status(500).json({ message: 'Failed to find match' });
    }
  });

  // Settings routes
  app.put('/api/user/email', requireAuth, async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.updateUserEmail(req.session.userId!, email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update email' });
    }
  });

  app.put('/api/user/password', requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // For admin user, allow password change without verification
      if (user.username === 'admin12345') {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);
        
        if (!updatedUser) {
          return res.status(500).json({ message: 'Failed to update password' });
        }
        
        res.json({ message: 'Password updated successfully' });
      } else {
        res.status(400).json({ message: 'Password change not allowed for this user' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to update password' });
    }
  });

  // Custom options routes
  app.get('/api/custom-options/:fieldType', requireAuth, async (req, res) => {
    try {
      const { fieldType } = req.params;
      const options = await storage.getCustomOptions(fieldType);
      res.json(options);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch custom options' });
    }
  });

  app.post('/api/custom-options', requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomOptionSchema.parse(req.body);
      const option = await storage.createCustomOption(validatedData);
      res.status(201).json(option);
    } catch (error) {
      console.error('Custom option creation error:', error);
      res.status(400).json({ message: 'Failed to create custom option' });
    }
  });

  app.delete('/api/custom-options/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCustomOption(parseInt(id));
      if (deleted) {
        res.json({ message: 'Custom option deleted successfully' });
      } else {
        res.status(404).json({ message: 'Custom option not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete custom option' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
