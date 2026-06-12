Endpoint (POST) : https://votre-glpi/apirest.php/Ticket_User

{
   "input": {
      "tickets_id": 42, 
      "users_id": 15,
      "type": 1
   }
}


Endpoint (POST) : https://votre-glpi/api.php/v2/Assistance/Ticket/{ticket_id}/TeamMember

{
   "user": 15,
   "role": 1
   "itemtype": "User"
}