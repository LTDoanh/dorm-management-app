import React, { FC } from "react";
import { Header, Icon } from "zmp-ui";
import styled from "styled-components";
import tw from "twin.macro";
import Background from "@assets/header-background.png";

export interface DefaultHeaderProps {
    title?: string;
    back?: boolean;
}

const HeaderContainer = styled(Header)`
    ${tw`flex flex-row items-center bg-main fixed top-0 left-0 w-full text-white px-4 h-[calc(48px + var(--zaui-safe-area-inset-top, 0px))]`};
    z-index: 1;
    background: linear-gradient(
            0deg,
            rgba(4, 109, 214, 0.9),
            rgba(4, 109, 214, 0.9)
        ),
        url(${Background});
    background-size: cover;
    background-position: center;
    .zaui-btn-icon {
        ${tw`text-white`}
    }
    .zaui-header-back-btn:active {
        background-color: transparent;
    }
    &:after {
        display: none;
    }
    .zaui-header-title {
        padding-right: 98px;
    }
`;

const DefaultHeader: FC<DefaultHeaderProps> = props => {
    const { title, back } = props;

    return (
        <HeaderContainer
            title={title}
            backIcon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: "-8px" }}>
                    <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            }
            showBackIcon={back}
        />
    );
};

export default DefaultHeader;
