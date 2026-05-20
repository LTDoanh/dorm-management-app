import { User } from "@dts";
import { getToken, getZaloUserInfo } from "@service/zalo";
import { getUserById, saveUser } from "@service/services";
import { StateCreator } from "zustand";

export interface AuthSlice {
    token?: string;
    user?: User;
    loadingToken: boolean;
    loadingUserInfo: boolean;
    loadingAuth: boolean;
    setToken: (token: string) => void;
    getToken: () => string | undefined;
    getUser: () => User | undefined;
    setUser: (user: User) => void;
    setLoading: (loading: boolean) => void;
    getUserInfo: () => Promise<void>;
    getAccessToken: () => Promise<void>;
    checkUserRole: () => Promise<"chu-tro" | "nguoi-thue" | null>;
    saveUserRole: (role: "chu-tro" | "nguoi-thue", phoneNumber?: string) => Promise<void>;
}

const authSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set, get) => ({
    token: "",
    user: undefined,
    loadingToken: false,
    loadingUserInfo: false,
    loadingAuth: false,
    setToken: (token: string) => {
        set(state => ({ ...state, token }));
    },
    getToken: () => get().token,
    getUser: () => get().user,
    setUser: (user: User) => {
        set(state => ({ ...state, user }));
    },
    setLoading: (loading: boolean) => {
        set(state => ({ ...state, loading }));
    },
    getUserInfo: async () => {
        try {
            set(state => ({ ...state, loadingUserInfo: true }));
            const user = await getZaloUserInfo();

            set(state => ({ ...state, user }));
        } catch (err) {
            console.log("ERR: ", err);
        } finally {
            set(state => ({ ...state, loadingUserInfo: false }));
        }
    },
    getAccessToken: async () => {
        try {
            set(state => ({ ...state, loadingToken: true }));
            const token = await getToken();
            set(state => ({ ...state, token }));
        } catch (err) {
            console.log("ERR: ", err);
        } finally {
            set(state => ({ ...state, loadingToken: false }));
        }
    },
    /**
     * Đồng bộ và kiểm tra vai trò hiện tại của người dùng từ cache hoặc cơ sở dữ liệu
     */
    checkUserRole: async () => {
        try {
            set(state => ({ ...state, loadingAuth: true }));

            const cachedRole = localStorage.getItem("user_role") as "chu-tro" | "nguoi-thue" | null;
            if (cachedRole) {
                console.log("Found cached role:", cachedRole);
            }

            const currentUser = get().user;
            let zaloUser = currentUser;

            if (!zaloUser?.idByOA) {
                zaloUser = await getZaloUserInfo();
                set(state => ({ ...state, user: zaloUser }));
            }

            if (!zaloUser.idByOA) {
                return null;
            }

            const dbUser = await getUserById(zaloUser.idByOA);

            if (dbUser?.role) {
                localStorage.setItem("user_role", dbUser.role);

                set(state => ({
                    ...state,
                    user: { ...zaloUser, role: dbUser.role }
                }));
                return dbUser.role as "chu-tro" | "nguoi-thue";
            }

            return null;
        } catch (err) {
            const cachedRole = localStorage.getItem("user_role") as "chu-tro" | "nguoi-thue" | null;
            if (cachedRole) return cachedRole;

            return null;
        } finally {
            set(state => ({ ...state, loadingAuth: false }));
        }
    },
    /**
     * Khởi tạo hoặc cập nhật vai trò người dùng lên server và đồng bộ cache local
     */
    saveUserRole: async (role: "chu-tro" | "nguoi-thue", phoneNumber?: string) => {
        try {
            set(state => ({ ...state, loadingAuth: true }));
            const currentUser = get().user;
            if (!currentUser) {
                throw new Error("Chưa có thông tin user");
            }

            const userData = {
                id: currentUser.idByOA || currentUser.id,
                name: currentUser.name,
                avatar: currentUser.avatar,
                role,
                phone_number: phoneNumber || null,
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const savedUser = await saveUser(userData as any);

            localStorage.setItem("user_role", savedUser.role);

            set(state => ({
                ...state,
                user: { ...currentUser, role: savedUser.role }
            }));
        } catch (err) {
            console.log("ERR saveUserRole: ", err);
            throw err;
        } finally {
            set(state => ({ ...state, loadingAuth: false }));
        }
    },
});

export default authSlice;
