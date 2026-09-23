import styled from "styled-components";

export const Main = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;

    form {
        width: 350px;
        display: flex;
        flex-direction: column;

        h1 {
            text-align: center;
            font-size: 2rem;
            margin-bottom: 2rem;
        }

        button {
            cursor: pointer;
            font-weight: bold;

            border: 2px solid black;
            height: 3.6rem;
            border-radius: 8px;
        }

        button:hover {
            border-color: blue;
            border-radius: 0px;
            transition: 300ms;
        }
    }
`;
