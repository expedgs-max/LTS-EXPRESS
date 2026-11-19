# Documentation REST API V1

# ROUTES 

* GET /api/v1/users 
 -    Authorization: Bearer <votre_token>
 -   Get all users from database
 -   le seul qui peut voir cette liste est user (Customeruser) avec le role admin 
 -  resposne 200 return json (liste de utlistaeur ) 

* GET v1/users/employer
 - Authorization: Bearer <votre_token>
 - get all users from database with role ="gent_administratif"
 - permmission the only one can see this liste is Customeruser with role admin 
 -reposne 200 return json (liste of user )

* GET v1/parteners/ 
 - Authorization: Bearer <votre_token>
 - get all pertener from database (pertener is table in database )
 - permission two can see pertner liste for now admin and call center 
 - respose 200 : return json 
 - resposen 405 : return message : "eroor":"method not allow"

* GET v1/users/chefbureau 
 - Authorization: Bearer <votre_token> 
 - get all user with role ="chef_bureau"
 - permission only role admin can see this liste 
 - respose 200 return liste of user format json 
 
* POST v1/users/employer/create/ 
 - Authorization: Bearer <votre_token> 
 - creater new user with role : admin,
 -body json:
  ["username","nom","role","prenom","date_de_naissance","email","wilaya",phone_number_1,groupe,lieux,]
  -json response "message": "User created successfully" statut 201 
  - HTTP_400_BAD_REQUEST exception as e : message eros 
  - 405 error : method not allow 
 - permission only role admin can see this liste 
 - 


