import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db, configureAuthPersistence } from "./firebase";
import { CRM_COLLECTIONS } from "./collections";
import { transformCrmUserToWorkTimeUser, CrmUserData } from "./roleMapper";
import { CurrentUser, UserRole } from "../types/hrms";
import { storage, STORAGE_KEYS } from "./storage";
import { DEFAULT_USER } from "./storageInit";

interface AuthContextType {
  user: CurrentUser | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithFirebase: (email: string, pass: string, rememberMe?: boolean) => Promise<CurrentUser>;
  login: (email: string, role: UserRole, customUser?: CurrentUser) => void;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  switchPersona: (personaKey: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_USERS: Record<UserRole, CurrentUser> = {
  SUPER_ADMIN: {
    id: "usr-admin-01",
    name: "System Admin (Pune HQ)",
    email: "admin@gryphon.io",
    role: "SUPER_ADMIN",
    avatar: "",
    designation: "Head of Operations & Systems",
    department: "Admin",
    crmOriginalRole: "Director",
    crmDepartment: "Admin",
  },
  HR_ADMIN: {
    id: "EMP-1002",
    name: "Priya Sharma",
    email: "priya.sharma@gryphon.io",
    role: "HR_ADMIN",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    employeeId: "EMP-1002",
    designation: "People Operations Manager",
    department: "Human Resources",
    crmOriginalRole: "Manager",
    crmDepartment: "Human Resources",
  },
  MANAGER: {
    id: "EMP-1003",
    name: "Rajesh Kulkarni",
    email: "rajesh.kulkarni@gryphon.io",
    role: "MANAGER",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    employeeId: "EMP-1003",
    designation: "Engineering Director",
    department: "Engineering",
    crmOriginalRole: "Director",
    crmDepartment: "Engineering",
  },
  EMPLOYEE: {
    id: "EMP-1004",
    name: "Ananya Iyer",
    email: "ananya.iyer@gryphon.io",
    role: "EMPLOYEE",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    employeeId: "EMP-1004",
    designation: "Senior Software Engineer",
    department: "Engineering",
    crmOriginalRole: "Executive",
    crmDepartment: "Engineering",
  },
};

export const DEMO_PERSONAS: Record<string, CurrentUser> = {
  SUPER_ADMIN: DEMO_USERS.SUPER_ADMIN,
  HR_ADMIN: DEMO_USERS.HR_ADMIN,
  MANAGER: DEMO_USERS.MANAGER,
  EMPLOYEE: DEMO_USERS.EMPLOYEE,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    return storage.get<CurrentUser | null>(STORAGE_KEYS.USER, null);
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  /**
   * Look up user profile in CRM Firestore `users` or `hrms_users` collections
   */
  const fetchCrmUserProfile = async (
    fbUser: FirebaseUser
  ): Promise<CurrentUser> => {
    const userEmail = (fbUser.email || "").trim().toLowerCase();

    try {
      // 1. Primary CRM collection check: `users`
      const qUsers = query(
        collection(db, CRM_COLLECTIONS.USERS),
        where("email", "==", userEmail)
      );
      const snapUsers = await getDocs(qUsers);

      if (!snapUsers.empty) {
        const crmDoc = snapUsers.docs[0].data() as CrmUserData;
        return transformCrmUserToWorkTimeUser(fbUser.uid, userEmail, crmDoc);
      }

      // 2. Secondary fallback check: `hrms_users`
      const qHrms = query(
        collection(db, CRM_COLLECTIONS.HRMS_USERS),
        where("email", "==", userEmail)
      );
      const snapHrms = await getDocs(qHrms);

      if (!snapHrms.empty) {
        const hrmsDoc = snapHrms.docs[0].data() as CrmUserData;
        return transformCrmUserToWorkTimeUser(fbUser.uid, userEmail, hrmsDoc);
      }

      // 3. Document ID direct check: `users/{uid}`
      const directDocRef = doc(db, CRM_COLLECTIONS.USERS, fbUser.uid);
      const directDocSnap = await getDoc(directDocRef);
      if (directDocSnap.exists()) {
        const directData = directDocSnap.data() as CrmUserData;
        return transformCrmUserToWorkTimeUser(fbUser.uid, userEmail, directData);
      }
    } catch (err) {
      console.warn("Could not retrieve user document from CRM Firestore:", err);
    }

    // Default transformation if doc is missing in CRM (defaults to EMPLOYEE)
    return transformCrmUserToWorkTimeUser(fbUser.uid, userEmail, {
      name: fbUser.displayName || userEmail.split("@")[0],
      email: userEmail,
      role: "Employee",
      department: "Operations",
    });
  };

  /**
   * Listen to Firebase Auth state on application boot
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const mappedUser = await fetchCrmUserProfile(fbUser);
          setUser(mappedUser);
          storage.set(STORAGE_KEYS.USER, mappedUser);
        } catch (err) {
          console.error("Error synchronizing CRM user profile:", err);
        }
      } else {
        // If no active Firebase session, check if a demo user was stored locally
        const cached = storage.get<CurrentUser | null>(STORAGE_KEYS.USER, null);
        if (cached && cached.id?.startsWith("usr-admin") || cached?.id?.startsWith("EMP-")) {
          setUser(cached);
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Real Firebase Authentication against shared `gryphon-sync`
   */
  const loginWithFirebase = async (
    email: string,
    pass: string,
    rememberMe: boolean = true
  ): Promise<CurrentUser> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      await configureAuthPersistence(rememberMe);
      const creds = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        pass
      );

      const mappedUser = await fetchCrmUserProfile(creds.user);
      setUser(mappedUser);
      storage.set(STORAGE_KEYS.USER, mappedUser);
      setIsLoading(false);
      return mappedUser;
    } catch (error: any) {
      setIsLoading(false);
      let message = "Failed to sign in. Please check your credentials.";

      if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password") {
        message = "Invalid corporate email or password. Please try again.";
      } else if (error?.code === "auth/user-not-found") {
        message = "No account found with this email in Gryphon CRM.";
      } else if (error?.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please wait a moment before trying again.";
      } else if (error?.code === "auth/network-request-failed") {
        message = "Network error. Please check your internet connection.";
      } else if (error?.message) {
        message = error.message;
      }

      setAuthError(message);
      throw new Error(message);
    }
  };

  /**
   * Mock / Demo Persona Login (offline development convenience)
   */
  const login = (email: string, role: UserRole, customUser?: CurrentUser) => {
    let demoUser: CurrentUser;
    if (customUser) {
      demoUser = customUser;
    } else {
      demoUser = DEMO_USERS[role] || {
        ...DEFAULT_USER,
        email,
        role,
      };
    }
    storage.set(STORAGE_KEYS.USER, demoUser);
    setUser(demoUser);
  };

  /**
   * Log out of both Firebase and local session
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Firebase signout warning:", err);
    }
    storage.set<CurrentUser | null>(STORAGE_KEYS.USER, null);
    setUser(null);
    setFirebaseUser(null);
  };

  /**
   * Interactive role switcher (for previewing role-scoped features)
   */
  const switchRole = (newRole: UserRole) => {
    if (user) {
      const updated: CurrentUser = {
        ...user,
        role: newRole,
      };
      storage.set(STORAGE_KEYS.USER, updated);
      setUser(updated);
    } else {
      const updated = DEMO_USERS[newRole];
      storage.set(STORAGE_KEYS.USER, updated);
      setUser(updated);
    }
  };

  const switchPersona = (personaKey: string) => {
    const persona = DEMO_PERSONAS[personaKey];
    if (persona) {
      storage.set(STORAGE_KEYS.USER, persona);
      setUser(persona);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isLoading,
        authError,
        clearAuthError,
        loginWithFirebase,
        login,
        logout,
        switchRole,
        switchPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
