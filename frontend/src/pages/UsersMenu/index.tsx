import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { api } from "../../services/api";
import {
    ActionButtons,
    Container,
    NewUserBtn,
    Table,
    TableContainer,
} from "./styled";
import { FiEdit, FiPlus, FiTrash2 } from "react-icons/fi";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";

interface UserInfo {
    id: number;
    email: string;
    nickname: string;
    nome: string;
    administrator: boolean;
}

const UsersMenu: React.FC = () => {
    const location = useLocation();
    const [users, setUsers] = useState<UserInfo[]>([]);
    // const [selectIndex, setSelectIndex] = useState<number>();

    useEffect(() => {
        api.get<UserInfo[]>("/user")
            .then(({ data, status }) => {
                if (status === 200) {
                    console.log(data);
                    setUsers(data);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }, []);

    // const onRowClick = (index: number) => {
    //   setSelectIndex(index === selectIndex ? -1 : index);
    // };

    const onUserDelete = async (userId: number) => {
        const hasAnotherAdmin = users.find(
            (u) => u.id !== userId && u.administrator,
        );

        if (!hasAnotherAdmin) {
            alert("Não é possível excluir o único usuário administrador");
            return;
        }

        try {
            await api.delete(`/user/${userId}`);
            setUsers(users.filter((u) => u.id !== userId));
            alert("Usuário deletado");
        } catch (error) {
            alert("Não foi possível deletar o usuário");
            console.log(error);
        }
    };

    return (
        <div>
            <Navbar pathName={location.pathname} />
            <Container>
                Usuarios
                <div>
                    <Link to="/user/cadastro">
                        <NewUserBtn>
                            <FiPlus />
                            Novo usuário
                        </NewUserBtn>
                    </Link>
                </div>
                <TableContainer>
                    <Table>
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Nome</th>
                                <th>Nickname</th>
                                <th>Email</th>
                                <th>Administrador</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr
                                    key={index}
                                    // onClick={() => onRowClick(index)}
                                    // className={selectIndex === index ? "active" : ""}
                                >
                                    <td>{user.id}</td>
                                    <td>{user.nome}</td>
                                    <td>{user.nickname}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        {user.administrator ? "Sim" : "Não"}
                                    </td>
                                    <td>
                                        <ActionButtons>
                                            <Link
                                                className="box"
                                                to={`/user/cadastro?edit=${user.id}`}
                                            >
                                                <FiEdit />
                                            </Link>
                                            <button
                                                className="box"
                                                onClick={() =>
                                                    onUserDelete(user.id)
                                                }
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </ActionButtons>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </TableContainer>
            </Container>
        </div>
    );
};

export default UsersMenu;
