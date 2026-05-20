import { Feedback, Feedbacks, FeedbackType } from "@dts";
import {
    createFeedback,
    CreateFeedbackParams,
    getFeedbacks,
    GetFeedbacksParams,
    GetFeedbackTypeParams,
    getFeedbackTypes,
} from "@service/services.mock";
import { StateCreator } from "zustand";

export interface FeedbackSlice {
    creatingFeedback?: boolean;
    gettingFeedback?: boolean;
    gettingFeedbackType?: boolean;
    feedbacks?: Feedbacks;
    feedbackResult?: boolean;
    feedbackTypes?: FeedbackType[];
    feedbackDetail?: Feedback;
    createFeedback: (
        feedback: CreateFeedbackParams,
        organizationId: string,
    ) => Promise<boolean>;
    getFeedbacks: (params: GetFeedbacksParams) => Promise<void>;
    getFeedbackTypes: (params: GetFeedbackTypeParams) => Promise<void>;
    getFeedback: (params: { id: number }) => void;
}

const feedbackSlice: StateCreator<FeedbackSlice> = (set, get) => ({
    creatingFeedback: false,
    gettingFeedback: false,
    gettingFeedbackType: false,

    /**
     * Gửi yêu cầu phản hồi mới và lưu trạng thái kết quả phản hồi vào store
     */
    createFeedback: async (
        feedback: CreateFeedbackParams,
        organizationId: string,
    ) => {
        try {
            set(state => ({
                ...state,
                creatingFeedback: true,
            }));
            const rs = await createFeedback(feedback, organizationId);

            set(state => ({
                ...state,
                feedbackResult: rs,
            }));
            return rs;
        } finally {
            set(state => ({
                ...state,
                creatingFeedback: false,
            }));
        }
    },

    /**
     * Tải danh sách phản hồi/góp ý theo phân trang và cập nhật vào store
     */
    getFeedbacks: async (params: GetFeedbacksParams) => {
        try {
            const { firstFetch = false } = params;

            set(state => ({
                ...state,
                gettingFeedback: true,
            }));
            const feedbacks = await getFeedbacks(params);

            set(state => ({
                ...state,
                gettingFeedback: false,
                feedbacks: {
                    ...feedbacks,
                    feedbacks: firstFetch
                        ? feedbacks.feedbacks
                        : [
                              ...(state.feedbacks?.feedbacks || []),
                              ...feedbacks.feedbacks,
                          ],
                    currentPageSize: feedbacks.currentPageSize,
                    page: feedbacks.page,
                },
            }));
        } catch (err) {
            set(state => ({
                ...state,
                gettingFeedback: false,
            }));
        }
    },

    /**
     * Tải danh sách phân loại phản hồi/góp ý từ máy chủ
     */
    getFeedbackTypes: async (params: GetFeedbackTypeParams) => {
        try {
            set(state => ({
                ...state,
                gettingFeedbackType: true,
            }));
            const feedbackTypes = await getFeedbackTypes(params);
            set(state => ({
                ...state,

                gettingFeedbackType: false,
                feedbackTypes,
            }));
        } catch (err) {
            set(state => ({
                ...state,
                gettingFeedbackType: false,
            }));
        }
    },

    /**
     * Tìm kiếm và trích xuất thông tin chi tiết của một phản hồi có sẵn trong store
     */
    getFeedback: (params: { id: number }) => {
        const { id } = params;

        const feedback = get().feedbacks?.feedbacks.find(
            item => item.id === id,
        );
        set(state => ({ ...state, feedbackDetail: feedback }));
    },
});

export default feedbackSlice;
