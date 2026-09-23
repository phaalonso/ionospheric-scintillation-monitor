import { useField } from "@unform/core";
import React, { useEffect, useRef } from "react";

import { InputContainer } from "./styled";

interface Props {
    name: string;
    label?: string;
}

type InputProps = JSX.IntrinsicElements["input"] & Props;

export default function Input({ name, label, ...rest }: InputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const { fieldName, defaultValue, registerField, error } = useField(name);

    useEffect(() => {
        registerField({
            name: fieldName,
            ref: inputRef,
            getValue: (ref) => {
                return ref.current.value;
            },
            setValue: (ref, value) => {
                ref.current.value = value;
            },
            clearValue: (ref) => {
                ref.current.value = "";
            },
        });
    }, [fieldName, registerField]);

    return (
        <InputContainer>
            {label && <label htmlFor={fieldName}>{label}</label>}

            <input
                id={fieldName}
                ref={inputRef}
                defaultValue={defaultValue}
                {...rest}
            />

            {error && <span>{error}</span>}
        </InputContainer>
    );
}
