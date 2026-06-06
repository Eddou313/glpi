import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Test } from "../pages/Test"
import UsersPage from "../pages/Users"
import { LoginPage } from "../pages/auth/LoginPages"
import { UserList } from "../pages/TestUsers"
import Import from "../pages/import/Import"
import SecureRoute from "./securiter"
import { TicketsPage } from "../pages/tickets/TicketsPages"

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/login" element={<LoginPage />}></Route>
          <Route path="/" element={<Test />}></Route>
          <Route element={<SecureRoute />}>
            <Route path="/user" element={<UsersPage />} />
            <Route path="/admin" element={<UserList />} />
            <Route path="/import" element={<Import />} />
            <Route path="/Tickets" element={<TicketsPage />} />
          </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter