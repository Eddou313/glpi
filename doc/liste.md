## .Some() et .every() : verififcation boolean
`
// Y a-t-il au moins un ticket gratuit (coût = 0) ?
const aDesTicketsGratuits = tickets.some(ticket => ticket.cost === 0);

// Est-ce que TOUS les tickets sont actifs (status = true) ?
const tousActifs = tickets.every(ticket => ticket.status === true);

`
