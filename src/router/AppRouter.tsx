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
import Imports from "../hooks/import/fichier1_test/features/import1"
import { ParameterPages } from "../pages/parameter/ParameterPages"
import TicketKanban from "../pages/FrontOffice/Tickets/TicketKanban"
import { CostsPage } from "../pages/FrontOffice/Tickets/Cost"
import GlpiTicketsCostsPage from "../pages/tickets/ConstTickets"
import { Cost } from "../pages/tickets/Cost"

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Test />}></Route>
        <Route path="/file" element={<Import />}></Route>
        {/* backoffice */}
        <Route path="/login" element={<LoginPage />}></Route>
        <Route element={<SecureRoute />}>
          <Route path="/user" element={<UsersPage />} />
          <Route path="/admin" element={<UserList />} />
          <Route path="/import" element={<Imports />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/Dashboard" element={<DashboardPage />} />
          <Route path="/Parameter" element={<ParameterPages />} />
          <Route path="/Costs" element={<CostsPage />} />
          <Route path="/CostsTickets" element={<GlpiTicketsCostsPage />} />
        </Route>
        {/* frontoffice */}
        <Route element={<FrontOfficeLayout />}>
          <Route path="/elements" element={<ItemsPage />} />
          <Route path="/TicketView" element={<TicketKanban />} />
          <Route path="/tickets/create" element={<CreateTicketPage />} />
          <Route path="/Cost" element={< Cost />}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter