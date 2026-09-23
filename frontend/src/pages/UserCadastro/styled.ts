import styled from "styled-components";

export const Container = styled.div`
    height: 100hv;
    width: 100wv;
    padding: 30px;

    display: flex;
    justify-content: center;

    form {
        width: 300px;

        button {
            width: 100%;
            cursor: pointer;
            font-weight: bold;

            border: 2px solid black;
            height: 3.6rem;
            border-radius: 8px;
        }

        button:hover {
            background-color: lightblue;
            border-color: blue;
            border-radius: 0px;
            transition: 300ms;
        }
    }
`;
