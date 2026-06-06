import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Test } from "../pages/Test"
import UsersPage from "../pages/Users"
import { LoginPage } from "../pages/auth/LoginPages"
import { UserList } from "../pages/TestUsers"
import Import from "../pages/import/Import"
import SecureRoute from "./securiter"
import { TicketsPage } from "../pages/tickets/TicketsPages"
import { ItemsPage } from "../pages/FrontOffice/elements/ItemsPages"
import { CreateTicketPage } from "../pages/FrontOffice/Tickets/TicketForm"
import { DashboardPage } from "../pages/dashbord/DashbordPages"

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<Test />}></Route>
        {/* backoffice */}
          <Route path="/login" element={<LoginPage />}></Route>
          <Route element={<SecureRoute />}>
            <Route path="/user" element={<UsersPage />} />
            <Route path="/admin" element={<UserList />} />
            <Route path="/import" element={<Import />} />
            <Route path="/Tickets" element={<TicketsPage />} />
            <Route path="/Dashboard" element={<DashboardPage />} />
          </Route>
          {/* frontoffice */}
          <Route path="/elements" element={<ItemsPage />}></Route>
          <Route path="/Tickets/create" element={<CreateTicketPage />}></Route>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter