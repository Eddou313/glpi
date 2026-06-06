import type { GLPITicket } from "../../types/tickets/tickes.types";
export function TicketDetails({ ticket }: any) {
  return (
    <pre>
      {JSON.stringify(ticket, null, 2)}
    </pre>
  );
}
// export function TicketDetails({ ticket }: { ticket: GLPITicket }) {
//   return (
//     <div>
//       <h2>Ticket #{ticket.id}</h2>

//       <h3>{ticket.name}</h3>

//       <p>{ticket.content || "Aucun contenu"}</p>

//       <hr />

//       <p>Status: {ticket.status}</p>
//       <p>Urgence: {ticket.urgency}</p>
//       <p>Priorité: {ticket.priority}</p>
//       <p>Date: {ticket.date}</p>

//       {ticket.requester && (
//         <p>Demandeur: {ticket.requester.name}</p>
//       )}

//       {ticket.technician && (
//         <p>Technicien: {ticket.technician.name}</p>
//       )}
//     </div>
//   );
// }