import { useEffect, useState } from "react";
import { useCostTicketsGLPI, type TicketsCostReel } from "../../hooks/costs/useCostTicketsGLPI";
import "./cost.css"

export function Cost() {
    const { getCostByTickets } = useCostTicketsGLPI();

    const [Ticket, setTicket] = useState<TicketsCostReel | null>();
    useEffect(() => {
        const loadTickets = async () => {
            try {
                setTicket(await getCostByTickets(1727));
            } catch (error) { }
        }
        loadTickets();
    }, [])
    return (
        <div>
            <h1>Tickets</h1>
            <pre>
                {JSON.stringify(Ticket, null, 2)}
            </pre>
        </div>
    );
}

export default Cost;