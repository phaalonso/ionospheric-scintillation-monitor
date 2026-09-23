import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";
import React, { useEffect, useRef } from "react";
import Input from "../../components/Input";
import Navbar from "../../components/Navbar";
import { Container } from "./styled";
import * as Yup from "yup";
import getValidationError from "../../utils/ValidationErrors";
import Toggle from "../../components/Toggle";
import { api } from "../../services/api";
import { useHistory, useLocation } from "react-router";
import axios from "axios";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const UserCadastro: React.FC = () => {
    const query = useQuery();
    const history = useHistory();
    const formRef = useRef<FormHandles>(null);

    const editId = query.get("edit");

    console.log(editId);

    useEffect(() => {
        if (editId) {
            api.get(`/user/${editId}`).then(({ data, status }) => {
                if (status === 200) {
                    console.log(data);
                    formRef?.current?.setData(data);
                    //formRef?.current?.setFieldValue('password', '');
                }
            });
        }
    }, [editId]);

    const onSubmit = async (data: any) => {
        try {
            if (editId) {
                const schema = Yup.object().shape({
                    nome: Yup.string().required(
                        "O nome precisa ser preenchdio",
                    ),
                    nickname: Yup.string().required(
                        "O nickname precisa ser preenchdio",
                    ),
                    email: Yup.string()
                        .required("O email precisa ser preenchido")
                        .email("Email inválido"),
                    password: Yup.string()
                        .optional()
                        .min(6, "A senha deve ter pelo mneos 6 caracteres"),
                    administrator: Yup.boolean().required(),
                });

                const res = await api.put(`/user/${editId}`, data);

                console.log(res.status);

                if (res.status === 200) {
                    formRef?.current?.reset();
                    history.go(-1);
                }
            } else {
                const schema = Yup.object().shape({
                    nome: Yup.string().required(
                        "O nome precisa ser preenchdio",
                    ),
                    nickname: Yup.string().required(
                        "O nickname precisa ser preenchdio",
                    ),
                    email: Yup.string()
                        .required("O email precisa ser preenchido")
                        .email("Email inválido"),
                    password: Yup.string()
                        .required("Preencha a senha")
                        .min(6, "A senha deve ter pelo mneos 6 caracteres"),
                    administrator: Yup.boolean().required(),
                });

                await schema.validate(data, {
                    abortEarly: false,
                });

                console.log(data);

                const res = await api.post("/user", data);

                if (res.status === 201) {
                    alert("Usuário criado");
                    formRef?.current?.reset();
                    history.go(-1);
                }

                formRef?.current?.setErrors({});
            }
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                const erros = getValidationError(error);

                formRef?.current?.setErrors(erros);
                return;
            }

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 412) {
                    alert(
                        "Não é possível remover o único usuário adminsitrador",
                    );
                    return;
                }

                console.log(error.response);
            }

            alert(
                `Não foi possível ${editId ? "editar" : "cadastrar"} o usuário`,
            );
        }
    };

    return (
        <div>
            <Navbar />
            <Container>
                <Form ref={formRef} onSubmit={onSubmit}>
                    <span>
                        {editId
                            ? `Editar o usuário de id ${editId}`
                            : "Cadastrar um usuário"}
                    </span>
                    <Input name="nome" label="Nome" />
                    <Input name="nickname" label="Nickname" />
                    <Input name="email" label="Email" type="email" />
                    <Input name="password" label="Senha" type="password" />
                    <Toggle
                        label="Administrador"
                        name="administrator"
                        checked={false}
                    />
                    <button type="submit">
                        {editId ? "Editar" : "Cadastrar"}
                    </button>
                </Form>
            </Container>
        </div>
    );
};

export default UserCadastro;
