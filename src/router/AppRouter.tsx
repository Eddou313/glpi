import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Test } from "../pages/Test"
import UsersPage from "../pages/Users"
import { LoginPage } from "../pages/auth/LoginPages"
import { UserList } from "../pages/TestUsers"

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/login" element={<LoginPage />}></Route>
          <Route path="/" element={<Test />}></Route>
          <Route path="/user" element={<UsersPage />}></Route>
          <Route path="/userGlpi" element={<UserList />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter