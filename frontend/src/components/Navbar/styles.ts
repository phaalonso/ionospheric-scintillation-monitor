import styled from "styled-components";

export const Nav = styled.nav`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-left: 30px;
    padding-right: 30px;

    overflow: hidden;
    height: 4rem;
    background-color: #282a35;

    color: white;

    .title {
        font-weight: bold;
    }

    .active {
        color: #55cb93;
        border-bottom: thin solid currentColor;
    }

    a {
        display: flex;
        align-items: center;
        margin-left: 2rem;
        border: 1px solid transparent;

        span {
            flex: 1;
        }

        svg {
            margin-right: 7px;
        }

        &:hover {
            border-bottom: 1px solid white;
            transition: 200ms;
        }
    }
`;

export const UserContainer = styled.div`
    display: flex;
    width: 100%;
    justify-content: flex-end;
    align-items: center;

    button {
        display: flex;
        align-items: center;
        justify-content: center;

        padding: 2px 4px;

        cursor: pointer;
        font-size: 1.4rem;
        color: white;
        font-weight: bold;
        background-color: red;
        border-radius: 4px;
        margin-left: 10px;
        margin-right: 10px;

        &:hover {
            border-radius: 0px;
            background-color: darkred;
            transition: 300ms;
        }

        svg {
            margin-right: 5px;
        }
    }
`;
