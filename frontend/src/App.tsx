import React from "react";
import { BrowserRouter as Router, Switch } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Route from "./components/Route";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersMenu from "./pages/UsersMenu";
import UserCadastro from "./pages/UserCadastro";

const App: React.FC = () => {
    return (
        <Router>
            <Switch>
                <Route path="/login" exact component={Login} />
                <Route path="/user" exact isPrivate component={UsersMenu} />
                <Route
                    path="/user/cadastro"
                    exact
                    isPrivate
                    component={UserCadastro}
                />
                <Route path="/" exact isPrivate component={Dashboard} />
                <Route component={NotFound} />
            </Switch>
        </Router>
    );
};

export default App;
