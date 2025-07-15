import { users, profiles, matches, customOptions, type User, type InsertUser, type Profile, type InsertProfile, type Match, type InsertMatch, type CustomOption, type InsertCustomOption } from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserEmail(id: number, email: string): Promise<User | undefined>;
  updateUserPassword(id: number, password: string): Promise<User | undefined>;

  // Profile methods
  getAllProfiles(): Promise<Profile[]>;
  getProfile(id: number): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  deleteProfile(id: number): Promise<boolean>;
  searchProfiles(filters: Partial<{
    gender: string;
    profession: string;
    birthYear: number;
    height: string;
    age: number;
    date: string;
  }>): Promise<Profile[]>;
  getProfilesByGender(gender: string): Promise<Profile[]>;

  // Match methods
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchesForProfile(profileId: number): Promise<Match[]>;
  getRecentMatches(): Promise<Array<Match & { profile: Profile; matchedProfile: Profile }>>;

  // Statistics
  getProfileStats(): Promise<{
    totalProfiles: number;
    brideProfiles: number;
    groomProfiles: number;
  }>;

  // Custom options methods
  getCustomOptions(fieldType: string): Promise<CustomOption[]>;
  createCustomOption(option: InsertCustomOption): Promise<CustomOption>;
  deleteCustomOption(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private db: any;

  constructor(database: any) {
    this.db = database;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserEmail(id: number, email: string): Promise<User | undefined> {
    const [user] = await this.db
      .update(users)
      .set({ email })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(id: number, password: string): Promise<User | undefined> {
    const [user] = await this.db
      .update(users)
      .set({ password })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllProfiles(): Promise<Profile[]> {
    return await this.db.select().from(profiles).orderBy(desc(profiles.createdAt));
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.id, id));
    return profile || undefined;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    // Generate unique profile ID
    const profileId = await this.generateUniqueProfileId();
    
    const [newProfile] = await this.db
      .insert(profiles)
      .values({
        ...profile,
        profileId,
        updatedAt: new Date(),
      })
      .returning();
    return newProfile;
  }

  private async generateUniqueProfileId(): Promise<string> {
    let profileId: string;
    let isUnique = false;
    
    while (!isUnique) {
      // Generate random 5-digit number
      const randomNumber = Math.floor(10000 + Math.random() * 90000);
      profileId = `GB-${randomNumber}`;
      
      // Check if it already exists
      const [existing] = await this.db
        .select()
        .from(profiles)
        .where(eq(profiles.profileId, profileId));
      
      if (!existing) {
        isUnique = true;
      }
    }
    
    return profileId!;
  }

  async updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [updatedProfile] = await this.db
      .update(profiles)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
      .returning();
    return updatedProfile || undefined;
  }

  async deleteProfile(id: number): Promise<boolean> {
    const result = await this.db.delete(profiles).where(eq(profiles.id, id));
    return (result.rowCount || 0) > 0;
  }

  async searchProfiles(filters: Partial<{
    gender: string;
    profession: string;
    birthYear: number;
    height: string;
    age: number;
    date: string;
  }>): Promise<Profile[]> {
    let query = this.db.select().from(profiles);
    
    const conditions = [];
    
    if (filters.gender) {
      conditions.push(eq(profiles.gender, filters.gender));
    }
    
    if (filters.profession) {
      conditions.push(sql`${profiles.profession} ILIKE ${`%${filters.profession}%`}`);
    }
    
    if (filters.birthYear) {
      conditions.push(eq(profiles.birthYear, filters.birthYear));
    }
    
    if (filters.height) {
      conditions.push(eq(profiles.height, filters.height));
    }
    
    if (filters.age) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - filters.age;
      conditions.push(eq(profiles.birthYear, birthYear));
    }
    
    if (conditions.length > 0) {
      const result = await query.where(and(...conditions)).orderBy(desc(profiles.createdAt));
      return result;
    }
    
    return await query.orderBy(desc(profiles.createdAt));
  }

  async getProfilesByGender(gender: string): Promise<Profile[]> {
    return await this.db.select().from(profiles).where(eq(profiles.gender, gender));
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await this.db
      .insert(matches)
      .values(match)
      .returning();
    return newMatch;
  }

  async getMatchesForProfile(profileId: number): Promise<Match[]> {
    return await this.db.select().from(matches).where(
      or(
        eq(matches.profileId, profileId),
        eq(matches.matchedProfileId, profileId)
      )
    );
  }

  async getRecentMatches(): Promise<Array<Match & { profile: Profile; matchedProfile: Profile }>> {
    const result = await this.db
      .select({
        match: matches,
        profile: profiles,
        matchedProfile: {
          id: sql`mp.id`,
          name: sql`mp.name`,
          age: sql`mp.age`,
          gender: sql`mp.gender`,
          profession: sql`mp.profession`,
          height: sql`mp.height`,
          profilePicture: sql`mp.profile_picture`,
          document: sql`mp.document`,
          birthYear: sql`mp.birth_year`,
          createdAt: sql`mp.created_at`,
          updatedAt: sql`mp.updated_at`,
        }
      })
      .from(matches)
      .innerJoin(profiles, eq(matches.profileId, profiles.id))
      .innerJoin(sql`profiles mp`, sql`matches.matched_profile_id = mp.id`)
      .orderBy(desc(matches.createdAt))
      .limit(10);

    return result.map(r => ({
      ...r.match,
      profile: r.profile,
      matchedProfile: r.matchedProfile as Profile,
    }));
  }

  async getProfileStats(): Promise<{
    totalProfiles: number;
    brideProfiles: number;
    groomProfiles: number;
  }> {
    const totalResult = await this.db.select({ count: sql<number>`count(*)` }).from(profiles);
    const brideResult = await this.db.select({ count: sql<number>`count(*)` }).from(profiles).where(eq(profiles.gender, 'Female'));
    const groomResult = await this.db.select({ count: sql<number>`count(*)` }).from(profiles).where(eq(profiles.gender, 'Male'));

    return {
      totalProfiles: totalResult[0]?.count || 0,
      brideProfiles: brideResult[0]?.count || 0,
      groomProfiles: groomResult[0]?.count || 0,
    };
  }

  // Custom options methods
  async getCustomOptions(fieldType: string): Promise<CustomOption[]> {
    return await this.db
      .select()
      .from(customOptions)
      .where(eq(customOptions.fieldType, fieldType))
      .orderBy(customOptions.value);
  }

  async createCustomOption(option: InsertCustomOption): Promise<CustomOption> {
    const [newOption] = await this.db
      .insert(customOptions)
      .values(option)
      .returning();
    return newOption;
  }

  async deleteCustomOption(id: number): Promise<boolean> {
    const result = await this.db.delete(customOptions).where(eq(customOptions.id, id));
    return (result.rowCount || 0) > 0;
  }
}

// In-memory storage for development/migration
export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private profiles: Profile[] = [];
  private matches: Match[] = [];
  private customOptions: CustomOption[] = [];
  private nextUserId = 1;
  private nextProfileId = 1;
  private nextMatchId = 1;
  private nextCustomOptionId = 1;

  private initialized = false;

  constructor() {
    // Initialize with admin user
    this.initializeAdminUser();
  }

  private async initializeAdminUser() {
    if (!this.initialized) {
      const hashedPassword = await bcrypt.hash('admin12345', 10);
      this.users.push({
        id: this.nextUserId++,
        username: 'admin12345',
        email: 'admin@ghotokbari.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      this.initialized = true;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.initialized) {
      await this.initializeAdminUser();
    }
    return this.users.find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextUserId++,
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUserEmail(id: number, email: string): Promise<User | undefined> {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.email = email;
      user.updatedAt = new Date();
      return user;
    }
    return undefined;
  }

  async updateUserPassword(id: number, password: string): Promise<User | undefined> {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.password = password;
      user.updatedAt = new Date();
      return user;
    }
    return undefined;
  }

  async getAllProfiles(): Promise<Profile[]> {
    return [...this.profiles].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    return this.profiles.find(p => p.id === id);
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const profileId = this.generateUniqueProfileId();
    const newProfile: Profile = {
      id: this.nextProfileId++,
      ...profile,
      profileId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.profiles.push(newProfile);
    return newProfile;
  }

  private generateUniqueProfileId(): string {
    let profileId: string;
    let isUnique = false;
    
    while (!isUnique) {
      // Generate random 5-digit number
      const randomNumber = Math.floor(10000 + Math.random() * 90000);
      profileId = `GB-${randomNumber}`;
      
      // Check if it already exists
      const existing = this.profiles.find(p => p.profileId === profileId);
      
      if (!existing) {
        isUnique = true;
      }
    }
    
    return profileId!;
  }

  async updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile | undefined> {
    const existingProfile = this.profiles.find(p => p.id === id);
    if (existingProfile) {
      Object.assign(existingProfile, profile, { updatedAt: new Date() });
      return existingProfile;
    }
    return undefined;
  }

  async deleteProfile(id: number): Promise<boolean> {
    const index = this.profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      this.profiles.splice(index, 1);
      return true;
    }
    return false;
  }

  async searchProfiles(filters: Partial<{
    gender: string;
    profession: string;
    birthYear: number;
    height: string;
    age: number;
    date: string;
  }>): Promise<Profile[]> {
    let results = [...this.profiles];
    
    if (filters.gender) {
      results = results.filter(p => p.gender === filters.gender);
    }
    
    if (filters.profession) {
      results = results.filter(p => p.profession === filters.profession);
    }
    
    if (filters.birthYear) {
      results = results.filter(p => p.birthYear === filters.birthYear);
    }
    
    if (filters.height) {
      results = results.filter(p => p.height === filters.height);
    }
    
    if (filters.age) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - filters.age;
      results = results.filter(p => p.birthYear === birthYear);
    }
    
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProfilesByGender(gender: string): Promise<Profile[]> {
    return this.profiles.filter(p => p.gender === gender);
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const newMatch: Match = {
      id: this.nextMatchId++,
      ...match,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.matches.push(newMatch);
    return newMatch;
  }

  async getMatchesForProfile(profileId: number): Promise<Match[]> {
    return this.matches.filter(m => m.profileId === profileId || m.matchedProfileId === profileId);
  }

  async getRecentMatches(): Promise<Array<Match & { profile: Profile; matchedProfile: Profile }>> {
    const recentMatches = [...this.matches]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
    
    return recentMatches.map(match => {
      const profile = this.profiles.find(p => p.id === match.profileId);
      const matchedProfile = this.profiles.find(p => p.id === match.matchedProfileId);
      return {
        ...match,
        profile: profile!,
        matchedProfile: matchedProfile!
      };
    }).filter(item => item.profile && item.matchedProfile);
  }

  async getProfileStats(): Promise<{
    totalProfiles: number;
    brideProfiles: number;
    groomProfiles: number;
  }> {
    const totalProfiles = this.profiles.length;
    const brideProfiles = this.profiles.filter(p => p.gender === 'Female').length;
    const groomProfiles = this.profiles.filter(p => p.gender === 'Male').length;
    
    return {
      totalProfiles,
      brideProfiles,
      groomProfiles
    };
  }

  async getCustomOptions(fieldType: string): Promise<CustomOption[]> {
    return this.customOptions
      .filter(co => co.fieldType === fieldType)
      .sort((a, b) => a.value.localeCompare(b.value));
  }

  async createCustomOption(option: InsertCustomOption): Promise<CustomOption> {
    const newOption: CustomOption = {
      id: this.nextCustomOptionId++,
      ...option,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.customOptions.push(newOption);
    return newOption;
  }

  async deleteCustomOption(id: number): Promise<boolean> {
    const index = this.customOptions.findIndex(co => co.id === id);
    if (index !== -1) {
      this.customOptions.splice(index, 1);
      return true;
    }
    return false;
  }
}

// Production-grade database connection with security checks
async function createStorage(): Promise<IStorage> {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Production safety check - never allow fallback to memory storage in production
  if (isProduction && !process.env.DATABASE_URL) {
    throw new Error(
      "CRITICAL: DATABASE_URL is required in production. " +
      "Application cannot start without persistent database connection."
    );
  }
  
  try {
    console.log("Attempting to initialize database storage...");
    const { db } = await import("./db");
    
    // Test the database connection with retry logic
    let connectionAttempts = 0;
    const maxRetries = 3;
    
    while (connectionAttempts < maxRetries) {
      try {
        await db.select().from(users).limit(1);
        console.log("Database connection successful, using DatabaseStorage");
        return new DatabaseStorage(db);
      } catch (retryError) {
        connectionAttempts++;
        console.log(`Database connection attempt ${connectionAttempts} failed:`, retryError.message);
        
        if (connectionAttempts < maxRetries) {
          console.log(`Retrying in 2 seconds... (${connectionAttempts}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
    
  } catch (error) {
    if (isProduction) {
      // In production, never fall back to memory storage
      console.error("CRITICAL ERROR: Database connection failed in production");
      console.error("Error details:", error.message);
      throw new Error(
        "Production database connection failed. " +
        "Application cannot start without persistent database. " +
        "Please check DATABASE_URL and database availability."
      );
    } else {
      // Only allow fallback in development
      console.log("Database connection failed, using in-memory storage:", error.message);
      console.log("⚠️  WARNING: Using temporary memory storage in development");
      const memStorage = new MemoryStorage();
      console.log("MemoryStorage initialized successfully");
      return memStorage;
    }
  }
}

export const storage = await createStorage();
