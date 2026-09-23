import styled from "styled-components";

export const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    font-size: 1.5rem;

    label {
        font-weight: 500;
    }

    input {
        width: 100%;

        padding: 12px 20px;
        margin: 8px 0%;
        height: 3.5rem;

        border: 2px solid black;
        border-radius: 4px;
    }

    input + span {
        color: red;
        font-size: 1.3rem;
        padding-bottom: 10px;
    }
`;
