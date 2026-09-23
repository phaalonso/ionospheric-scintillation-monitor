import styled from "styled-components";

export const Container = styled.div`
    display: flex;
    flex-direction: column;

    height: 100hv;
    width: 100wv;
    padding: 30px;
`;

export const TableContainer = styled.div`
    width: 100%;
    overflow: auto;
`;

export const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin: 25px 0;
    font-family: sans-serif;
    min-width: 400px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);

    thead tr {
        background-color: #009879;
        color: #ffffff;
        text-align: left;
    }

    th,
    td {
        padding: 12px 15px;
    }

    tbody tr {
        border-bottom: thin solid #dddddddd;

        &:nth-of-type(even):not(.active) {
            background-color: #f3f3f3;
        }

        &:last-of-type {
            border-bottom: 2px solid #009879;
        }

        &:hover:not(.active) {
            background-color: #dfdfdfdd;
        }
    }

    .active {
        background-color: lightblue;
    }
`;

export const ActionButtons = styled.div`
    display: flex;
    flex-direction: row;

    .box {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.4rem;
        border-radius: 4px;
        padding: 5px;

        svg {
            stroke-width: 2px;
        }

        &:first-child {
            margin-right: 10px;
            background-color: lightyellow;

            &:hover {
                color: #f08909;
                box-shadow:
                    rgba(0, 0, 0, 0.16) 0px 3px 6px,
                    rgba(0, 0, 0, 0.23) 0px 3px 6px;
                transition: 200ms;
            }
        }

        &:last-child {
            background-color: #ff7f7f;

            &:hover {
                background-color: #900000;
                color: white;
                box-shadow:
                    rgba(0, 0, 0, 0.16) 0px 3px 6px,
                    rgba(0, 0, 0, 0.23) 0px 3px 6px;
                transition: 200ms;
            }
        }
    }
`;

export const NewUserBtn = styled.button`
    display: flex;

    cursor: pointer;
    background-color: #009879;
    border-radius: 4px;
    color: white;
    font-family: sans-serif;
    font-weight: 700;
    padding: 10px 10px;

    margin-top: 10px;

    svg {
        margin-right: 5px;
        stroke-width: 4px;
    }

    &:hover {
        box-shadow:
            rgba(0, 0, 0, 0.16) 0px 3px 6px,
            rgba(0, 0, 0, 0.23) 0px 3px 6px;
        transition: 200ms;
    }
`;
