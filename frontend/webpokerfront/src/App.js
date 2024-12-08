import {BrowserRouter, Route, Routes} from "react-router-dom";
import Auth from "./components/pages/Auth";
import Main from "./components/pages/Main";
import Error from "./components/errors/Error"
import Unauthorized from "./components/errors/Unauthorized"
import NoPage from "./components/errors/NoPage";
import UserManager from "./components/elements/UserManager";
import Profile from "./components/pages/Profile";
import EditProfile from "./components/pages/EditProfile";
import CreateLobby from "./components/pages/CreateLobby";
import JoinLobby from "./components/pages/JoinLobby";
import Lobby from "./components/game/Lobby";
import NoAccess from "./components/errors/NoAccess";

function App() {

  return (
      <BrowserRouter>
          <Routes>
              <Route path="/" element={<UserManager child_type={'auth'} child={<Auth/>}/>} />
              <Route path="/main" element={<UserManager child_type={'profile'} child={<Main/>}/>} />
              <Route path="/profile" element={<UserManager child_type={'profile'} child={<Profile/>}/>} />
              <Route path="/profile/edit" element={<UserManager  child_type={'profile'} child={<EditProfile/>}/>} />
              <Route path="/create_lobby" element={<UserManager  child_type={'profile'} child={<CreateLobby/>}/>} />
              <Route path="/join_lobby" element={<UserManager child_type={'profile'} child={<JoinLobby/>}/>} />
              <Route path="/lobby/*" element={<UserManager  child_type={'lobby'} child={<Lobby/>}/>} />
              <Route path="*" element={<UserManager child_type={'auth'} child={<NoPage/>}/>} />
              <Route path="/error" element={<Error/>} />
              <Route path="/noaccess" element={<NoAccess/>} />
              <Route path="/unauthorized" element={<Unauthorized/>} />
          </Routes>
      </BrowserRouter>
  );
}

export default App;
