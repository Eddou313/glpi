import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Test } from "../pages/Test"
import UsersPage from "../pages/Users"
import { LoginPage } from "../pages/auth/LoginPages"
import { UserList } from "../pages/TestUsers"
import Import from "../pages/import/Import"

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/login" element={<LoginPage />}></Route>
          <Route path="/a" element={<Test />}></Route>
          <Route path="/user" element={<UsersPage />}></Route>
          <Route path="/admin" element={<UserList />}></Route>
          <Route path="/Import" element={<Import />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter