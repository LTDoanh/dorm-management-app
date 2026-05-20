import { AppError } from "@dts";
import debounce from "lodash.debounce";
import { StateCreator } from "zustand";

export interface AppSlice {
    error?: AppError;
    setError: (error?: AppError) => void;
}

const appSlice: StateCreator<AppSlice, [], [], AppSlice> = (set, get) => ({
    /**
     * Thiết lập và tự động xóa thông báo lỗi hệ thống bằng debounce
     */
    setError: (error?: AppError) => {
        set(state => ({ ...state, error }));
        debounce(() => {
            if (get().error) {
                set(state => ({ ...state, error: undefined }));
            }
        }, 500);
    },
});

export default appSlice;
