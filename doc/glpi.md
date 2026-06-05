## 1-) example  GET
`const users   = await glpiGet<GLPIUser[]>('Administration/User');
`

## 2-) example  POST
` 
    const created = await glpiPost<Ticket>('Helpdesk/Ticket', {
        name: 'Problème réseau',
        content: 'Pas d'accès Internet',
        itilcategories_id: 3,
    });
`

## 3-) example  PUT : Remplacer complètement une ressource.
`
await glpiPut('Administration/User/${id}', { ...updatedUser });
`

## 4-) example  PATCH : Mettre à jour partiellement une ressource
`
 await glpiPatch('Administration/User/${id}', { is_active: false });
`

## 5-) example  DELETE
`
 await glpiDelete('Administration/User/${id}');
`