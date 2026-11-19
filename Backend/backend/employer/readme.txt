documention des api partie emplois  :
1.('v1/users/',views.listeuser,name="litse_user"),
 methode : GET :
 tout les utilisateur (customer) de system ,
 resposne 200 sans message return json (id,first_name,last_name )

2.path('v1/users/employer',views.liste_employer,name="litse_employer"),
method :GET :
tout les utlisateur de role agent_administratif 
respose 200 retrun json 

3.path("v1/parteners/",views.get_all_partner,name="get all partner "),