import { Articles, Organization } from "@dts";
import {
    getArticles,
    GetArticlesParams,
    getOrganization,
    GetOrganizationParams,
} from "@service/services.mock";

import { followOfficialAccount } from "@service/zalo";
import { StateCreator } from "zustand";

export interface OrganizationSlice {
    organization?: Organization;
    gettingOrganization?: boolean;
    gettingArticles?: boolean;
    articles?: Articles;
    followOA: (params: { id: string }) => Promise<void>;
    getOrganization: (params: GetOrganizationParams) => Promise<void>;
    getArticles: (params: GetArticlesParams) => Promise<void>;
}

const organizationSlice: StateCreator<OrganizationSlice> = (set, get) => ({
    organization: undefined,

    gettingOrganization: false,
    gettingProfile: false,

    /**
     * Gửi yêu cầu quan tâm Official Account Zalo và cập nhật trạng thái tương tác vào store
     */
    followOA: async (params: { id: string }) => {
        try {
            await followOfficialAccount(params);
            const org = get().organization;

            if (org) {
                org.officialAccounts = org.officialAccounts?.map(item => {
                    if (item.oaId !== params.id) {
                        return item;
                    }
                    return {
                        ...item,
                        follow: true,
                    };
                });
                set(state => ({
                    ...state,
                    organization: org,
                    followingOA: false,
                }));
            }
        } catch (err) {
            console.log("err: ", err);
        }
    },

    /**
     * Tải thông tin chi tiết của tổ chức/quản lý và lưu vào store
     */
    getOrganization: async (params: GetOrganizationParams) => {
        try {
            set(state => ({
                ...state,
                gettingOrganization: true,
            }));
            const org = await getOrganization(params);

            set(state => ({
                ...state,
                organization: org,
            }));
        } finally {
            set(state => ({
                ...state,
                gettingOrganization: false,
            }));
        }
    },

    /**
     * Tải danh sách bài viết/tin tức của tổ chức theo phân trang và lưu vào store
     */
    getArticles: async (params: GetArticlesParams) => {
        try {
            set(state => ({
                ...state,
                gettingArticles: true,
            }));
            const articles = await getArticles(params);
            set(state => ({
                ...state,

                gettingArticles: false,

                articles: {
                    ...articles,
                    articles: [
                        ...(state.articles?.articles || []),
                        ...articles.articles,
                    ],
                    currentPageSize: articles.currentPageSize,
                    page: articles.page,
                },
            }));
        } catch (err) {
            set(state => ({
                ...state,
                gettingArticles: false,
            }));
        }
    },
});

export default organizationSlice;
