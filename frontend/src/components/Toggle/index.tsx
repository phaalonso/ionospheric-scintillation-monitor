import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Container, Slider, Switch, GroupInput } from "./styled";
import { useField } from "@unform/core";

interface ToggleProps {
    name: string;
    label?: string;
}

type InputProps = ToggleProps & JSX.IntrinsicElements["input"];

const Toggle: React.FC<InputProps> = ({
    name,
    label,
    checked = false,
    ...rest
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { fieldName, registerField } = useField(name);

    useEffect(() => {
        registerField({
            name: fieldName,
            ref: inputRef,
            getValue: (ref) => {
                return ref.current.checked;
            },
            setValue: (ref, value) => {
                ref.current.checked = value;
            },
            clearValue: (ref) => {
                ref.current.checked = false;
            },
        });
    }, [fieldName, registerField]);

    return (
        <GroupInput>
            {label && <label htmlFor={fieldName}>{label}</label>}
            <Container>
                <Switch>
                    <input
                        ref={inputRef}
                        defaultChecked={checked}
                        type="checkbox"
                        {...rest}
                    />
                    <Slider />
                </Switch>
            </Container>
        </GroupInput>
    );
};

Toggle.propTypes = {
    checked: PropTypes.bool,
};

export default Toggle;
