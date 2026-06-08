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
import { FrontOfficeLayout } from "../pages/inc/layout"
import Imports from "../hooks/import/fichier1_test/import1"
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<Test />}></Route>
          <Route path="/file" element={<Imports />}></Route>
        {/* backoffice */}
          <Route path="/login" element={<LoginPage />}></Route>
          <Route element={<SecureRoute />}>
            <Route path="/user" element={<UsersPage />} />
            <Route path="/admin" element={<UserList />} />
            <Route path="/import" element={<Import />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/Dashboard" element={<DashboardPage />} />
          </Route>
          {/* frontoffice */}
          <Route element={<FrontOfficeLayout />}>
            <Route path="/elements"       element={<ItemsPage />} />
            <Route path="/tickets/create" element={<CreateTicketPage />} />
          </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter