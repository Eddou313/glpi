import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Test } from "../pages/Test"
import UsersPage from "../pages/Users"
import { LoginPage } from "../pages/auth/LoginPages"

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/login" element={<LoginPage />}></Route>
          <Route path="/" element={<Test />}></Route>
          <Route path="/user" element={<UsersPage />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter