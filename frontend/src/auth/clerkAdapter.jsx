import React from 'react';

export const ClerkProvider = ({ children }) => {
  return <>{children}</>;
};

export const useUser = () => ({ isSignedIn: false, user: null, isLoaded: true });
export const useAuth = () => ({ isSignedIn: false, userId: null, isLoaded: true });
export const SignIn = () => null;
export const SignUp = () => null;
export const UserButton = () => null;

export default { ClerkProvider, useUser, useAuth, SignIn, SignUp, UserButton };
