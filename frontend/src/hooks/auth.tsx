import axios from "axios";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { api } from "../services/api";

export interface LoginCredentials {
    email: string;
    password: string;
}

interface User {
    id: string;
    nome: string;
    email: string;
}

interface AuthContextData {
    singIn(credentials: LoginCredentials): Promise<void>;
    singOut(): void;
    updateUser(user: User): void;
    data: AuthState;
}

interface AuthState {
    token: string;
    user: User;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC = ({ children }) => {
    const [data, setData] = useState<AuthState>(() => {
        const token = localStorage.getItem("@gnss:token");
        const user = localStorage.getItem("@gnss:user");

        if (token && user) {
            api.defaults.headers.authorization = `Bearer ${token}`;

            return { token, user: JSON.parse(user) };
        }

        return {} as AuthState;
    });

    const singIn = useCallback(
        async ({ email, password }: LoginCredentials) => {
            console.log("Realizando o login");
            const res = await api.post("/session", {
                email,
                password,
            });

            const { token, user } = res.data;

            user.email = email;

            console.log("Token", token);
            localStorage.setItem("@gnss:token", token);
            localStorage.setItem("@gnss:user", JSON.stringify(user));
            api.defaults.headers.authorization = `Bearer ${token}`;

            setData({ token, user });
        },
        [],
    );

    const singOut = useCallback(() => {
        localStorage.removeItem("@gnss:token");
        localStorage.removeItem("@gnss:user");
        setData({} as AuthState);
    }, []);

    const updateUser = useCallback(
        (user: User) => {
            setData({
                token: data.token,
                user,
            });

            localStorage.setItem("@gnss:user", JSON.stringify(user));
        },
        [data.token, setData],
    );

    useEffect(() => {
        console.info("Use effect");
        if (!data.token) {
            return;
        }

        api.get("/session/validate").catch((err) => {
            if (axios.isAxiosError(err) && err.response) {
                singOut();
                alert("Sessão expirada, entre novamente");
                return;
            }

            alert("Erro desconhecido, tente novamente mais tarde");
        });
    }, [data.token, singOut]);

    return (
        <AuthContext.Provider value={{ data, singIn, singOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

function useAuth(): AuthContextData {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}

export { AuthProvider, useAuth };
