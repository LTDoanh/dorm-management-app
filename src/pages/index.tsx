import React from "react";
import { Route } from "react-router-dom";
import { AnimationRoutes, ZMPRouter } from "zmp-ui";

import {
    FeedbackPage,
    FeedbackDetailPage,
    CreateFeedbackPage,
} from "./Feedback";
import { GuidelinesPage } from "./Guidelines";
import { HomePage } from "./Home";
import { HomeOwnerPage } from "./HomeOwner";
import { HomeTenantPage } from "./HomeTenant";
import { InformationGuidePage } from "./InformationGuide";
import { CreateScheduleAppointmentPage } from "./CreateScheduleAppointment";
import { AppointmentScheduleResultPage } from "./AppointmentScheduleResult";
import { SearchPage } from "./Search";
import { ProfilePage } from "./Profile";
import { PaymentPage } from "./Payment";
import { BuildingDetailPage } from "./BuildingDetail";
import { RoomDetailPage } from "./RoomDetail";
import { NotificationsPage } from "./Notifications";
import TenantNotificationsPage from "./TenantNotifications/TenantNotificationsPage";

const Routes: React.FC = () => (
    <ZMPRouter>
        <AnimationRoutes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home-owner" element={<HomeOwnerPage />} />
            <Route path="/home-tenant" element={<HomeTenantPage />} />
            <Route path="/building/:buildingId" element={<BuildingDetailPage />} />
            <Route path="/room/:roomId" element={<RoomDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/tenant-notifications" element={<TenantNotificationsPage />} />
            <Route path="/guidelines" element={<GuidelinesPage />} />
            <Route path="/payment" element={<PaymentPage />} />

            <Route path="/feedbacks" element={<FeedbackPage />} />
            <Route path="/feedbacks/:id" element={<FeedbackDetailPage />} />
            <Route path="/create-feedback" element={<CreateFeedbackPage />} />
            <Route
                path="/create-schedule-appointment"
                element={<CreateScheduleAppointmentPage />}
            />
            <Route
                path="/schedule-appointment-result"
                element={<AppointmentScheduleResultPage />}
            />
            <Route
                path="/information-guide"
                element={<InformationGuidePage />}
            />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<ProfilePage />} />
        </AnimationRoutes>
    </ZMPRouter>
);

export default Routes;
