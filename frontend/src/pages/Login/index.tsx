import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";
import React, { useRef } from "react";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";
import Input from "../../components/Input";
import { LoginCredentials, useAuth } from "../../hooks/auth";
import getValidationError from "../../utils/ValidationErrors";
import { Main } from "./stypes";

const Login: React.FC = () => {
    const formRef = useRef<FormHandles>(null);

    const auth = useAuth();
    const history = useHistory();

    const onSubmit = async (data: LoginCredentials) => {
        try {
            console.log(data);
            const schema = Yup.object().shape({
                email: Yup.string()
                    .email("Preencha um email válido")
                    .required("Email é obrigatório"),
                password: Yup.string()
                    .required("Preencha uma senha")
                    .min(6, "A senha deve ter pelo menos 6 caracteres"),
            });

            await schema.validate(data, {
                abortEarly: false,
            });

            await auth.singIn(data);
            history.push("/");
        } catch (err) {
            if (err instanceof Yup.ValidationError) {
                const erros = getValidationError(err);

                formRef.current?.setErrors(erros);
                return;
            }

            console.error(err);
            alert("Não foi possível logar");
        }
    };

    return (
        <Main>
            <Form ref={formRef} onSubmit={onSubmit}>
                <h1>Login</h1>
                <Input name="email" label="Email" type="email" />
                <Input name="password" label="Senha" type="password" />

                <button type="submit">Logar</button>
            </Form>
        </Main>
    );
};

export default Login;
