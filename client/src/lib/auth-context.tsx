import { createContext, useContext, useEffect, useState } from "react";
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { User, UserRole } from "@shared/schema";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as User);
        }
      } else {
        // User is null (logged out)
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<User | null> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Immediately set the current user
    setCurrentUser(userCredential.user);
    
    // Fetch the user profile from Firestore
    let userDoc = await getDoc(doc(db, "users", uid));
    
    if (userDoc.exists()) {
      const profile = userDoc.data() as User;
      setUserProfile(profile);
      
      // Wait longer to ensure all state updates are processed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return profile;
    }
    
    // If user profile doesn't exist, check if this is a professor
    // and create user profile on-the-fly
    const professorsQuery = query(collection(db, "professors"), where("userId", "==", uid));
    const profSnapshot = await getDocs(professorsQuery);
    
    if (!profSnapshot.empty) {
      const professorData = profSnapshot.docs[0].data();
      const profile: User = {
        id: uid,
        email: professorData.email || email,
        displayName: `${professorData.firstName} ${professorData.lastName}`,
        role: "professor",
        createdAt: Date.now(),
      };
      
      // Save the created profile to users collection
      await setDoc(doc(db, "users", uid), profile);
      setUserProfile(profile);
      
      // Wait longer to ensure all state updates are processed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return profile;
    }
    
    // Wait a moment even if no profile found
    await new Promise(resolve => setTimeout(resolve, 300));
    return null;
  };

  const signUp = async (email: string, password: string, displayName: string, role: UserRole) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    const userProfile: User = {
      id: user.uid,
      email,
      displayName,
      role,
      createdAt: Date.now(),
    };

    await setDoc(doc(db, "users", user.uid), userProfile);

    // If registering as professor, also create a professor profile
    if (role === "professor") {
      const [firstName, ...lastNameParts] = displayName.split(" ");
      const lastName = lastNameParts.join(" ") || "Professor";
      
      await setDoc(doc(db, "professors", user.uid), {
        userId: user.uid,
        firstName,
        lastName,
        email,
        department: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    setUserProfile(userProfile);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
