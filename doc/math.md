## Arrondis
`const prix = 10.5678;

return (
  <div>
    <p>Arrondi normal : {Math.round(prix)}</p> {/* 11 */}
    <p>Arrondi au-dessus : {Math.ceil(prix)}</p> {/* 11 */}
    <p>Arrondi au-dessous : {Math.floor(prix)}</p> {/* 10 */}
    <p>Prix formaté : {prix.toFixed(2)} €</p> {/* "10.57 €" */}
  </div>
);

`
## Max / Min
Math.max(a, b, c...) : Renvoie le plus grand nombre.

Math.min(a, b, c...) : Renvoie le plus petit nombre.

Math.abs(x) : Renvoie la valeur absolue (transforme les nombres négatifs en positifs).
`
const coutMax = useMemo(() => {
  if (tickets.length === 0) return 0;
  // On extrait tous les coûts dans un tableau, et on utilise "..." pour les passer à Math.max
  return Math.max(...tickets.map(t => t.cost));
}, [tickets]);

`
## total :
`
    const totalCost = useMemo(() => {
    return tickets.reduce((somme, ticket) => somme + ticket.cost, 0);
    }, [tickets]); // Ne recalcule QUE si la liste "tickets" change.

`
## Aleatoir
`
    // Générer un ID entier aléatoire entre 1 et 1000
    const idAleatoire = Math.floor(Math.random() * 1000) + 1;

`