import { StateCreator } from "zustand";

export type Bill = {
  id?: number;
  user_id?: string;
  room: number;
  electric: number;
  water: number;
  service: number;
  created_at?: string;
};

export interface BillSlice {
  bills: Bill | null;
  gettingBills: boolean;
  billError: string | null;
  getBills: (userId: string) => Promise<void>;
}

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

const createBillSlice: StateCreator<BillSlice> = (set) => ({
  bills: null,
  gettingBills: false,
  billError: null,
  getBills: async (userId: string) => {
    set({ gettingBills: true, billError: null });
    try {
      const res = await fetch(`${API_BASE}/api/bills/${encodeURIComponent(userId)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} - ${text}`);
      }
      const data: Bill = await res.json();
      set({ bills: data, gettingBills: false });
    } catch (e: any) {
      console.error("getBills error", e);
      set({ gettingBills: false, billError: e.message || "Lỗi khi lấy hóa đơn" });
    }
  },
});

export default createBillSlice;
