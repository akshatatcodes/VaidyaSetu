import React from 'react';

// Stabilize user object reference outside the hook
const DEMO_USER = {
  id: "user_2test123",
  fullName: "Demo User",
  primaryEmailAddress: { emailAddress: "demo@vaidyasetu.test" },
  imageUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
};

export const useUser = () => {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: DEMO_USER
  };
};

export const ClerkProvider = ({ children }) => <>{children}</>;
export const SignedIn = ({ children }) => <>{children}</>;
export const SignedOut = ({ children }) => null;
export const RedirectToSignIn = () => null;

export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  userId: "user_2test123",
  sessionId: "sess_demo",
  getToken: async () => "demo_token"
});

export const UserButton = () => null;
export const SignInButton = ({ children }) => <button>{children}</button>;
export const useClerk = () => ({ signOut: () => {} });
