import { StateCreator } from "zustand";

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface UserSlice {
  user: User | null;
  setUser: (user: User) => void;
}

const createUserSlice: StateCreator<UserSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
});

export default createUserSlice;
